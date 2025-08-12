
"use client";

import { useState, useEffect, useRef, useTransition } from 'react';
import { Bot, X } from 'lucide-react';
import { Button } from './ui/button';
import { ChatInterface } from './chat-interface';
import { shoppingAssistant } from '@/ai/flows/shopping-assistant';

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
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    startTransition(async () => {
        try {
            const result = await shoppingAssistant({ query, history: messages });
            if (result.answer) {
                const assistantMessage: Message = { role: 'assistant', content: result.answer };
                setMessages(prev => [...prev, assistantMessage]);
            } else {
                 const errorMessage: Message = { role: 'assistant', content: "Sorry, I couldn't find an answer." };
                 setMessages(prev => [...prev, errorMessage]);
            }
        } catch (error) {
            const errorMessage: Message = { role: 'assistant', content: "An error occurred. Please try again." };
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
