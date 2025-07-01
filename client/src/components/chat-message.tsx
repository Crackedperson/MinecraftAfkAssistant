import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BotConfig } from "@shared/schema";

interface ChatMessageProps {
  botConfig: BotConfig;
  isOnline: boolean;
}

export function ChatMessage({ botConfig, isOnline }: ChatMessageProps) {
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const sendMessageMutation = useMutation({
    mutationFn: (message: string) => 
      apiRequest('POST', `/api/bot-configs/${botConfig.id}/chat`, { message }),
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your message has been sent to the server chat.",
      });
      setMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    if (!isOnline) {
      toast({
        title: "Bot Offline",
        description: "The bot must be online to send messages.",
        variant: "destructive",
      });
      return;
    }
    sendMessageMutation.mutate(message.trim());
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Send Chat Message</h3>
      </div>
      
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isOnline ? "Type your message..." : "Bot must be online to send messages"}
          disabled={!isOnline || sendMessageMutation.isPending}
          className="flex-1"
          maxLength={256}
        />
        <Button 
          type="submit" 
          disabled={!message.trim() || !isOnline || sendMessageMutation.isPending}
          size="sm"
        >
          {sendMessageMutation.isPending ? (
            "Sending..."
          ) : (
            <>
              <Send className="h-4 w-4 mr-1" />
              Send
            </>
          )}
        </Button>
      </form>
      
      {!isOnline && (
        <p className="text-sm text-gray-500 mt-2">
          Start the bot to send messages to the server chat.
        </p>
      )}
    </div>
  );
}