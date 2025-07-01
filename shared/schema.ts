import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const botConfigs = pgTable("bot_configs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  serverIP: text("server_ip").notNull(),
  serverPort: integer("server_port").notNull().default(25565),
  username: text("username").notNull(),
  accountType: text("account_type").notNull().default("offline"), // 'offline' or 'microsoft'
  movementPattern: text("movement_pattern").notNull().default("circular"), // 'circular', 'random', 'stationary', 'custom'
  movementInterval: integer("movement_interval").notNull().default(30), // seconds
  autoReconnect: boolean("auto_reconnect").notNull().default(true),
  chatResponse: boolean("chat_response").notNull().default(false),
  autoStart: boolean("auto_start").notNull().default(false),
  isActive: boolean("is_active").notNull().default(false),
  persistentMode: boolean("persistent_mode").notNull().default(true), // Never leave without permission
  allowAutoDisconnect: boolean("allow_auto_disconnect").notNull().default(false), // Allow automatic disconnection
  createdAt: timestamp("created_at").defaultNow(),
});

export const botLogs = pgTable("bot_logs", {
  id: serial("id").primaryKey(),
  botConfigId: integer("bot_config_id").references(() => botConfigs.id),
  logType: text("log_type").notNull(), // 'INFO', 'MOVE', 'CHAT', 'PING', 'ERROR', 'WARN'
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const botStats = pgTable("bot_stats", {
  id: serial("id").primaryKey(),
  botConfigId: integer("bot_config_id").references(() => botConfigs.id),
  status: text("status").notNull().default("offline"), // 'online', 'offline', 'connecting', 'error'
  uptime: integer("uptime").notNull().default(0), // seconds
  serverPing: integer("server_ping").default(0), // milliseconds
  reconnections: integer("reconnections").notNull().default(0),
  lastPing: timestamp("last_ping"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertBotConfigSchema = createInsertSchema(botConfigs).omit({
  id: true,
  createdAt: true,
});

export const insertBotLogSchema = createInsertSchema(botLogs).omit({
  id: true,
  timestamp: true,
});

export const insertBotStatsSchema = createInsertSchema(botStats).omit({
  id: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertBotConfig = z.infer<typeof insertBotConfigSchema>;
export type BotConfig = typeof botConfigs.$inferSelect;

export type InsertBotLog = z.infer<typeof insertBotLogSchema>;
export type BotLog = typeof botLogs.$inferSelect;

export type InsertBotStats = z.infer<typeof insertBotStatsSchema>;
export type BotStats = typeof botStats.$inferSelect;

// WebSocket message types
export const wsMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("bot_status"),
    data: z.object({
      configId: z.number(),
      status: z.string(),
      uptime: z.number(),
      serverPing: z.number().optional(),
      reconnections: z.number(),
    }),
  }),
  z.object({
    type: z.literal("bot_log"),
    data: z.object({
      configId: z.number(),
      logType: z.string(),
      message: z.string(),
      timestamp: z.string(),
    }),
  }),
  z.object({
    type: z.literal("bot_error"),
    data: z.object({
      configId: z.number(),
      error: z.string(),
    }),
  }),
  z.object({
    type: z.literal("chatMessage"),
    configId: z.number(),
    message: z.string(),
    timestamp: z.string(),
  }),
]);

export type WSMessage = z.infer<typeof wsMessageSchema>;
