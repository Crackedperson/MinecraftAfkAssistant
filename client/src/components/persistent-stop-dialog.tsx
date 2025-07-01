import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface PersistentStopDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  botName: string;
}

export function PersistentStopDialog({ isOpen, onClose, onConfirm, botName }: PersistentStopDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            <AlertDialogTitle>Persistent Mode Protection</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2">
            <p>
              <strong>"{botName}"</strong> is running in persistent mode and is designed to never leave the server without your explicit permission.
            </p>
            <p>
              This bot will automatically reconnect if disconnected, kicked, or encounters errors to ensure your server stays alive 24/7.
            </p>
            <p className="text-orange-600 font-medium">
              Are you sure you want to force stop this bot?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>
            Cancel - Keep Bot Running
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            Force Stop Bot
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}