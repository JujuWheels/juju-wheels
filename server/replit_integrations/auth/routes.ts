import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";

export function registerAuthRoutes(app: Express): void {
  app.get("/api/auth/user", async (req: any, res) => {
    try {
      if (!req.isAuthenticated?.() || !req.user?.claims?.sub) {
        return res.json(null);
      }
      const now = Math.floor(Date.now() / 1000);
      if (req.user.expires_at && now > req.user.expires_at) {
        return res.json(null);
      }
      const userId = req.user.claims.sub;
      const user = await authStorage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.json(null);
    }
  });

  app.put("/api/auth/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { phone, marketingEmail, address, city, postalCode, country, instagram } = req.body;

      if (!phone || typeof phone !== "string" || phone.trim().length < 5) {
        return res.status(400).json({ message: "A valid phone number is required" });
      }
      if (!marketingEmail || typeof marketingEmail !== "string" || !marketingEmail.includes("@")) {
        return res.status(400).json({ message: "A valid email address is required" });
      }
      if (!address || typeof address !== "string" || address.trim().length < 3) {
        return res.status(400).json({ message: "A valid address is required" });
      }
      if (!city || typeof city !== "string" || city.trim().length < 2) {
        return res.status(400).json({ message: "A valid city is required" });
      }
      if (!postalCode || typeof postalCode !== "string" || postalCode.trim().length < 3) {
        return res.status(400).json({ message: "A valid postal code is required" });
      }
      if (!country || typeof country !== "string" || country.trim().length < 2) {
        return res.status(400).json({ message: "A valid country is required" });
      }

      const user = await authStorage.updateProfile(userId, {
        phone: phone.trim(),
        marketingEmail: marketingEmail.trim().toLowerCase(),
        address: address.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
        instagram: instagram?.trim() || undefined,
      });
      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
}
