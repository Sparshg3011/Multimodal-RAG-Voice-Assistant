// src/hooks/useChat.ts
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const useChat = (sessionId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  /**
   * Sends a message to the backend, including the RAG flag and system prompt.
   */
  const sendMessage = async (
    e: React.FormEvent<HTMLFormElement>,
    isRagEnabled: boolean, // <-- The RAG flag parameter
    systemPrompt?: string // <-- The system prompt parameter
  ) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: uuidv4(), role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await apiClient.post('/chat', {
        session_id: sessionId,
        message: input,
        use_rag: isRagEnabled, // <-- Pass the flag to the backend
        system_prompt: systemPrompt, // <-- Pass the system prompt to the backend
      });
      const botMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: response.data.response,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'system',
        content: 'Error: Could not get a response. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadFile = async (file: File) => {
    if (!file || isLoading) return;

    // Check file size on frontend too
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error(`File too large. Maximum size is 50MB. Your file is ${(file.size / (1024*1024)).toFixed(1)}MB.`);
      return;
    }

    let uploadToastId = toast.loading(`📄 Uploading ${file.name}...`);
    setIsLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('session_id', sessionId);

    try {
      // Update progress message
      toast.loading(`🔄 Processing ${file.name}... This may take up to 2 minutes for large files.`, { id: uploadToastId });
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
      
      const response = await fetch('http://localhost:8000/api/v1/upload', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'File upload failed');
      }
      
      toast.success(result.message || 'File uploaded successfully!', { id: uploadToastId });
      
      const systemMessage: Message = {
        id: uuidv4(),
        role: 'system',
        content: `File "${file.name}" uploaded successfully. You can now enable the "Query Uploaded Files" switch to ask questions about it.`,
      };
      setMessages(prev => [...prev, systemMessage]);

    } catch (error: any) {
      console.error('Upload error:', error);
      let errorMessage = 'An error occurred during upload.';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Upload timed out. The file might be too large or the server is busy. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { id: uploadToastId });
    } finally {
      setIsLoading(false);
    }
  };

  const uploadUserDetails = async (file: File) => {
    if (!file || isLoading) return;

    // Check file size on frontend too
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error(`File too large. Maximum size is 50MB. Your file is ${(file.size / (1024*1024)).toFixed(1)}MB.`);
      return;
    }

    let uploadToastId = toast.loading(`👤 Uploading user details: ${file.name}...`);
    setIsLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('session_id', sessionId);

    try {
      // Update progress message
      toast.loading(`🔄 Processing user details: ${file.name}... This may take up to 2 minutes for large files.`, { id: uploadToastId });
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
      
      const response = await fetch('http://localhost:8000/api/v1/upload-user-details', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'User details upload failed');
      }
      
      toast.success(result.message || 'User details uploaded successfully!', { id: uploadToastId });
      
      const systemMessage: Message = {
        id: uuidv4(),
        role: 'system',
        content: `User details file "${file.name}" uploaded successfully. You can now enable the "Query Uploaded Files" switch to ask questions about the user details.`,
      };
      setMessages(prev => [...prev, systemMessage]);

    } catch (error: any) {
      console.error('User details upload error:', error);
      let errorMessage = 'An error occurred during user details upload.';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Upload timed out. The file might be too large or the server is busy. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { id: uploadToastId });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    input,
    isLoading,
    handleInputChange,
    sendMessage,
    uploadFile,
    uploadUserDetails,
  };
};