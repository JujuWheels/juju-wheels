export * from "./models/auth";

import { pgTable, serial, varchar, text, real, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const savedSpecs = pgTable("saved_specs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  diameter: real("diameter").notNull(),
  totalWidth: real("total_width").notNull(),
  currentET: real("current_et").notNull(),
  mountingStyle: varchar("mounting_style", { length: 20 }).notNull(),
  innerBarrel: real("inner_barrel").notNull(),
  outerLip: real("outer_lip").notNull(),
  addOuterLip: real("add_outer_lip").notNull(),
  addInnerBarrel: real("add_inner_barrel").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSavedSpecSchema = createInsertSchema(savedSpecs).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export type InsertSavedSpec = z.infer<typeof insertSavedSpecSchema>;
export type SavedSpec = typeof savedSpecs.$inferSelect;

export const garageVehicles = pgTable("garage_vehicles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  make: varchar("make", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  year: integer("year").notNull(),
  trim: varchar("trim", { length: 255 }),
  boltPattern: varchar("bolt_pattern", { length: 50 }),
  centreBore: varchar("centre_bore", { length: 50 }),
  imageUrl: text("image_url"),
  wheels: jsonb("wheels"),
  specs: jsonb("specs"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGarageVehicleSchema = createInsertSchema(garageVehicles).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export type InsertGarageVehicle = z.infer<typeof insertGarageVehicleSchema>;
export type GarageVehicle = typeof garageVehicles.$inferSelect;
