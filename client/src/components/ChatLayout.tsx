import { useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { Headphones, BrainCircuit } from 'lucide-react';
import { Button } from './ui/button';
import { LiveChatModal } from './LiveChatModal';
import { cn } from '@/lib/utils'; // <-- Import the cn utility for conditional classes

interface ChatLayoutProps {
  sessionId: string;
}

export function ChatLayout({ sessionId }: ChatLayoutProps) {
  const {
    messages,
    input,
    isLoading,
    handleInputChange,
    sendMessage,
    uploadFile,
  } = useChat(sessionId);
  
  const [isTextRagEnabled, setIsTextRagEnabled] = useState(false);
  const [isLiveChatOpen, setIsLiveChatOpen] = useState(false);
  const [isVoiceRagEnabled, setIsVoiceRagEnabled] = useState(false);

  return (
    <Card className="h-full w-full max-w-3xl flex flex-col shadow-xl">
      <CardHeader className="border-b flex flex-row items-center justify-between p-4">
        <CardTitle>Multimodal AI Chatbot</CardTitle>
        <div className="flex items-center gap-4">

          {/* --- [THIS IS THE REPLACEMENT FOR THE SWITCH] --- */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsVoiceRagEnabled(!isVoiceRagEnabled)}
            className={cn(
              // Apply these classes only when isVoiceRagEnabled is true
              isVoiceRagEnabled && "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
            )}
          >
            <BrainCircuit className={cn("mr-2 h-4 w-4", isVoiceRagEnabled && "text-blue-500")} />
            Voice RAG
          </Button>
          {/* ----------------------------------------------- */}

          <Button variant="outline" size="sm" onClick={() => setIsLiveChatOpen(true)}>
            <Headphones className="mr-2 h-4 w-4" />
            Live Chat
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <MessageList messages={messages} isLoading={isLoading} />
      </CardContent>
      <CardFooter className="p-0 border-t">
        <ChatInput
          input={input}
          isLoading={isLoading}
          handleInputChange={handleInputChange}
          sendMessage={sendMessage}
          uploadFile={uploadFile}
          isRagEnabled={isTextRagEnabled}
          onRagToggle={setIsTextRagEnabled}
        />
      </CardFooter>
      <LiveChatModal
        isOpen={isLiveChatOpen}
        onOpenChange={setIsLiveChatOpen}
        isRagEnabled={isVoiceRagEnabled}
        sessionId={sessionId}
      />
    </Card>
  );
}