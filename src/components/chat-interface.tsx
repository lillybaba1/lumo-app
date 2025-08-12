
"use client";

import { useEffect, useRef, useState } from 'react';
import { Bot, User, Send, Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import type { Message } from './ai-assistant-widget';

type ChatInterfaceProps = {
    messages: Message[];
    onQuerySubmit: (query: string) => void;
    isPending: boolean;
};

export function ChatInterface({ messages, onQuerySubmit, isPending }: ChatInterfaceProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim()) return;
    onQuerySubmit(query);
    setQuery('');
    formRef.current?.reset();
  }

  return (
    <Card className="w-full max-w-md h-[60vh] flex flex-col shadow-2xl rounded-xl">
      <CardHeader>
        <CardTitle className="font-headline flex items-center">
          <Bot className="mr-2" /> AI Shopping Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full pr-4" ref={scrollAreaRef as any}>
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="p-2 bg-primary/20 rounded-full">
                    <Bot className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div className={`rounded-lg px-4 py-2 max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <p>{msg.content}</p>
                </div>
                 {msg.role === 'user' && (
                  <div className="p-2 bg-accent/20 rounded-full">
                    <User className="w-6 h-6 text-accent-foreground" />
                  </div>
                )}
              </div>
            ))}
             {isPending && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/20 rounded-full">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div className="rounded-lg px-4 py-2 bg-muted flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form ref={formRef} onSubmit={handleSubmit} className="w-full flex items-center gap-2">
          <Input 
            name="query" 
            placeholder="Ask about products, prices..." 
            required 
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit" size="icon" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
