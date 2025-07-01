import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBotConfigSchema, InsertBotConfig } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ServerConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ServerConfigModal({ isOpen, onClose }: ServerConfigModalProps) {
  const { toast } = useToast();

  const form = useForm<InsertBotConfig>({
    resolver: zodResolver(insertBotConfigSchema),
    defaultValues: {
      name: "",
      serverIP: "",
      serverPort: 25565,
      username: "",
      accountType: "offline",
      movementPattern: "circular",
      movementInterval: 30,
      autoReconnect: true,
      chatResponse: false,
      autoStart: false,
      isActive: false,
      persistentMode: true,
      allowAutoDisconnect: false,
    },
  });

  const createConfigMutation = useMutation({
    mutationFn: (data: InsertBotConfig) => apiRequest('POST', '/api/bot-configs', data),
    onSuccess: () => {
      toast({
        title: "Configuration Created",
        description: "Bot configuration has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bot-configs'] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create bot configuration",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertBotConfig) => {
    createConfigMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Server Configuration</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Configuration Name</Label>
            <Input
              id="name"
              placeholder="My AFK Bot"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="serverIP">Server IP</Label>
            <Input
              id="serverIP"
              placeholder="play.hypixel.net"
              {...form.register("serverIP")}
            />
            {form.formState.errors.serverIP && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.serverIP.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="serverPort">Port</Label>
            <Input
              id="serverPort"
              type="number"
              placeholder="25565"
              {...form.register("serverPort", { valueAsNumber: true })}
            />
            {form.formState.errors.serverPort && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.serverPort.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="AFK_Bot_123"
              {...form.register("username")}
            />
            {form.formState.errors.username && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.username.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="accountType">Account Type</Label>
            <Select
              value={form.watch("accountType")}
              onValueChange={(value) => form.setValue("accountType", value as "offline" | "microsoft")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="offline">Offline/Cracked</SelectItem>
                <SelectItem value="microsoft">Microsoft Account</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-700">Persistent Mode</h4>
              <p className="text-sm text-gray-500">Never leave without permission</p>
            </div>
            <Switch
              checked={form.watch("persistentMode") ?? true}
              onCheckedChange={(checked) => form.setValue("persistentMode", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-700">Auto-Start</h4>
              <p className="text-sm text-gray-500">Start bot automatically</p>
            </div>
            <Switch
              checked={form.watch("autoStart")}
              onCheckedChange={(checked) => form.setValue("autoStart", checked)}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={createConfigMutation.isPending}
            >
              {createConfigMutation.isPending ? 'Creating...' : 'Save & Connect'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
