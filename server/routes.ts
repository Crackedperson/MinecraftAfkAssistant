import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { MinecraftBotService } from "./services/minecraft-bot";
import { insertBotConfigSchema, insertBotLogSchema } from "@shared/schema";
import { z } from "zod";

let botService: MinecraftBotService;

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup WebSocket server on /ws path
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Initialize bot service
  botService = new MinecraftBotService(wss);

  // Bot configuration routes
  app.get("/api/bot-configs", async (req, res) => {
    try {
      const configs = await storage.getAllBotConfigs();
      res.json(configs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bot configurations" });
    }
  });

  app.get("/api/bot-configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const config = await storage.getBotConfig(id);
      
      if (!config) {
        return res.status(404).json({ error: "Bot configuration not found" });
      }
      
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bot configuration" });
    }
  });

  app.post("/api/bot-configs", async (req, res) => {
    try {
      const validatedData = insertBotConfigSchema.parse(req.body);
      const config = await storage.createBotConfig(validatedData);
      
      // Auto-start if requested
      if (config.autoStart) {
        await botService.startBot(config.id);
      }
      
      res.status(201).json(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid configuration data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create bot configuration" });
    }
  });

  app.put("/api/bot-configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertBotConfigSchema.partial().parse(req.body);
      
      const config = await storage.updateBotConfig(id, validatedData);
      
      if (!config) {
        return res.status(404).json({ error: "Bot configuration not found" });
      }
      
      res.json(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid configuration data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update bot configuration" });
    }
  });

  app.delete("/api/bot-configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Stop bot if running
      await botService.stopBot(id);
      
      const deleted = await storage.deleteBotConfig(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Bot configuration not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete bot configuration" });
    }
  });

  // Bot control routes
  app.post("/api/bot-configs/:id/start", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await botService.startBot(id);
      
      if (!success) {
        return res.status(400).json({ error: "Failed to start bot" });
      }
      
      res.json({ message: "Bot started successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to start bot" });
    }
  });

  app.post("/api/bot-configs/:id/stop", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await botService.stopBot(id);
      
      if (!success) {
        return res.status(400).json({ error: "Failed to stop bot" });
      }
      
      res.json({ message: "Bot stopped successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to stop bot" });
    }
  });

  app.post("/api/bot-configs/:id/restart", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      await botService.stopBot(id);
      // Wait a moment before restarting
      setTimeout(async () => {
        await botService.startBot(id);
      }, 2000);
      
      res.json({ message: "Bot restart initiated" });
    } catch (error) {
      res.status(500).json({ error: "Failed to restart bot" });
    }
  });

  // Bot status routes
  app.get("/api/bot-configs/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const status = await botService.getBotStatus(id);
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bot status" });
    }
  });

  app.get("/api/bot-status", async (req, res) => {
    try {
      const statuses = await botService.getAllBotStatuses();
      res.json(statuses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bot statuses" });
    }
  });

  // Bot logs routes
  app.get("/api/bot-configs/:id/logs", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      const logs = await storage.getBotLogs(id, limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bot logs" });
    }
  });

  app.delete("/api/bot-configs/:id/logs", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.clearBotLogs(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to clear bot logs" });
    }
  });

  // Bot stats routes
  app.get("/api/bot-configs/:id/stats", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const stats = await storage.getBotStats(id);
      
      if (!stats) {
        return res.status(404).json({ error: "Bot stats not found" });
      }
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bot stats" });
    }
  });

  return httpServer;
}
