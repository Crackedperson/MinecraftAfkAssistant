import { createBot, Bot } from 'mineflayer';
import { storage } from '../storage';
import { BotConfig, InsertBotLog, InsertBotStats } from '@shared/schema';
import { WebSocketServer, WebSocket } from 'ws';

export class MinecraftBotService {
  private bots: Map<number, Bot> = new Map();
  private botIntervals: Map<number, NodeJS.Timeout> = new Map();
  private botStartTimes: Map<number, Date> = new Map();
  private wsClients: Set<WebSocket> = new Set();

  constructor(private wss: WebSocketServer) {
    this.setupWebSocketServer();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket) => {
      this.wsClients.add(ws);
      
      ws.on('close', () => {
        this.wsClients.delete(ws);
      });
    });
  }

  private broadcast(message: any) {
    const messageStr = JSON.stringify(message);
    this.wsClients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }

  private async addLog(configId: number, logType: string, message: string) {
    const log = await storage.createBotLog({
      botConfigId: configId,
      logType,
      message
    });

    this.broadcast({
      type: 'bot_log',
      data: {
        configId,
        logType,
        message,
        timestamp: log.timestamp?.toISOString() || new Date().toISOString()
      }
    });
  }

  private async updateStats(configId: number, updates: Partial<InsertBotStats>) {
    const stats = await storage.createOrUpdateBotStats({
      botConfigId: configId,
      ...updates
    });

    this.broadcast({
      type: 'bot_status',
      data: {
        configId,
        status: stats.status,
        uptime: stats.uptime,
        serverPing: stats.serverPing || 0,
        reconnections: stats.reconnections
      }
    });
  }

  async startBot(configId: number): Promise<boolean> {
    try {
      const config = await storage.getBotConfig(configId);
      if (!config) {
        throw new Error('Bot configuration not found');
      }

      if (this.bots.has(configId)) {
        await this.stopBot(configId);
      }

      await this.addLog(configId, 'INFO', `Connecting to ${config.serverIP}:${config.serverPort}...`);

      const botOptions: any = {
        host: config.serverIP,
        port: config.serverPort,
        username: config.username,
        version: false, // Auto-detect version
      };

      if (config.accountType === 'microsoft') {
        botOptions.auth = 'microsoft';
      }

      const bot = createBot(botOptions);
      this.bots.set(configId, bot);
      this.botStartTimes.set(configId, new Date());

      // Update config to active
      await storage.updateBotConfig(configId, { isActive: true });

      // Update stats
      await this.updateStats(configId, {
        status: 'connecting',
        uptime: 0,
        reconnections: 0
      });

      // Bot event handlers
      bot.on('login', async () => {
        await this.addLog(configId, 'INFO', `Successfully connected to ${config.serverIP}:${config.serverPort}`);
        await this.updateStats(configId, { status: 'online' });
        
        // Start movement pattern
        this.startMovementPattern(configId, config);
        
        // Start uptime tracking
        this.startUptimeTracking(configId);
      });

      bot.on('spawn', async () => {
        await this.addLog(configId, 'INFO', `Bot spawned at position ${bot.entity.position.toString()}`);
      });

      bot.on('chat', async (username, message) => {
        if (username === bot.username) return;
        
        await this.addLog(configId, 'CHAT', `<${username}> ${message}`);
        
        if (config.chatResponse && message.toLowerCase().includes(bot.username.toLowerCase())) {
          const responses = [
            "Hi there! I'm an AFK bot.",
            "Hello! I'm keeping this server alive.",
            "Hey! Just doing my AFK thing.",
            "Hi! I'm a friendly AFK bot."
          ];
          const response = responses[Math.floor(Math.random() * responses.length)];
          
          setTimeout(() => {
            bot.chat(response);
          }, 1000 + Math.random() * 2000); // Random delay 1-3 seconds
          
          await this.addLog(configId, 'CHAT', `Auto-responded: ${response}`);
        }
      });

      bot.on('health', async () => {
        if (bot.health < 20) {
          await this.addLog(configId, 'WARN', `Health is low: ${bot.health}/20`);
        }
      });

      bot.on('death', async () => {
        await this.addLog(configId, 'ERROR', 'Bot died! Attempting to respawn...');
        setTimeout(() => {
          bot.respawn();
        }, 2000);
      });

      bot.on('kicked', async (reason) => {
        await this.addLog(configId, 'ERROR', `Kicked from server: ${reason}`);
        await this.updateStats(configId, { status: 'error' });
        
        // In persistent mode, always try to reconnect regardless of kick reason
        if (config.persistentMode || config.autoReconnect) {
          await this.addLog(configId, 'INFO', 'Persistent mode enabled - attempting to reconnect after kick...');
          setTimeout(() => {
            this.startBot(configId);
          }, 10000); // Wait 10 seconds before reconnecting after kick
        }
      });

      bot.on('error', async (err) => {
        await this.addLog(configId, 'ERROR', `Bot error: ${err.message}`);
        await this.updateStats(configId, { status: 'error' });
        
        this.broadcast({
          type: 'bot_error',
          data: {
            configId,
            error: err.message
          }
        });

        // In persistent mode, always try to reconnect after errors
        if (config.persistentMode || config.autoReconnect) {
          await this.addLog(configId, 'INFO', 'Persistent mode enabled - reconnecting after error...');
          setTimeout(() => {
            this.startBot(configId);
          }, 8000); // Wait 8 seconds before reconnecting after error
        }
      });

      bot.on('end', async () => {
        await this.addLog(configId, 'WARN', 'Connection ended');
        await this.updateStats(configId, { status: 'offline' });
        
        this.cleanup(configId);
        
        // In persistent mode, never give up reconnecting unless explicitly stopped
        if (config.persistentMode || config.autoReconnect) {
          const stats = await storage.getBotStats(configId);
          const reconnections = (stats?.reconnections || 0) + 1;
          
          await this.addLog(configId, 'INFO', `Persistent mode: Reconnection attempt #${reconnections}`);
          await this.updateStats(configId, { 
            status: 'connecting',
            reconnections 
          });
          
          // Progressive backoff but never give up in persistent mode
          const delay = config.persistentMode ? 
            Math.min(5000 + (reconnections * 2000), 30000) : // Max 30 seconds delay
            5000;
            
          setTimeout(() => {
            this.startBot(configId);
          }, delay);
        }
      });

      return true;
    } catch (error) {
      await this.addLog(configId, 'ERROR', `Failed to start bot: ${(error as Error).message}`);
      await this.updateStats(configId, { status: 'error' });
      return false;
    }
  }

  async stopBot(configId: number, forced: boolean = false): Promise<boolean> {
    const config = await storage.getBotConfig(configId);
    const bot = this.bots.get(configId);
    if (!bot) return false;

    // Check if bot is in persistent mode and this isn't a forced stop
    if (config?.persistentMode && !forced) {
      await this.addLog(configId, 'WARN', 'Stop request blocked - Bot is in persistent mode. Use force stop to override.');
      return false;
    }

    try {
      const stopReason = forced ? 'Force stopping AFK bot (Persistent mode overridden)' : 'Stopping AFK bot';
      bot.quit(stopReason);
      this.cleanup(configId);
      
      await storage.updateBotConfig(configId, { isActive: false });
      await this.updateStats(configId, { status: 'offline' });
      await this.addLog(configId, 'INFO', stopReason);
      
      return true;
    } catch (error) {
      await this.addLog(configId, 'ERROR', `Error stopping bot: ${(error as Error).message}`);
      return false;
    }
  }

  private cleanup(configId: number) {
    this.bots.delete(configId);
    
    const interval = this.botIntervals.get(configId);
    if (interval) {
      clearInterval(interval);
      this.botIntervals.delete(configId);
    }
    
    this.botStartTimes.delete(configId);
  }

  private startMovementPattern(configId: number, config: BotConfig) {
    const bot = this.bots.get(configId);
    if (!bot) return;

    const interval = setInterval(async () => {
      try {
        switch (config.movementPattern) {
          case 'circular':
            await this.circularMovement(bot);
            break;
          case 'random':
            await this.randomMovement(bot);
            break;
          case 'stationary':
            await this.stationaryMovement(bot);
            break;
          default:
            await this.circularMovement(bot);
        }
        
        await this.addLog(configId, 'MOVE', `Position: X=${bot.entity.position.x.toFixed(1)}, Y=${bot.entity.position.y.toFixed(1)}, Z=${bot.entity.position.z.toFixed(1)}`);
      } catch (error) {
        await this.addLog(configId, 'ERROR', `Movement error: ${(error as Error).message}`);
      }
    }, config.movementInterval * 1000);

    this.botIntervals.set(configId, interval);
  }

  private async circularMovement(bot: Bot) {
    const angle = (Date.now() / 1000) % (2 * Math.PI);
    const radius = 2;
    const centerX = Math.floor(bot.entity.position.x);
    const centerZ = Math.floor(bot.entity.position.z);
    
    const targetX = centerX + Math.cos(angle) * radius;
    const targetZ = centerZ + Math.sin(angle) * radius;
    
    bot.setControlState('forward', true);
    bot.look(Math.atan2(targetZ - bot.entity.position.z, targetX - bot.entity.position.x), 0);
    
    setTimeout(() => {
      bot.setControlState('forward', false);
    }, 500);
  }

  private async randomMovement(bot: Bot) {
    const directions: ('forward' | 'back' | 'left' | 'right')[] = ['forward', 'back', 'left', 'right'];
    const direction = directions[Math.floor(Math.random() * directions.length)];
    const duration = 200 + Math.random() * 800; // 200-1000ms
    
    bot.setControlState(direction, true);
    
    // Random look direction
    const yaw = Math.random() * 2 * Math.PI;
    bot.look(yaw, 0);
    
    setTimeout(() => {
      bot.setControlState(direction, false);
    }, duration);
  }

  private async stationaryMovement(bot: Bot) {
    // Just look around
    const yaw = (bot.entity.yaw + (Math.random() - 0.5) * 0.5) % (2 * Math.PI);
    bot.look(yaw, 0);
    
    // Occasionally jump
    if (Math.random() < 0.1) {
      bot.setControlState('jump', true);
      setTimeout(() => {
        bot.setControlState('jump', false);
      }, 100);
    }
  }

  private startUptimeTracking(configId: number) {
    const interval = setInterval(async () => {
      const startTime = this.botStartTimes.get(configId);
      if (!startTime) return;
      
      const uptime = Math.floor((Date.now() - startTime.getTime()) / 1000);
      const bot = this.bots.get(configId);
      
      let ping = 0;
      if (bot && bot.player) {
        ping = bot.player.ping || 0;
      }
      
      await this.updateStats(configId, { 
        uptime,
        serverPing: ping,
        lastPing: new Date()
      });
      
      if (ping > 0) {
        await this.addLog(configId, 'PING', `Server ping: ${ping}ms`);
      }
    }, 30000); // Update every 30 seconds

    this.botIntervals.set(configId, interval);
  }

  async getBotStatus(configId: number) {
    const bot = this.bots.get(configId);
    const stats = await storage.getBotStats(configId);
    
    return {
      isRunning: !!bot,
      connected: bot ? bot.player !== null : false,
      stats
    };
  }

  async getAllBotStatuses() {
    const configs = await storage.getAllBotConfigs();
    const statuses = await Promise.all(
      configs.map(async (config) => ({
        config,
        status: await this.getBotStatus(config.id)
      }))
    );
    
    return statuses;
  }
}
