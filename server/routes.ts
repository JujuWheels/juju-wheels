import type { Express } from "express";
import { type Server } from "http";
import {
  getMakes as wsMakes,
  getModels as wsModels,
  getYears as wsYears,
  getGenerations as wsGenerations,
  getModifications as wsModifications,
  searchByModel as wsSearchByModel,
} from "./lib/wheelSize";
import {
  getAllCollections,
  getAllWheels,
  getAllCollectionProductsPaginated,
  getAllBcRacingProductsAdmin,
  getAllProductsForSitemap,
  getCollectionByHandle,
  getProductByHandle,
  getProducts,
  getPageByHandle,
  getAllPages,
  searchProducts,
  createCart,
  getCart,
  addToCart,
  updateCartLines,
  removeFromCart,
  getOrdersByEmail,
  getShopId,
  sendAnalyticsToShopify,
} from "./lib/shopify";
import { isAuthenticated } from "./replit_integrations/auth";
import { authStorage } from "./replit_integrations/auth/storage";
import { storage } from "./storage";
import { insertSavedSpecSchema, insertGarageVehicleSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ─── CONFIG ────────────────────────────────────────────────

  app.get("/api/config", (_req, res) => {
    const domain = process.env.SHOPIFY_STORE_DOMAIN || "";
    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    res.json({ shopifyDomain: cleanDomain });
  });

  // ─── COLLECTIONS ────────────────────────────────────────────

  app.get("/api/collections", async (_req, res) => {
    try {
      const collections = await getAllCollections();
      res.json(collections);
    } catch (err: any) {
      console.error("Error fetching collections:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/all-wheels", async (_req, res) => {
    try {
      const products = await getAllWheels();
      res.json(products);
    } catch (err: any) {
      console.error("Error fetching all wheels:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/collections/:handle/all", async (req, res) => {
    try {
      const { handle } = req.params;
      // For BC Racing: try Admin API first (returns drafts too), fall back to Storefront
      if (handle === "bc-racing") {
        try {
          const products = await getAllBcRacingProductsAdmin();
          return res.json(products);
        } catch (adminErr: any) {
          console.warn("Admin API unavailable for bc-racing, falling back to Storefront:", adminErr.message);
        }
      }
      const products = await getAllCollectionProductsPaginated(handle);
      res.json(products);
    } catch (err: any) {
      console.error(`Error fetching all products for ${req.params.handle}:`, err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/collections/:handle", async (req, res) => {
    try {
      const { handle } = req.params;
      const sortKey = (req.query.sortKey as string) || "BEST_SELLING";
      const reverse = req.query.reverse === "true";
      const first = parseInt(req.query.first as string) || 250;
      const collection = await getCollectionByHandle(handle, first, sortKey, reverse);
      if (!collection) {
        return res.status(404).json({ error: "Collection not found" });
      }
      res.json(collection);
    } catch (err: any) {
      console.error("Error fetching collection:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── PRODUCTS ───────────────────────────────────────────────

  app.get("/api/products", async (req, res) => {
    try {
      const first = parseInt(req.query.first as string) || 100;
      const sortKey = (req.query.sortKey as string) || "CREATED_AT";
      const reverse = req.query.reverse !== "false";
      const products = await getProducts(first, sortKey, reverse);
      res.json(products);
    } catch (err: any) {
      console.error("Error fetching products:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/products/:handle", async (req, res) => {
    try {
      const { handle } = req.params;
      const product = await getProductByHandle(handle);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (err: any) {
      console.error("Error fetching product:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── PAGES ──────────────────────────────────────────────────

  app.get("/api/pages/:handle", async (req, res) => {
    try {
      const { handle } = req.params;
      const page = await getPageByHandle(handle);
      if (!page) {
        return res.status(404).json({ error: "Page not found" });
      }
      res.json(page);
    } catch (err: any) {
      console.error("Error fetching page:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── SEARCH ─────────────────────────────────────────────────

  app.get("/api/search", async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q) return res.json([]);
      const type = req.query.type as string | undefined;
      const results = await searchProducts(q, 20, type || undefined);
      res.json(results);
    } catch (err: any) {
      console.error("Error searching:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── CART ───────────────────────────────────────────────────

  app.post("/api/cart", async (_req, res) => {
    try {
      const cart = await createCart();
      res.json(cart);
    } catch (err: any) {
      console.error("Error creating cart:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/cart/:cartId", async (req, res) => {
    try {
      const { cartId } = req.params;
      const cart = await getCart(decodeURIComponent(cartId));
      if (!cart) {
        return res.status(404).json({ error: "Cart not found" });
      }
      res.json(cart);
    } catch (err: any) {
      console.error("Error fetching cart:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/cart/:cartId/lines", async (req, res) => {
    try {
      const { cartId } = req.params;
      const { lines } = req.body;
      if (!lines || !Array.isArray(lines)) {
        return res.status(400).json({ error: "lines array is required" });
      }
      const cart = await addToCart(decodeURIComponent(cartId), lines);
      res.json(cart);
    } catch (err: any) {
      console.error("Error adding to cart:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/cart/:cartId/lines", async (req, res) => {
    try {
      const { cartId } = req.params;
      const { lines } = req.body;
      if (!lines || !Array.isArray(lines)) {
        return res.status(400).json({ error: "lines array is required" });
      }
      const cart = await updateCartLines(decodeURIComponent(cartId), lines);
      res.json(cart);
    } catch (err: any) {
      console.error("Error updating cart:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/cart/:cartId/lines", async (req, res) => {
    try {
      const { cartId } = req.params;
      const { lineIds } = req.body;
      if (!lineIds || !Array.isArray(lineIds)) {
        return res.status(400).json({ error: "lineIds array is required" });
      }
      const cart = await removeFromCart(decodeURIComponent(cartId), lineIds);
      res.json(cart);
    } catch (err: any) {
      console.error("Error removing from cart:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── ORDERS (Admin API) ────────────────────────────────────

  app.get("/api/orders", isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.claims.sub);
      const email = user?.marketingEmail || user?.email;
      if (!email) {
        return res.json([]);
      }
      const orders = await getOrdersByEmail(email);
      res.json(orders);
    } catch (err: any) {
      console.error("Error fetching orders:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── SAVED SPECS ──────────────────────────────────────────

  app.get("/api/saved-specs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const specs = await storage.getSavedSpecs(userId);
      res.json(specs);
    } catch (err: any) {
      console.error("Error fetching saved specs:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/saved-specs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await authStorage.getUser(userId);
      if (!user?.phone || !user?.marketingEmail || !user?.address || !user?.city || !user?.postalCode || !user?.country) {
        return res.status(403).json({ error: "Please complete your profile before saving specs." });
      }
      const parsed = insertSavedSpecSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid spec data", details: parsed.error.flatten() });
      }
      const spec = await storage.createSavedSpec(userId, parsed.data);
      res.json(spec);
    } catch (err: any) {
      console.error("Error saving spec:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/saved-specs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      const deleted = await storage.deleteSavedSpec(userId, id);
      if (!deleted) {
        return res.status(404).json({ error: "Spec not found" });
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error("Error deleting spec:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/image-proxy", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) {
        return res.status(400).json({ error: "Invalid URL" });
      }
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".shopify.com")) {
          return res.status(400).json({ error: "Invalid URL" });
        }
      } catch {
        return res.status(400).json({ error: "Invalid URL" });
      }
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(response.status).json({ error: "Fetch failed" });
      }
      const contentType = response.headers.get("content-type") || "image/jpeg";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      const buffer = Buffer.from(await response.arrayBuffer());
      res.send(buffer);
    } catch (err: any) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── MY GARAGE ─────────────────────────────────────────────

  app.get("/api/garage", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const vehicles = await storage.getGarageVehicles(userId);
      res.json(vehicles);
    } catch (err: any) {
      console.error("Error fetching garage:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/garage", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertGarageVehicleSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid vehicle data", details: parsed.error.flatten() });
      }
      const vehicle = await storage.addGarageVehicle(userId, parsed.data);
      res.json(vehicle);
    } catch (err: any) {
      console.error("Error adding to garage:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/garage/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      const deleted = await storage.deleteGarageVehicle(userId, id);
      if (!deleted) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error("Error deleting from garage:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── WHEEL SIZE API ──────────────────────────────────────────

  app.get("/api/wheel-size/makes", async (_req, res) => {
    try {
      const data = await wsMakes();
      res.json(data);
    } catch (err: any) {
      console.error("Error fetching makes:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/wheel-size/models", async (req, res) => {
    try {
      const make = req.query.make as string;
      if (!make) return res.status(400).json({ error: "make is required" });
      const data = await wsModels(make);
      res.json(data);
    } catch (err: any) {
      console.error("Error fetching models:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/wheel-size/years", async (req, res) => {
    try {
      const make = req.query.make as string;
      const model = req.query.model as string;
      if (!make || !model) return res.status(400).json({ error: "make and model are required" });
      const data = await wsYears(make, model);
      res.json(data);
    } catch (err: any) {
      console.error("Error fetching years:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/wheel-size/modifications", async (req, res) => {
    try {
      const make = req.query.make as string;
      const model = req.query.model as string;
      const year = req.query.year as string;
      if (!make || !model || !year) return res.status(400).json({ error: "make, model, and year are required" });
      const generation = req.query.generation as string | undefined;
      const data = await wsModifications(make, model, year, generation);
      res.json(data);
    } catch (err: any) {
      console.error("Error fetching modifications:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/wheel-size/search", async (req, res) => {
    try {
      const make = req.query.make as string;
      const model = req.query.model as string;
      const year = req.query.year as string;
      if (!make || !model || !year) return res.status(400).json({ error: "make, model, and year are required" });
      const modification = req.query.modification as string | undefined;
      const generation = req.query.generation as string | undefined;
      const data = await wsSearchByModel(make, model, year, modification, generation);
      res.json(data);
    } catch (err: any) {
      console.error("Error searching by model:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── ROBOTS.TXT ────────────────────────────────────────────
  app.get("/robots.txt", (_req, res) => {
    res.set("Content-Type", "text/plain");
    res.send(
      `User-agent: *\n` +
      `Allow: /\n` +
      `Disallow: /my-account\n` +
      `Disallow: /my-garage\n` +
      `Disallow: /login\n` +
      `Disallow: /api/\n` +
      `\n` +
      `Sitemap: https://jujuwheels.com/sitemap.xml\n`
    );
  });

  // ─── SITEMAP ────────────────────────────────────────────────
  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const baseUrl = "https://jujuwheels.com";
      const staticPages = [
        { loc: "/", priority: "1.0", changefreq: "daily" },
        { loc: "/sale", priority: "0.9", changefreq: "daily" },
        { loc: "/pre-order", priority: "0.8", changefreq: "weekly" },
        { loc: "/parts-configurator", priority: "0.8", changefreq: "monthly" },
        { loc: "/stanceparts", priority: "0.8", changefreq: "weekly" },
        { loc: "/bc-racing", priority: "0.8", changefreq: "weekly" },
        { loc: "/fitment-calculator", priority: "0.8", changefreq: "monthly" },
        { loc: "/wheel-spec-calculator", priority: "0.8", changefreq: "monthly" },
        { loc: "/vehicle-fitment", priority: "0.8", changefreq: "monthly" },
        { loc: "/authenticity", priority: "0.6", changefreq: "monthly" },
        { loc: "/knowledge", priority: "0.6", changefreq: "monthly" },
        { loc: "/about", priority: "0.6", changefreq: "monthly" },
        { loc: "/powdercoating", priority: "0.6", changefreq: "monthly" },
        { loc: "/wheel-rebuilding", priority: "0.6", changefreq: "monthly" },
        { loc: "/fender-rolling", priority: "0.6", changefreq: "monthly" },
        { loc: "/fitment-calculation", priority: "0.6", changefreq: "monthly" },
        { loc: "/wheel-visualizer", priority: "0.7", changefreq: "monthly" },
      ];

      const [collections, products, shopifyPages] = await Promise.all([
        getAllCollections().catch(() => []),
        getAllProductsForSitemap().catch(() => []),
        getAllPages().catch(() => []),
      ]);

      const today = new Date().toISOString().split("T")[0];

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

      for (const page of staticPages) {
        xml += `  <url>\n    <loc>${baseUrl}${page.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`;
      }

      for (const col of collections) {
        xml += `  <url>\n    <loc>${baseUrl}/collections/${col.handle}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      }

      for (const prod of products) {
        xml += `  <url>\n    <loc>${baseUrl}/products/${prod.handle}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
      }

      for (const sp of shopifyPages) {
        xml += `  <url>\n    <loc>${baseUrl}/pages/${sp.handle}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;
      }

      xml += `</urlset>`;

      res.set("Content-Type", "application/xml");
      res.send(xml);
    } catch (err: any) {
      console.error("Error generating sitemap:", err.message);
      res.status(500).send("Error generating sitemap");
    }
  });

  // ─── SHOPIFY ANALYTICS ──────────────────────────────────────────

  app.get("/api/shopify-analytics/config", async (_req, res) => {
    try {
      const shopId = await getShopId();
      const domain = (process.env.SHOPIFY_STORE_DOMAIN || "").replace(/^https?:\/\//, "").replace(/\/+$/, "");
      res.json({ shopId, domain });
    } catch (err: any) {
      console.error("Error fetching shop analytics config:", err.message);
      res.status(500).json({ error: "Failed to get analytics config" });
    }
  });

  app.post("/api/shopify-analytics/send", async (req, res) => {
    try {
      const { events } = req.body;
      if (!Array.isArray(events) || events.length === 0) {
        return res.status(400).json({ error: "No events provided" });
      }
      const storefrontToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || "";
      const enriched = events.map((e: any) => ({
        ...e,
        payload: { ...e.payload, appClientId: storefrontToken },
      }));
      const ok = await sendAnalyticsToShopify(enriched);
      res.json({ success: ok });
    } catch (err: any) {
      console.error("Error sending analytics:", err.message);
      res.status(500).json({ error: "Failed to send analytics" });
    }
  });

  return httpServer;
}
