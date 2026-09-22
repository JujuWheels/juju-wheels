const API_BASE = "/api";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("Shopify store not connected. Please add your API credentials.");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Network error" }));
    throw new Error(err.error || `API error ${res.status}`);
  }

  return res.json();
}

// ─── Types ──────────────────────────────────────────────────────

export type ShopifyImage = {
  url: string;
  altText: string | null;
  width: number;
  height: number;
};

export type Money = {
  amount: string;
  currencyCode: string;
};

export type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable?: number | null;
  price: Money;
  compareAtPrice: Money | null;
  selectedOptions: { name: string; value: string }[];
  image: ShopifyImage | null;
};

export type Product = {
  id: string;
  title: string;
  handle: string;
  description: string;
  descriptionHtml?: string;
  availableForSale: boolean;
  productType: string;
  tags: string[];
  priceRange: {
    minVariantPrice: Money;
    maxVariantPrice: Money;
  };
  compareAtPriceRange?: {
    minVariantPrice: Money;
  };
  images: { edges: { node: ShopifyImage }[] };
  variants: { edges: { node: ProductVariant }[] };
  collections?: { edges: { node: { handle: string } }[] };
};

export type Collection = {
  id: string;
  title: string;
  handle: string;
  description: string;
  image: ShopifyImage | null;
  products?: {
    edges: { node: Product }[];
    pageInfo?: { hasNextPage: boolean; endCursor: string };
  };
};

export type CartLine = {
  id: string;
  quantity: number;
  attributes: { key: string; value: string }[];
  cost: { totalAmount: Money };
  merchandise: {
    id: string;
    title: string;
    price: Money;
    image: ShopifyImage | null;
    product: { title: string; handle: string };
    selectedOptions: { name: string; value: string }[];
  };
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    totalAmount: Money;
    subtotalAmount: Money;
  };
  lines: { edges: { node: CartLine }[] };
};

// ─── Image Optimization ─────────────────────────────────────────

export function shopifyImageUrl(url: string, width?: number, height?: number): string {
  if (!url || !url.includes('cdn.shopify.com')) return url;
  try {
    const u = new URL(url);
    if (width) u.searchParams.set('width', String(width));
    if (height) u.searchParams.set('height', String(height));
    const path = u.pathname.toLowerCase();
    if (path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.png')) {
      u.searchParams.set('format', 'webp');
    }
    return u.toString();
  } catch {
    return url;
  }
}

// ─── API Functions ──────────────────────────────────────────────

export async function getAllCollections(): Promise<Collection[]> {
  return apiFetch("/collections");
}

export async function getCollectionByHandle(
  handle: string,
  sortKey = "BEST_SELLING",
  reverse = false
): Promise<Collection | null> {
  return apiFetch(`/collections/${handle}?sortKey=${sortKey}&reverse=${reverse}`);
}

// ─── Client-side Product Cache ──────────────────────────────────

let _productCache: Product[] = [];

/** Add products to the in-memory cache (deduplicates by id). */
export function populateProductCache(products: Product[]): void {
  const existing = new Set(_productCache.map((p) => p.id));
  for (const p of products) {
    if (!existing.has(p.id)) {
      _productCache.push(p);
      existing.add(p.id);
    }
  }
}

/** Return the current cached product list. */
export function getProductCache(): Product[] {
  return _productCache;
}

/**
 * Search the in-memory cache synchronously.
 * Returns an empty array when the cache is empty.
 */
export function searchProductsLocally(query: string, type?: string): Product[] {
  if (!_productCache.length) return [];
  const q = query.toLowerCase();
  return _productCache.filter((p) => {
    if (type && p.productType !== type) return false;
    return (
      p.title.toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q))
    );
  });
}

export async function getProducts(first = 100): Promise<Product[]> {
  const products = await apiFetch<Product[]>(`/products?first=${first}`);
  populateProductCache(products);
  return products;
}

export async function getAllWheels(): Promise<Product[]> {
  const products = await apiFetch<Product[]>("/all-wheels");
  populateProductCache(products);
  return products;
}

export async function getAllCollectionProducts(handle: string): Promise<Product[]> {
  const products = await apiFetch<Product[]>(`/collections/${handle}/all`);
  populateProductCache(products);
  return products;
}

export async function getProductByHandle(handle: string): Promise<Product | null> {
  return apiFetch(`/products/${handle}`);
}

export async function getPageByHandle(handle: string): Promise<any> {
  return apiFetch(`/pages/${handle}`);
}

export async function searchProducts(query: string, type?: string, timeoutMs = 5000): Promise<Product[]> {
  const params = new URLSearchParams({ q: query });
  if (type) params.set("type", type);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await apiFetch(`/search?${params.toString()}`, {
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("Search timed out — please try again.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Cart Functions ─────────────────────────────────────────────

const CART_ID_KEY = "juju-cart-id";

function getStoredCartId(): string | null {
  return localStorage.getItem(CART_ID_KEY);
}

function storeCartId(id: string) {
  localStorage.setItem(CART_ID_KEY, id);
}

export function clearStoredCart() {
  localStorage.removeItem(CART_ID_KEY);
}

async function createNewCart(): Promise<Cart> {
  const cart = await apiFetch<Cart>("/cart", { method: "POST" });
  storeCartId(cart.id);
  return cart;
}

export async function getOrCreateCart(): Promise<Cart> {
  const existingId = getStoredCartId();

  if (existingId) {
    try {
      const cart = await apiFetch<Cart>(`/cart/${encodeURIComponent(existingId)}`);
      if (cart && cart.id) return cart;
    } catch {
      clearStoredCart();
    }
  }

  return createNewCart();
}

export async function addItemToCart(variantId: string, quantity = 1, attributes?: { key: string; value: string }[], extraLines?: { merchandiseId: string; quantity: number; attributes?: { key: string; value: string }[] }[]): Promise<Cart> {
  const cart = await getOrCreateCart();
  const line: any = { merchandiseId: variantId, quantity };
  if (attributes && attributes.length > 0) {
    line.attributes = attributes;
  }
  const allLines = [line, ...(extraLines || [])];
  try {
    const updated = await apiFetch<Cart>(`/cart/${encodeURIComponent(cart.id)}/lines`, {
      method: "POST",
      body: JSON.stringify({ lines: allLines }),
    });
    return updated;
  } catch (err: any) {
    if (err.message?.includes("expired") || err.message?.includes("not found")) {
      clearStoredCart();
      const newCart = await createNewCart();
      const updated = await apiFetch<Cart>(`/cart/${encodeURIComponent(newCart.id)}/lines`, {
        method: "POST",
        body: JSON.stringify({ lines: allLines }),
      });
      return updated;
    }
    throw err;
  }
}

export async function updateCartItem(lineId: string, quantity: number): Promise<Cart> {
  const cartId = getStoredCartId();
  if (!cartId) throw new Error("No cart found");

  try {
    const updated = await apiFetch<Cart>(`/cart/${encodeURIComponent(cartId)}/lines`, {
      method: "PUT",
      body: JSON.stringify({ lines: [{ id: lineId, quantity }] }),
    });
    return updated;
  } catch (err: any) {
    if (err.message?.includes("expired")) {
      clearStoredCart();
      throw new Error("Cart expired — please add your items again");
    }
    throw err;
  }
}

export async function removeCartItem(lineId: string): Promise<Cart> {
  const cartId = getStoredCartId();
  if (!cartId) throw new Error("No cart found");

  try {
    const updated = await apiFetch<Cart>(`/cart/${encodeURIComponent(cartId)}/lines`, {
      method: "DELETE",
      body: JSON.stringify({ lineIds: [lineId] }),
    });
    return updated;
  } catch (err: any) {
    if (err.message?.includes("expired")) {
      clearStoredCart();
      throw new Error("Cart expired — please add your items again");
    }
    throw err;
  }
}

// ─── Checkout URL Safety ────────────────────────────────────────

let _shopifyDomain: string | null = null;

async function fetchShopifyDomain(): Promise<string> {
  if (_shopifyDomain) return _shopifyDomain;
  try {
    const res = await fetch("/api/config");
    if (res.ok) {
      const data = await res.json();
      if (data.shopifyDomain) {
        _shopifyDomain = data.shopifyDomain as string;
        return _shopifyDomain!
      }
    }
  } catch {}
  return "";
}

export async function ensureShopifyCheckoutUrl(checkoutUrl: string): Promise<string> {
  if (!_shopifyDomain) await fetchShopifyDomain();
  try {
    const url = new URL(checkoutUrl);
    if (url.hostname.endsWith(".myshopify.com")) {
      return checkoutUrl;
    }
    if (_shopifyDomain) {
      url.hostname = _shopifyDomain;
      url.protocol = "https:";
      return url.toString();
    }
    return checkoutUrl;
  } catch {
    return checkoutUrl;
  }
}

// ─── Price Formatter ────────────────────────────────────────────

export function formatPrice(money: Money): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: money.currencyCode,
  }).format(parseFloat(money.amount));
}
