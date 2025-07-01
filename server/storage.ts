import { 
  users, 
  botConfigs, 
  botLogs, 
  botStats, 
  type User, 
  type InsertUser,
  type BotConfig,
  type InsertBotConfig,
  type BotLog,
  type InsertBotLog,
  type BotStats,
  type InsertBotStats
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Bot config methods
  getBotConfig(id: number): Promise<BotConfig | undefined>;
  getAllBotConfigs(): Promise<BotConfig[]>;
  createBotConfig(config: InsertBotConfig): Promise<BotConfig>;
  updateBotConfig(id: number, config: Partial<InsertBotConfig>): Promise<BotConfig | undefined>;
  deleteBotConfig(id: number): Promise<boolean>;

  // Bot logs methods
  getBotLogs(configId: number, limit?: number): Promise<BotLog[]>;
  createBotLog(log: InsertBotLog): Promise<BotLog>;
  clearBotLogs(configId: number): Promise<boolean>;

  // Bot stats methods
  getBotStats(configId: number): Promise<BotStats | undefined>;
  createOrUpdateBotStats(stats: InsertBotStats): Promise<BotStats>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private botConfigs: Map<number, BotConfig>;
  private botLogs: Map<number, BotLog[]>;
  private botStats: Map<number, BotStats>;
  private currentUserId: number;
  private currentBotConfigId: number;
  private currentBotLogId: number;
  private currentBotStatsId: number;

  constructor() {
    this.users = new Map();
    this.botConfigs = new Map();
    this.botLogs = new Map();
    this.botStats = new Map();
    this.currentUserId = 1;
    this.currentBotConfigId = 1;
    this.currentBotLogId = 1;
    this.currentBotStatsId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getBotConfig(id: number): Promise<BotConfig | undefined> {
    return this.botConfigs.get(id);
  }

  async getAllBotConfigs(): Promise<BotConfig[]> {
    return Array.from(this.botConfigs.values());
  }

  async createBotConfig(config: InsertBotConfig): Promise<BotConfig> {
    const id = this.currentBotConfigId++;
    const botConfig: BotConfig = { 
      ...config,
      id, 
      createdAt: new Date(),
      // Ensure all required fields have defaults
      serverPort: config.serverPort ?? 25565,
      accountType: config.accountType ?? "offline",
      movementPattern: config.movementPattern ?? "circular",
      movementInterval: config.movementInterval ?? 30,
      autoReconnect: config.autoReconnect ?? true,
      chatResponse: config.chatResponse ?? false,
      autoStart: config.autoStart ?? false,
      isActive: config.isActive ?? false,
      persistentMode: config.persistentMode ?? true,
      allowAutoDisconnect: config.allowAutoDisconnect ?? false,
    };
    this.botConfigs.set(id, botConfig);
    return botConfig;
  }

  async updateBotConfig(id: number, config: Partial<InsertBotConfig>): Promise<BotConfig | undefined> {
    const existing = this.botConfigs.get(id);
    if (!existing) return undefined;
    
    const updated: BotConfig = { ...existing, ...config };
    this.botConfigs.set(id, updated);
    return updated;
  }

  async deleteBotConfig(id: number): Promise<boolean> {
    const deleted = this.botConfigs.delete(id);
    if (deleted) {
      this.botLogs.delete(id);
      this.botStats.delete(id);
    }
    return deleted;
  }

  async getBotLogs(configId: number, limit = 50): Promise<BotLog[]> {
    const logs = this.botLogs.get(configId) || [];
    return logs.slice(-limit).reverse();
  }

  async createBotLog(log: InsertBotLog): Promise<BotLog> {
    const id = this.currentBotLogId++;
    const botLog: BotLog = { 
      id,
      botConfigId: log.botConfigId ?? null,
      logType: log.logType,
      message: log.message,
      timestamp: new Date() 
    };
    
    const configId = log.botConfigId ?? 0;
    if (!this.botLogs.has(configId)) {
      this.botLogs.set(configId, []);
    }
    
    const logs = this.botLogs.get(configId)!;
    logs.push(botLog);
    
    // Keep only last 100 logs per bot
    if (logs.length > 100) {
      logs.shift();
    }
    
    return botLog;
  }

  async clearBotLogs(configId: number): Promise<boolean> {
    this.botLogs.set(configId, []);
    return true;
  }

  async getBotStats(configId: number): Promise<BotStats | undefined> {
    return this.botStats.get(configId);
  }

  async createOrUpdateBotStats(stats: InsertBotStats): Promise<BotStats> {
    const configId = stats.botConfigId ?? 0;
    const existing = this.botStats.get(configId);
    
    if (existing) {
      const updated: BotStats = { 
        id: existing.id,
        botConfigId: configId,
        status: stats.status ?? existing.status,
        uptime: stats.uptime ?? existing.uptime,
        serverPing: stats.serverPing ?? existing.serverPing,
        reconnections: stats.reconnections ?? existing.reconnections,
        lastPing: stats.lastPing ?? existing.lastPing,
        updatedAt: new Date() 
      };
      this.botStats.set(configId, updated);
      return updated;
    } else {
      const id = this.currentBotStatsId++;
      const newStats: BotStats = { 
        id,
        botConfigId: configId,
        status: stats.status ?? "offline",
        uptime: stats.uptime ?? 0,
        serverPing: stats.serverPing ?? null,
        reconnections: stats.reconnections ?? 0,
        lastPing: stats.lastPing ?? null,
        updatedAt: new Date() 
      };
      this.botStats.set(configId, newStats);
      return newStats;
    }
  }
}

export const storage = new MemStorage();
