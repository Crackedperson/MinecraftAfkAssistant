# True 24/7 Deployment Guide

Your Minecraft AFK bot is ready for true 24/7 operation! Here are your deployment options:

## 🥇 Option 1: Northflank (FREE - Never Sleeps)

### Why Northflank is Best for AFK Bots:
- ✅ **FREE forever** with no sleep mode
- ✅ **Always-on** - perfect for keeping servers alive
- ✅ Static IP addresses included
- ✅ 2 services free (512MB RAM each)

### Deploy to Northflank:

1. **Create Account**: Go to [northflank.com](https://northflank.com) and sign up
2. **Connect GitHub**: Link your GitHub account
3. **Create Service**: 
   - Choose "Combined Service" 
   - Connect this repository
   - Build type: "Dockerfile"
   - Port: 5000
4. **Set Environment Variables**:
   ```
   NODE_ENV=production
   PORT=5000
   ```

**Cost**: FREE forever (no credit card required)

## 🥈 Option 2: Railway ($5/month)

### Why Railway for Production:
- ✅ **Most reliable** for 24/7 operation
- ✅ Excellent performance and uptime
- ✅ Built-in database support
- ✅ Simple deployment process

### Deploy to Railway:

1. **Create Account**: Go to [railway.app](https://railway.app)
2. **Deploy from GitHub**: 
   - Click "Deploy from GitHub"
   - Select this repository
   - Railway auto-detects the Dockerfile
3. **Set Environment Variables** (same as above)

**Cost**: $5/month (most reliable option)

## 🥉 Option 3: Render (FREE but Sleeps)

### Limitations:
- ❌ **Sleeps after 15 minutes** of inactivity
- ❌ Not ideal for AFK bots (defeats the purpose)

**Only use this for testing, not for true 24/7 operation.**

## Recommended Choice

**For True 24/7 AFK Bot Operation**: Use **Northflank**

It's completely free, never sleeps, and specifically designed for always-on applications like yours.

## Post-Deployment Setup

After deployment:

1. **Get your bot URL** (e.g., `https://your-app.northflank.app`)
2. **Create bot configurations** through the web interface
3. **Start your bots** - they'll run 24/7 automatically
4. **Monitor status** through the dashboard

Your bots will now:
- ✅ Run 24/7 even when you close your browser
- ✅ Automatically reconnect to Minecraft servers
- ✅ Keep your servers alive indefinitely
- ✅ Never leave without your permission

## Need Help?

The application is fully configured and ready to deploy. Choose Northflank for the best free 24/7 experience!