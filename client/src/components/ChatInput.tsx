// src/components/ChatInput.tsx
import { Paperclip, SendHorizonal, Loader2, BrainCircuit, User } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useRef } from 'react';
import { cn } from '@/lib/utils'; // Import the cn utility for conditional classes
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip" // Import Tooltip components


interface ChatInputProps {
  input: string;
  isLoading: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sendMessage: (e: React.FormEvent<HTMLFormElement>, isRagEnabled: boolean, systemPrompt?: string) => void;
  uploadFile: (file: File) => void;
  uploadUserDetails: (file: File) => void;
  isRagEnabled: boolean;
  onRagToggle: (enabled: boolean) => void;
  systemPrompt: string;
}

export function ChatInput({
  input,
  isLoading,
  handleInputChange,
  sendMessage,
  uploadFile,
  uploadUserDetails,
  isRagEnabled,
  onRagToggle,
  systemPrompt,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userDetailsInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const handleUserDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadUserDetails(e.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUserDetailsUploadClick = () => {
    userDetailsInputRef.current?.click();
  };

  return (
    <div className="p-4 bg-background w-full">
      <div className="flex items-center gap-2">
        {/* Hidden file inputs */}
        <Input
          id="file-upload"
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          disabled={isLoading}
        />
        <Input
          id="user-details-upload"
          type="file"
          ref={userDetailsInputRef}
          onChange={handleUserDetailsChange}
          className="hidden"
          disabled={isLoading}
        />
        
        {/* Document Upload Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleUploadClick}
                disabled={isLoading}
                aria-label="Upload document"
                className="hover:bg-blue-50 hover:text-blue-600 border border-blue-200"
              >
                <Paperclip className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Upload Documents</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* User Details Upload Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleUserDetailsUploadClick}
                disabled={isLoading}
                aria-label="Upload user details"
                className="hover:bg-green-50 hover:text-green-600 border border-green-200"
              >
                <User className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Upload User Details</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Visual separator */}
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        {/* The main chat input form */}
        <form onSubmit={(e) => sendMessage(e, isRagEnabled, systemPrompt)} className="flex-1 flex items-center gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder={isRagEnabled ? "Ask about your documents..." : "Ask me anything..."}
            autoComplete="off"
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()} aria-label="Send message">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizonal className="h-5 w-5" />}
          </Button>
        </form>

        {/* --- THIS IS THE NEW, IMPROVED RAG TOGGLE BUTTON --- */}
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                    type="button"
                    variant={isRagEnabled ? "secondary" : "ghost"} // Change variant based on state
                    size="icon"
                    onClick={() => onRagToggle(!isRagEnabled)} // Simple toggle on click
                    disabled={isLoading}
                    aria-label="Toggle RAG mode"
                    className={cn({
                        "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300": isRagEnabled,
                    })}
                    >
                    <BrainCircuit className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Query Uploaded Files</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>

      </div>
    </div>
  );
}