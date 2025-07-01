import { CheckCircle, Clock, Wifi, RotateCcw } from "lucide-react";
import { BotConfig, BotStats } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface StatusGridProps {
  botConfig: BotConfig;
  botStatus?: any;
  isLoading: boolean;
}

export function StatusGrid({ botConfig, botStatus, isLoading }: StatusGridProps) {
  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'connecting': return 'Connecting';
      case 'error': return 'Error';
      default: return 'Offline';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="w-12 h-12 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const stats = botStatus?.status?.stats;
  const status = stats?.status || 'offline';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Bot Status</p>
            <p className={`text-2xl font-bold mt-2 ${getStatusColor(status)}`}>
              {getStatusText(status)}
            </p>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <CheckCircle className="text-green-500 text-xl" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Uptime</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {stats?.uptime ? formatUptime(stats.uptime) : '0h 0m'}
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Clock className="text-blue-600 text-xl" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Server Ping</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {stats?.serverPing ? `${stats.serverPing}ms` : '0ms'}
            </p>
          </div>
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <Wifi className="text-orange-500 text-xl" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Reconnections</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {stats?.reconnections || 0}
            </p>
          </div>
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <RotateCcw className="text-gray-600 text-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
