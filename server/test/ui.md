Of course. As a senior frontend engineer, my focus is on creating a robust, maintainable, and highly polished user experience. We'll build a solid foundation that can easily accommodate all future features.

Here is a comprehensive plan and implementation guide following your requirements.

### 1. Technology Stack & Best Practices

We'll adhere to your chosen stack and augment it with industry-standard tooling for a production-ready application.

*   **Framework:** React + Vite + TypeScript
*   **Styling:** TailwindCSS
*   **UI Components:** **ShadCN/UI**. This is non-negotiable for a modern, accessible, and theme-able app. It integrates perfectly with Tailwind and provides essential primitives like Modals (`Dialog`), Toasts, Buttons, and more, out of the box.
*   **State Management:** **Zustand**. Excellent choice for its simplicity, minimal boilerplate, and hook-based API.
*   **Routing:** **React Router**. The standard for routing in React.
*   **Icons:** **Lucide React**. The default icon library for ShadCN/UI.
*   **Form Handling (for inputs):** **React Hook Form**. While simple forms are fine with `useState`, for complex interactions like file uploads and validation, this is the best practice.
*   **Linting/Formatting:** ESLint + Prettier.

### 2. Scalable Folder Structure

We'll use a feature-sliced structure. This is vastly more scalable than grouping by file type (e.g., all components in one folder).

```
/frontend
├── public/
├── src/
│   ├── api/
│   │   └── index.ts                # Centralized API client (axios or fetch)
│   ├── assets/                     # Images, fonts, etc.
│   ├── components/
│   │   ├── common/                 # App-wide generic components (Loader, ErrorBoundary, ModalWrapper)
│   │   └── ui/                     # Re-exported ShadCN components (Button, Input, Dialog, etc.)
│   ├── features/                   # CORE: Each feature gets its own folder
│   │   ├── chat/
│   │   │   ├── components/         # Chat-specific components (MessageBubble, ChatInput, TypingIndicator)
│   │   │   └── ChatView.tsx        # The main component assembling the chat feature
│   │   └── file-uploader/
│   │       ├── components/         # DragDropZone, FilePreview
│   │       └── FileUploaderModal.tsx # The complete modal component
│   ├── hooks/
│   │   ├── useChat.ts              # High-level hook to orchestrate chat logic
│   │   └── useWebSocket.ts         # Low-level hook to manage WebSocket connection
│   ├── lib/
│   │   ├── utils.ts                # Helper functions (e.g., cn for Tailwind merging)
│   │   └── constants.ts            # App-wide constants
│   ├── pages/
│   │   └── ChatPage.tsx            # Main page route component
│   ├── store/
│   │   └── useChatStore.ts         # Zustand store for all chat-related state
│   ├── types/
│   │   └── index.ts                # Centralized TypeScript types and interfaces
│   ├── App.tsx                     # Main app component with routing
│   └── main.tsx                    # Entry point
├── package.json
└── tsconfig.json
```

---

### 3. State Management (`Zustand`)

Let's define our global state. This store will be the single source of truth for the chat interface.

**`src/store/useChatStore.ts`**
```typescript
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Message, UploadedFile } from '@/types'; // We'll define these types

type ChatState = {
  sessionId: string;
  messages: Message[];
  uploadedFiles: UploadedFile[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
};

type ChatActions = {
  addMessage: (message: Message) => void;
  updateLastMessage: (chunk: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  addFile: (file: File) => void;
  updateFileStatus: (fileId: string, status: 'embedding' | 'ready' | 'error', metadata?: any) => void;
  resetChat: () => void;
};

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  sessionId: uuidv4(),
  messages: [],
  uploadedFiles: [],
  isLoading: false,
  isStreaming: false,
  error: null,

  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  
  updateLastMessage: (chunk) => {
    set((state) => {
      const lastMessage = state.messages[state.messages.length - 1];
      if (lastMessage?.sender === 'assistant') {
        const updatedMessage = { ...lastMessage, text: lastMessage.text + chunk };
        return { messages: [...state.messages.slice(0, -1), updatedMessage] };
      }
      return state;
    });
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  addFile: (file) => {
    const newFile: UploadedFile = {
      id: uuidv4(),
      file: file,
      name: file.name,
      status: 'uploading',
    };
    set((state) => ({ uploadedFiles: [...state.uploadedFiles, newFile] }));
  },

  updateFileStatus: (fileId, status, metadata) => {
    set((state) => ({
      uploadedFiles: state.uploadedFiles.map((f) =>
        f.id === fileId ? { ...f, status, metadata } : f
      ),
    }));
  },

  resetChat: () => set({ sessionId: uuidv4(), messages: [], uploadedFiles: [], error: null }),
}));
```

### 4. Core Logic: Hooks

The hooks will encapsulate all the complex logic, keeping our components clean and presentational.

**`src/hooks/useWebSocket.ts` (Low-Level)**
```typescript
import { useEffect, useRef, useState } from 'react';

interface WebSocketOptions {
  onOpen?: () => void;
  onMessage: (data: any) => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

export const useWebSocket = (url: string | null, options: WebSocketOptions) => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!url) return;

    ws.current = new WebSocket(url);
    ws.current.onopen = () => {
      setIsConnected(true);
      options.onOpen?.();
    };
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      options.onMessage(data);
    };
    ws.current.onerror = (error) => {
      setIsConnected(false);
      options.onError?.(error);
    };
    ws.current.onclose = () => {
      setIsConnected(false);
      options.onClose?.();
    };

    return () => {
      ws.current?.close();
    };
  }, [url]);

  const sendMessage = (data: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    } else {
      console.error('WebSocket is not connected.');
    }
  };

  return { sendMessage, isConnected };
};
```

**`src/hooks/useChat.ts` (High-Level Controller)**
```typescript
import { useChatStore } from '@/store/useChatStore';
import { useWebSocket } from './useWebSocket';
import { Message } from '@/types';
import { apiClient } from '@/api'; // Your configured axios/fetch client
import { useToast } from '@/components/ui/use-toast';

export const useChat = () => {
  const { toast } = useToast();
  const { 
    sessionId, messages, isLoading, 
    addMessage, updateLastMessage, setLoading, setError 
  } = useChatStore();

  const handleStreamedMessage = (data: any) => {
    if (data.type === 'stream.start') {
      const botMessage: Message = { id: data.run_id, text: '', sender: 'assistant', provider: data.provider };
      addMessage(botMessage);
    } else if (data.type === 'stream.chunk') {
      updateLastMessage(data.chunk);
    } else if (data.type === 'stream.end') {
      setLoading(false);
    } else if (data.type === 'error') {
      setError(data.message);
      setLoading(false);
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: data.message,
      });
    }
  };

  const WEBSOCKET_URL = `ws://localhost:8000/api/v1/chat/ws/${sessionId}`;
  const { sendMessage: sendWsMessage, isConnected } = useWebSocket(WEBSOCKET_URL, {
    onMessage: handleStreamedMessage,
    onError: (err) => {
      console.error('WebSocket Error:', err);
      toast({ variant: "destructive", title: "Connection Error" });
    }
  });

  const sendMessage = (text: string, options?: { use_rag: boolean }) => {
    if (!text.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), text, sender: 'user' };
    addMessage(userMessage);
    setLoading(true);
    setError(null);

    // Send via WebSocket for streaming
    sendWsMessage({
      message: text,
      use_rag: options?.use_rag || false,
    });
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('session_id', sessionId);

    // Use a standard HTTP POST for file uploads
    try {
        setLoading(true);
        const response = await apiClient.post('/upload', formData);
        toast({ title: "Success", description: `${file.name} uploaded and processed.` });
        // You would update file status in Zustand store here based on response
    } catch (err) {
        toast({ variant: "destructive", title: "Upload Failed" });
    } finally {
        setLoading(false);
    }
  };


  return { messages, isLoading, sendMessage, uploadFile, isConnected };
};
```

### 5. UI Components (`features/chat/components`)

Now we build the visual parts.

**`ChatInput.tsx`**
```tsx
import { Paperclip, Mic, SendHoriz } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { useChat } from '@/hooks/useChat';

export const ChatInput = () => {
  const [text, setText] = useState('');
  const { sendMessage, isLoading } = useChat();

  const handleSend = () => {
    sendMessage(text);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative flex items-center p-4 bg-background border-t">
      <Button variant="ghost" size="icon" className="mr-2">
        <Paperclip className="h-5 w-5" />
      </Button>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything..."
        className="flex-1 resize-none pr-20"
        rows={1}
      />
      <div className="absolute right-6 flex items-center">
        <Button variant="ghost" size="icon" disabled={isLoading}>
          <Mic className="h-5 w-5" />
        </Button>
        <Button size="icon" onClick={handleSend} disabled={isLoading || !text.trim()}>
          <SendHoriz className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
```

**`MessageBubble.tsx`**
```tsx
import { cn } from '@/lib/utils';
import { Message } from '@/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  message: Message;
}

export const MessageBubble = ({ message }: Props) => {
  const isUser = message.sender === 'user';
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] rounded-lg px-4 py-2',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.text}
          </ReactMarkdown>
        </div>
        {!isUser && message.provider && (
          <div className="text-xs text-muted-foreground mt-1 text-right">
            via {message.provider}
          </div>
        )}
      </div>
    </div>
  );
};
```

### 6. Assembling the `ChatPage.tsx`

Finally, we put everything together on one page.

**`src/pages/ChatPage.tsx`**
```tsx
import { useChat } from '@/hooks/useChat';
import { ChatInput } from '@/features/chat/components/ChatInput';
import { MessageBubble } from '@/features/chat/components/MessageBubble';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Toaster } from "@/components/ui/toaster"
import { useRef, useEffect } from 'react';

export const ChatPage = () => {
  const { messages, isLoading } = useChat();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 border-b text-center font-bold">
        Multimodal AI Chat
      </header>
      
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef as any}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isLoading && !messages.some(m => m.id.startsWith('run_')) && <TypingIndicator />}
        </div>
      </ScrollArea>
      
      <ChatInput />
      <Toaster />
    </div>
  );
};

// Simple TypingIndicator component
const TypingIndicator = () => (
  <div className="flex justify-start">
      <div className="bg-muted rounded-lg px-4 py-2 flex items-center space-x-1">
        <span className="h-2 w-2 bg-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span className="h-2 w-2 bg-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span className="h-2 w-2 bg-foreground/50 rounded-full animate-bounce"></span>
      </div>
  </div>
);
```

This setup provides a complete, production-grade foundation. It's fully typed, modular, and ready for you to flesh out the remaining features like audio recording (using `navigator.mediaDevices`) and the file uploader modal by building on the `useChat` hook and adding new components in the `features` directory.