import { useQuery } from "@tanstack/react-query";
import { BotLog } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Trash2, Download } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useWebSocket } from "@/hooks/use-websocket";
import { useEffect, useRef } from "react";

interface ActivityLogsProps {
  botConfigId: number;
  className?: string;
}

export function ActivityLogs({ botConfigId, className }: ActivityLogsProps) {
  const { toast } = useToast();
  const { lastMessage } = useWebSocket();
  const logsEndRef = useRef<HTMLDivElement>(null);

  const { data: logs, isLoading } = useQuery<BotLog[]>({
    queryKey: [`/api/bot-configs/${botConfigId}/logs`],
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (lastMessage?.type === 'bot_log' && lastMessage.data.configId === botConfigId) {
      setTimeout(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [lastMessage, botConfigId]);

  const clearLogsMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', `/api/bot-configs/${botConfigId}/logs`),
    onSuccess: () => {
      toast({
        title: "Logs Cleared",
        description: "All activity logs have been cleared.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/bot-configs/${botConfigId}/logs`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to clear logs",
        variant: "destructive",
      });
    },
  });

  const exportLogs = () => {
    if (!logs || logs.length === 0) {
      toast({
        title: "No Logs",
        description: "There are no logs to export.",
        variant: "destructive",
      });
      return;
    }

    const logsText = logs.map(log => {
      const timestamp = new Date(log.timestamp!).toLocaleString();
      return `${timestamp} [${log.logType}] ${log.message}`;
    }).join('\n');

    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bot-${botConfigId}-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Logs Exported",
      description: "Activity logs have been downloaded.",
    });
  };

  const getLogTypeColor = (logType: string) => {
    switch (logType) {
      case 'INFO': return 'text-green-400';
      case 'MOVE': return 'text-blue-400';
      case 'CHAT': return 'text-yellow-400';
      case 'PING': return 'text-green-400';
      case 'ERROR': return 'text-red-400';
      case 'WARN': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={cn("bg-white rounded-xl shadow-sm border border-gray-200", className)}>
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Activity Logs</h3>
          <p className="text-sm text-gray-500 mt-1">Recent bot activities and events</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => clearLogsMutation.mutate()}
            disabled={clearLogsMutation.isPending}
            className="text-gray-600 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportLogs}
            className="text-gray-600 hover:text-blue-600"
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>
      <div className="p-6">
        <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-100 h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400">Loading activity logs...</div>
            </div>
          ) : logs && logs.length > 0 ? (
            <>
              {logs.map((log) => (
                <div key={log.id} className="mb-1 flex items-start space-x-2">
                  <span className="text-gray-400 text-xs mt-0.5 whitespace-nowrap">
                    {new Date(log.timestamp!).toLocaleTimeString('en-US', { hour12: false })}
                  </span>
                  <span className={getLogTypeColor(log.logType)}>
                    [{log.logType}]
                  </span>
                  <span className="flex-1">{log.message}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400">No activity logs available</div>
            </div>
          )}
          <div className="w-2 h-4 bg-gray-400 animate-pulse inline-block"></div>
        </div>
      </div>
    </div>
  );
}
