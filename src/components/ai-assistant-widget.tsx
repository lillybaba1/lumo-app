
"use client";

import { useState, useActionState, useEffect, useRef } from 'react';
import { Bot, X, Send, Loader2, User } from 'lucide-react';
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

  const [state, action, isPending] = useActionState(async (prevState: any, formData: FormData) => {
    const query = formData.get('query') as string;
    if (!query) return { response: null, error: 'Query is empty' };

    const userMessage: Message = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);

    const currentHistory = [...messages, userMessage];

    const result = await shoppingAssistant({ query, history: currentHistory.slice(0, -1) });
    
    if (result.answer) {
      const assistantMessage: Message = { role: 'assistant', content: result.answer };
      setMessages(prev => [...prev, assistantMessage]);
      const form = (document.querySelector('form[data-chat-form="true"]') as HTMLFormElement);
      if(form) form.reset();
      return { response: result.answer, error: null };
    } else {
      setMessages(messages);
      return { response: null, error: 'Sorry, I could not find an answer.' };
    }
  }, { response: null, error: null });

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
             action={action}
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
