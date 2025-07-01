import { BotConfig, InsertBotConfig } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Save } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface QuickConfigProps {
  botConfig: BotConfig;
}

export function QuickConfig({ botConfig }: QuickConfigProps) {
  const { toast } = useToast();
  const [movementPattern, setMovementPattern] = useState(botConfig.movementPattern);
  const [movementInterval, setMovementInterval] = useState([botConfig.movementInterval]);
  const [autoReconnect, setAutoReconnect] = useState(botConfig.autoReconnect);
  const [chatResponse, setChatResponse] = useState(botConfig.chatResponse);
  const [persistentMode, setPersistentMode] = useState(botConfig.persistentMode ?? true);

  const updateConfigMutation = useMutation({
    mutationFn: (updates: Partial<InsertBotConfig>) => 
      apiRequest('PUT', `/api/bot-configs/${botConfig.id}`, updates),
    onSuccess: () => {
      toast({
        title: "Configuration Saved",
        description: "Bot configuration has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bot-configs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save configuration",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateConfigMutation.mutate({
      movementPattern,
      movementInterval: movementInterval[0],
      autoReconnect,
      chatResponse,
      persistentMode,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Quick Configuration</h3>
        <p className="text-sm text-gray-500 mt-1">Adjust settings without stopping the bot</p>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Movement Pattern</label>
            <Select value={movementPattern} onValueChange={setMovementPattern}>
              <SelectTrigger>
                <SelectValue placeholder="Select movement pattern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="circular">Circular Movement</SelectItem>
                <SelectItem value="random">Random Walk</SelectItem>
                <SelectItem value="stationary">Stationary (Mouse wiggle)</SelectItem>
                <SelectItem value="custom">Custom Pattern</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Movement Interval (seconds)
            </label>
            <Slider
              value={movementInterval}
              onValueChange={setMovementInterval}
              max={120}
              min={5}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>5s</span>
              <span>{movementInterval[0]}s</span>
              <span>120s</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-700">Auto-Reconnect</h4>
              <p className="text-sm text-gray-500">Reconnect when disconnected</p>
            </div>
            <Switch
              checked={autoReconnect}
              onCheckedChange={setAutoReconnect}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-700">Chat Response</h4>
              <p className="text-sm text-gray-500">Respond to mentions</p>
            </div>
            <Switch
              checked={chatResponse}
              onCheckedChange={setChatResponse}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-700">Persistent Mode</h4>
              <p className="text-sm text-gray-500">Never leave without permission</p>
            </div>
            <Switch
              checked={persistentMode}
              onCheckedChange={setPersistentMode}
            />
          </div>

          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={handleSave}
            disabled={updateConfigMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {updateConfigMutation.isPending ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>
    </div>
  );
}
