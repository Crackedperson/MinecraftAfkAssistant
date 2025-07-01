# Minefort AFK Bot - Replit Configuration

## Overview

This is a full-stack Minecraft AFK bot management application built with modern web technologies. The application allows users to create, configure, and manage Minecraft bots that can keep servers alive by performing automated activities and anti-AFK movements.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Real-time Updates**: WebSocket connection for live bot status and logs

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API**: RESTful API with WebSocket support for real-time communication
- **Bot Engine**: Mineflayer library for Minecraft bot functionality
- **Build Tool**: Vite for frontend bundling, esbuild for backend compilation

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (via Neon Database serverless)
- **Development Storage**: In-memory storage implementation for rapid development
- **Migrations**: Drizzle Kit for database schema management

## Key Components

### Bot Management System
- **Bot Configurations**: Persistent storage of bot settings including server details, movement patterns, and behavior options
- **Real-time Control**: Start, stop, and restart bots with live status updates
- **Persistent Mode**: "Never leave without permission" feature that prevents accidental disconnections
- **Activity Logging**: Comprehensive logging system with different log types (INFO, MOVE, CHAT, PING, ERROR, WARN)
- **Statistics Tracking**: Bot uptime, server ping, reconnection counts, and health metrics
- **Force Stop Protection**: Confirmation dialogs and safety mechanisms for stopping persistent bots

### Authentication & Authorization
- **User System**: Basic user management with username/password authentication
- **Session Management**: Cookie-based sessions with PostgreSQL session store

### WebSocket Integration
- **Live Updates**: Real-time bot status changes, log entries, and statistics
- **Connection Management**: Automatic reconnection with exponential backoff
- **Event Broadcasting**: Server-to-client communication for immediate UI updates

### UI Components
- **Dashboard**: Comprehensive bot management interface with status grids, controls, and logs
- **Configuration Forms**: Dynamic forms for bot setup with validation
- **Activity Monitoring**: Real-time log viewer with auto-scroll and filtering
- **Responsive Design**: Mobile-friendly interface with collapsible sidebar

## Data Flow

1. **Bot Configuration**: Users create bot configurations through the web interface
2. **Bot Lifecycle**: Bots are started/stopped via API calls, with status updates broadcast via WebSocket
3. **Real-time Monitoring**: Bot activities, logs, and statistics are streamed to connected clients
4. **Persistence**: All configurations, logs, and statistics are stored in PostgreSQL
5. **State Synchronization**: React Query manages client-side cache with WebSocket invalidation

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **mineflayer**: Minecraft bot creation and control library
- **ws**: WebSocket server implementation
- **drizzle-orm**: Type-safe ORM for database operations
- **express**: Web server framework
- **react**: Frontend UI library
- **@tanstack/react-query**: Server state management

### UI & Styling
- **@radix-ui/react-***: Accessible UI primitive components
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Development Tools
- **typescript**: Static type checking
- **vite**: Frontend build tool and dev server
- **esbuild**: Fast JavaScript bundler for backend
- **tsx**: TypeScript execution for development

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with HMR and middleware mode
- **Backend**: Direct TypeScript execution with tsx
- **Database**: Neon serverless PostgreSQL with environment-based configuration
- **WebSocket**: Integrated with HTTP server on `/ws` path

### Production Build
- **Frontend**: Static build output to `dist/public`
- **Backend**: Bundled ESM output to `dist/index.js`
- **Static Serving**: Express serves frontend assets in production
- **Process Management**: Single Node.js process handling both HTTP and WebSocket connections

### Environment Configuration
- **Database**: `DATABASE_URL` environment variable for PostgreSQL connection
- **Build Detection**: `NODE_ENV` for development/production modes
- **Replit Integration**: Special handling for Replit development environment

## Changelog
```
- July 01, 2025. Initial setup
- July 01, 2025. Added "Never Leave Without Permission" feature with persistent mode
- July 01, 2025. Prepared true 24/7 deployment with Docker and hosting platform integration
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```