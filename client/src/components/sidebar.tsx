import { Bot, BarChart3, Settings, FileText, UserCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { BotConfig } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface SidebarProps {
  botConfigs: BotConfig[];
  selectedBotId: number | null;
  onSelectBot: (id: number) => void;
  isLoading: boolean;
}

export function Sidebar({ botConfigs, selectedBotId, onSelectBot, isLoading }: SidebarProps) {
  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 fixed h-full z-10">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Bot className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Minefort</h1>
            <p className="text-sm text-gray-500">AFK Bot Manager</p>
          </div>
        </div>
      </div>
      
      <nav className="mt-6">
        <div className="px-4 space-y-2">
          <div className="flex items-center space-x-3 px-4 py-3 text-blue-600 bg-blue-50 rounded-lg border-l-4 border-blue-600">
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </div>
          <div className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
            <Settings className="w-5 h-5" />
            <span>Configuration</span>
          </div>
          <div className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
            <FileText className="w-5 h-5" />
            <span>Activity Logs</span>
          </div>
          <div className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
            <UserCircle className="w-5 h-5" />
            <span>Account Manager</span>
          </div>
          <div className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
            <BarChart3 className="w-5 h-5" />
            <span>Statistics</span>
          </div>
        </div>

        {/* Bot Configurations */}
        {(botConfigs.length > 0 || isLoading) && (
          <div className="mt-6 px-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Bot Configurations
            </h3>
            <div className="space-y-1">
              {isLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full rounded" />
                ))
              ) : (
                botConfigs.map((config) => (
                  <button
                    key={config.id}
                    onClick={() => onSelectBot(config.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded text-sm transition-colors",
                      selectedBotId === config.id
                        ? "bg-blue-100 text-blue-700 font-medium"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        config.isActive ? "bg-green-500" : "bg-gray-400"
                      )} />
                      <span className="truncate">{config.name}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {config.serverIP}:{config.serverPort}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </nav>
      
      <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 text-sm text-gray-500">
          <Info className="w-4 h-4" />
          <span>Version 1.2.0</span>
        </div>
      </div>
    </div>
  );
}
