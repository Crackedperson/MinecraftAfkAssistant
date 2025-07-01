import { BotConfig } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Square, RotateCcw, UserCheck, Route, Shield } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PersistentStopDialog } from "@/components/persistent-stop-dialog";
import { useState } from "react";

interface BotControlsProps {
  botConfig: BotConfig;
  botStatus?: any;
}

export function BotControls({ botConfig, botStatus }: BotControlsProps) {
  const { toast } = useToast();
  const [showPersistentDialog, setShowPersistentDialog] = useState(false);

  const stopBotMutation = useMutation({
    mutationFn: (forced: boolean = false) => 
      apiRequest('POST', `/api/bot-configs/${botConfig.id}/stop`, { forced }),
    onSuccess: () => {
      toast({
        title: "Bot Stopped",
        description: "The bot has been stopped successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bot-status'] });
      setShowPersistentDialog(false);
    },
    onError: (error: any) => {
      // Check if this is a persistent mode error
      if (error.persistentMode) {
        setShowPersistentDialog(true);
        return;
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to stop bot",
        variant: "destructive",
      });
    },
  });

  const restartBotMutation = useMutation({
    mutationFn: () => apiRequest('POST', `/api/bot-configs/${botConfig.id}/restart`),
    onSuccess: () => {
      toast({
        title: "Bot Restarting",
        description: "The bot restart has been initiated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bot-status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to restart bot",
        variant: "destructive",
      });
    },
  });

  const startBotMutation = useMutation({
    mutationFn: () => apiRequest('POST', `/api/bot-configs/${botConfig.id}/start`),
    onSuccess: () => {
      toast({
        title: "Bot Started",
        description: "The bot has been started successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bot-status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start bot",
        variant: "destructive",
      });
    },
  });

  const isOnline = botStatus?.status?.stats?.status === 'online';
  const isConnected = botStatus?.status?.connected;

  const getAccountTypeDisplay = (type: string) => {
    return type === 'microsoft' ? 'Microsoft Account' : 'Offline Account';
  };

  const getMovementPatternDisplay = (pattern: string) => {
    switch (pattern) {
      case 'circular': return 'Circular Movement';
      case 'random': return 'Random Walk';
      case 'stationary': return 'Stationary (Mouse wiggle)';
      case 'custom': return 'Custom Pattern';
      default: return 'Circular Movement';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Bot Controls</h3>
        <p className="text-sm text-gray-500 mt-1">Start, stop, and configure your AFK bot</p>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Current Server</h4>
              <p className="text-sm text-gray-500">{botConfig.serverIP}:{botConfig.serverPort}</p>
            </div>
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Account Type</h4>
              <p className="text-sm text-gray-500">{getAccountTypeDisplay(botConfig.accountType)}</p>
            </div>
            <UserCheck className="text-green-500" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Anti-AFK Pattern</h4>
              <p className="text-sm text-gray-500">{getMovementPatternDisplay(botConfig.movementPattern)}</p>
            </div>
            <Route className="text-blue-600" />
          </div>

          {botConfig.persistentMode && (
            <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-600" />
                <div>
                  <h4 className="font-medium text-green-900">Persistent Mode Active</h4>
                  <p className="text-sm text-green-700">Bot will never leave without permission</p>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 pt-4 space-y-3">
            {isOnline ? (
              <>
                <Button 
                  className="w-full bg-red-500 text-white hover:bg-red-600"
                  onClick={() => stopBotMutation.mutate(false)}
                  disabled={stopBotMutation.isPending}
                >
                  <Square className="w-4 h-4 mr-2" />
                  {stopBotMutation.isPending ? 'Stopping...' : 'Stop Bot'}
                </Button>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => restartBotMutation.mutate()}
                  disabled={restartBotMutation.isPending}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {restartBotMutation.isPending ? 'Restarting...' : 'Restart Bot'}
                </Button>
              </>
            ) : (
              <Button 
                className="w-full bg-green-500 text-white hover:bg-green-600"
                onClick={() => startBotMutation.mutate()}
                disabled={startBotMutation.isPending}
              >
                <UserCheck className="w-4 h-4 mr-2" />
                {startBotMutation.isPending ? 'Starting...' : 'Start Bot'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <PersistentStopDialog
        isOpen={showPersistentDialog}
        onClose={() => setShowPersistentDialog(false)}
        onConfirm={() => stopBotMutation.mutate(true)}
        botName={botConfig.name}
      />
    </div>
  );
}
