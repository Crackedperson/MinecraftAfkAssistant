import { Sidebar } from "@/components/sidebar";
import { StatusGrid } from "@/components/status-grid";
import { BotControls } from "@/components/bot-controls";
import { QuickConfig } from "@/components/quick-config";
import { ActivityLogs } from "@/components/activity-logs";
import { ServerConfigModal } from "@/components/server-config-modal";
import { ChatMessage } from "@/components/chat-message";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BotConfig, BotStats } from "@shared/schema";
import { useWebSocket } from "@/hooks/use-websocket";
import { Button } from "@/components/ui/button";
import { RefreshCw, Server } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBotId, setSelectedBotId] = useState<number | null>(null);
  const { isConnected, lastMessage } = useWebSocket();

  // Fetch bot configurations
  const { data: botConfigs, isLoading: configsLoading } = useQuery<BotConfig[]>({
    queryKey: ['/api/bot-configs'],
  });

  // Fetch bot statuses
  const { data: botStatuses, isLoading: statusesLoading } = useQuery({
    queryKey: ['/api/bot-status'],
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      // Invalidate relevant queries when receiving WebSocket updates
      if (lastMessage.type === 'bot_status') {
        queryClient.invalidateQueries({ queryKey: ['/api/bot-status'] });
        queryClient.invalidateQueries({ queryKey: [`/api/bot-configs/${lastMessage.data.configId}/stats`] });
      }
      if (lastMessage.type === 'bot_log') {
        queryClient.invalidateQueries({ queryKey: [`/api/bot-configs/${lastMessage.data.configId}/logs`] });
      }
    }
  }, [lastMessage]);

  // Select first bot by default
  useEffect(() => {
    if (botConfigs && botConfigs.length > 0 && !selectedBotId) {
      setSelectedBotId(botConfigs[0].id);
    }
  }, [botConfigs, selectedBotId]);

  const selectedConfig = botConfigs?.find(config => config.id === selectedBotId);
  const selectedStatus = Array.isArray(botStatuses) ? botStatuses.find((status: any) => status.config.id === selectedBotId) : undefined;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/bot-configs'] });
    queryClient.invalidateQueries({ queryKey: ['/api/bot-status'] });
  };

  const getConnectionStatus = () => {
    if (!isConnected) return { status: 'Disconnected', color: 'text-red-500' };
    if (selectedStatus?.status?.connected) return { status: 'Connected', color: 'text-green-500' };
    return { status: 'Offline', color: 'text-gray-500' };
  };

  const connectionInfo = getConnectionStatus();

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar 
        botConfigs={botConfigs || []}
        selectedBotId={selectedBotId}
        onSelectBot={setSelectedBotId}
        isLoading={configsLoading}
      />
      
      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Bot Dashboard</h2>
              <p className="text-gray-500 mt-1">Monitor and control your Minecraft AFK bot</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className={`text-sm font-medium ${connectionInfo.color}`}>
                  {connectionInfo.status}
                </span>
              </div>
              <Button 
                onClick={handleRefresh}
                variant="default"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {selectedConfig ? (
            <>
              <StatusGrid 
                botConfig={selectedConfig}
                botStatus={selectedStatus}
                isLoading={statusesLoading}
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                <BotControls 
                  botConfig={selectedConfig}
                  botStatus={selectedStatus}
                />
                
                <QuickConfig 
                  botConfig={selectedConfig}
                />
              </div>

              <div className="mt-8">
                <ChatMessage 
                  botConfig={selectedConfig}
                  isOnline={selectedStatus?.status?.stats?.status === 'online'}
                />
              </div>

              <ActivityLogs 
                botConfigId={selectedConfig.id}
                className="mt-8"
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64">
              <Server className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bot Configuration</h3>
              <p className="text-gray-500 mb-4">Create your first bot configuration to get started</p>
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Server className="w-4 h-4 mr-2" />
                Configure New Server
              </Button>
            </div>
          )}

          {/* Server Configuration Button */}
          {selectedConfig && (
            <div className="mt-8 flex justify-center">
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Server className="w-4 h-4 mr-2" />
                Configure New Server
              </Button>
            </div>
          )}
        </main>
      </div>

      <ServerConfigModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
