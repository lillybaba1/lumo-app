
"use client";

import { useState, useEffect, useRef, useTransition } from 'react';
import { Bot, X } from 'lucide-react';
import { Button } from './ui/button';
import { ChatInterface } from './chat-interface';
// The server shopping assistant is exposed via an API route so the client
// can call it regardless of whether pages are rendered on Edge or Node.

export type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const CHAT_CLEAR_TIMEOUT = 3 * 60 * 1000; // 3 minutes

export function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleQuerySubmit = async (query: string) => {
    if (!query) return;

    const userMessage: Message = { role: 'user', content: query };
    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);

    startTransition(async () => {
      try {
        const res = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, history: updatedHistory }),
        });
        const data = await res.json();
        if (data && typeof data.answer === 'string') {
          const assistantMessage: Message = { role: 'assistant', content: data.answer };
          setMessages(prev => [...prev, assistantMessage]);
        } else if (data && data.error) {
          const errMsg: Message = { role: 'assistant', content: `Error: ${String(data.error)}` };
          setMessages(prev => [...prev, errMsg]);
        } else {
          const errorMessage: Message = { role: 'assistant', content: "Sorry, I couldn't find an answer." };
          setMessages(prev => [...prev, errorMessage]);
        }
      } catch (error) {
        const errorMessage: Message = { role: 'assistant', content: 'An error occurred. Please try again.' };
        setMessages(prev => [...prev, errorMessage]);
      }
    });
  };

  // Effect to manage chat clearing timeout
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (messages.length > 0) {
      timeoutRef.current = setTimeout(() => {
        setMessages([]);
      }, CHAT_CLEAR_TIMEOUT);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [messages]);


  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen && (
        <div className="mb-2">
           <ChatInterface 
             messages={messages}
             onQuerySubmit={handleQuerySubmit}
             isPending={isPending}
           />
        </div>
      )}
      <Button
        size="icon"
        className="rounded-full h-14 w-14 shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
        <span className="sr-only">{isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}</span>
      </Button>
    </div>
  );
}
