import { savedSpecs, type SavedSpec, type InsertSavedSpec, garageVehicles, type GarageVehicle, type InsertGarageVehicle } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  getSavedSpecs(userId: string): Promise<SavedSpec[]>;
  createSavedSpec(userId: string, spec: InsertSavedSpec): Promise<SavedSpec>;
  deleteSavedSpec(userId: string, id: number): Promise<boolean>;
  getGarageVehicles(userId: string): Promise<GarageVehicle[]>;
  addGarageVehicle(userId: string, vehicle: InsertGarageVehicle): Promise<GarageVehicle>;
  deleteGarageVehicle(userId: string, id: number): Promise<boolean>;
}

class DatabaseStorage implements IStorage {
  async getSavedSpecs(userId: string): Promise<SavedSpec[]> {
    return db.select().from(savedSpecs).where(eq(savedSpecs.userId, userId)).orderBy(desc(savedSpecs.createdAt));
  }

  async createSavedSpec(userId: string, spec: InsertSavedSpec): Promise<SavedSpec> {
    const [result] = await db.insert(savedSpecs).values({ ...spec, userId }).returning();
    return result;
  }

  async deleteSavedSpec(userId: string, id: number): Promise<boolean> {
    const result = await db.delete(savedSpecs).where(and(eq(savedSpecs.id, id), eq(savedSpecs.userId, userId))).returning();
    return result.length > 0;
  }

  async getGarageVehicles(userId: string): Promise<GarageVehicle[]> {
    return db.select().from(garageVehicles).where(eq(garageVehicles.userId, userId)).orderBy(desc(garageVehicles.createdAt));
  }

  async addGarageVehicle(userId: string, vehicle: InsertGarageVehicle): Promise<GarageVehicle> {
    const [result] = await db.insert(garageVehicles).values({ ...vehicle, userId }).returning();
    return result;
  }

  async deleteGarageVehicle(userId: string, id: number): Promise<boolean> {
    const result = await db.delete(garageVehicles).where(and(eq(garageVehicles.id, id), eq(garageVehicles.userId, userId))).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
