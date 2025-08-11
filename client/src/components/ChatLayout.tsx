import { useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { Headphones, BrainCircuit, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { LiveChatModal } from './LiveChatModal';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
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
    uploadUserDetails,
  } = useChat(sessionId);
  
  const [isTextRagEnabled, setIsTextRagEnabled] = useState(false);
  const [isLiveChatOpen, setIsLiveChatOpen] = useState(false);
  const [isVoiceRagEnabled, setIsVoiceRagEnabled] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful and friendly AI assistant. Provide clear, accurate, and concise responses to user questions.");
  const [tempSystemPrompt, setTempSystemPrompt] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleApplySystemPrompt = () => {
    if (tempSystemPrompt.trim()) {
      setSystemPrompt(tempSystemPrompt.trim());
      setTempSystemPrompt("");
      setIsSettingsOpen(false);
    }
  };

  return (
    <Card className="h-full w-full max-w-3xl flex flex-col shadow-xl">
      <CardHeader className="border-b flex flex-row items-center justify-between p-4">
        <CardTitle>Multimodal AI Chatbot</CardTitle>
        <div className="flex items-center gap-4">
          <Collapsible open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Settings
                {isSettingsOpen ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>

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
      
      {/* System Prompt Settings Section */}
      <Collapsible open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <CollapsibleContent className="border-b">
          <div className="p-4 bg-muted/50">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">
                  AI Assistant Personality & Behavior
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Customize how your AI assistant responds and behaves
                </p>
              </div>
              
              {/* Current Active Prompt */}
              {systemPrompt && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Currently Active:
                  </Label>
                  <div className="p-3 bg-background border rounded-md">
                    <p className="text-sm text-muted-foreground italic">
                      "{systemPrompt}"
                    </p>
                  </div>
                </div>
              )}
              
              {/* New Prompt Input */}
              <div className="space-y-2">
                <Label htmlFor="new-system-prompt" className="text-sm font-medium">
                  Set New Instructions:
                </Label>
                <Textarea
                  id="new-system-prompt"
                  placeholder="Enter new behavior instructions for your AI assistant... (e.g., 'You are a professional writing assistant who provides concise, clear feedback')"
                  value={tempSystemPrompt}
                  onChange={(e) => setTempSystemPrompt(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
                <div className="flex justify-end">
                  <Button 
                    onClick={handleApplySystemPrompt}
                    disabled={!tempSystemPrompt.trim()}
                    size="sm"
                  >
                    Apply Instructions
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
      
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
          systemPrompt={systemPrompt}
          uploadUserDetails={uploadUserDetails}
        />
      </CardFooter>
      <LiveChatModal
        isOpen={isLiveChatOpen}
        onOpenChange={setIsLiveChatOpen}
        isRagEnabled={isVoiceRagEnabled}
        sessionId={sessionId}
        systemPrompt={systemPrompt}
      />
    </Card>
  );
}