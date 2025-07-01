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
      createdAt: new Date() 
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
      ...log, 
      id, 
      timestamp: new Date() 
    };
    
    if (!this.botLogs.has(log.botConfigId!)) {
      this.botLogs.set(log.botConfigId!, []);
    }
    
    const logs = this.botLogs.get(log.botConfigId!)!;
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
    const existing = this.botStats.get(stats.botConfigId!);
    
    if (existing) {
      const updated: BotStats = { 
        ...existing, 
        ...stats, 
        updatedAt: new Date() 
      };
      this.botStats.set(stats.botConfigId!, updated);
      return updated;
    } else {
      const id = this.currentBotStatsId++;
      const newStats: BotStats = { 
        ...stats, 
        id, 
        updatedAt: new Date() 
      };
      this.botStats.set(stats.botConfigId!, newStats);
      return newStats;
    }
  }
}

export const storage = new MemStorage();
