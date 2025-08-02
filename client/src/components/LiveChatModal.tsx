import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Mic, PhoneOff, Loader2, Square } from 'lucide-react';
import { useLiveVoiceChat } from '@/hooks/useLiveVoiceChat';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LiveChatModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isRagEnabled: boolean;
  sessionId: string;
  systemPrompt: string;
}

const AudioVisualizer = () => (
  <div className="flex justify-center items-center gap-1 h-6">
    <span className="w-1 h-full bg-blue-500 rounded-full animate-[speak-1_1s_infinite]" />
    <span className="w-1 h-2/3 bg-blue-400 rounded-full animate-[speak-2_1s_infinite]" />
    <span className="w-1 h-full bg-blue-500 rounded-full animate-[speak-3_1s_infinite]" />
    <span className="w-1 h-1/2 bg-blue-400 rounded-full animate-[speak-2_1s_infinite]" />
    <span className="w-1 h-full bg-blue-500 rounded-full animate-[speak-1_1s_infinite]" />
  </div>
);

export function LiveChatModal({ isOpen, onOpenChange, isRagEnabled, sessionId, systemPrompt }: LiveChatModalProps) {
  const { connectionStatus, conversationStatus, connect, disconnect, toggleRecording } = 
    useLiveVoiceChat(isRagEnabled, sessionId, systemPrompt);

  useEffect(() => {
    if (isOpen && connectionStatus === 'disconnected') {
      connect();
    }
  }, [isOpen, connectionStatus, connect]);

  const handleEndCall = () => {
    disconnect();
    onOpenChange(false);
  };

  const renderStatusDescription = () => {
    switch (conversationStatus) {
      case 'recording': return "Listening... Click to stop.";
      case 'processing': return "Thinking...";
      case 'speaking': return "Assistant is speaking...";
      default: return isRagEnabled ? "Click to ask about your documents" : "Click the mic to start speaking";
    }
  };

  const canTalk = conversationStatus === 'idle' || conversationStatus === 'recording';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleEndCall()}>
      <DialogContent 
        className="sm:max-w-md bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 shadow-2xl backdrop-blur-sm"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            Live Voice Conversation
            {isRagEnabled && (
              <span className="ml-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                RAG Mode
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-300 mt-2">
            {renderStatusDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-8 gap-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-lg mx-4">
          {connectionStatus === 'connecting' && (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Connecting...</p>
            </div>
          )}
          
          {connectionStatus === 'connected' && (
            <div className='flex flex-col items-center gap-6'>
              <div className="h-24 w-24 flex items-center justify-center">
                {conversationStatus === 'speaking' && (
                  <div className="flex flex-col items-center gap-2">
                    <AudioVisualizer />
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Speaking</span>
                  </div>
                )}
                {conversationStatus === 'processing' && (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400" />
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Thinking</span>
                  </div>
                )}
              </div>
              <Button
                size="lg"
                className={cn(
                  "w-20 h-20 rounded-full transition-all duration-300 transform active:scale-95 shadow-lg",
                  "border-4 border-white dark:border-gray-800",
                  {
                    "bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white": conversationStatus === 'idle',
                    "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 animate-pulse text-white": conversationStatus === 'recording',
                    "bg-gray-400 cursor-not-allowed text-white": !canTalk,
                    "opacity-0": conversationStatus === 'processing' || conversationStatus === 'speaking'
                  }
                )}
                onClick={toggleRecording}
                disabled={!canTalk}
              >
                {conversationStatus === 'recording' ? (
                    <Square className="h-6 w-6 fill-current" />
                ) : (
                    <Mic className="h-8 w-8" />
                )}
              </Button>
            </div>
          )}

          {connectionStatus === 'error' && (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <PhoneOff className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-red-600 dark:text-red-400 font-medium">Connection Failed</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Check permissions & console</p>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4">
          <Button 
            variant="destructive" 
            onClick={handleEndCall}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2"
          >
            <PhoneOff className="mr-2 h-4 w-4" /> End Call
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}