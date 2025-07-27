"use client";

import { useState, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { shoppingAssistant } from '@/ai/flows/shopping-assistant';
import { Bot, User, Send, Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { ScrollArea } from './ui/scroll-area';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  
  async function formAction(prevState: any, formData: FormData) {
    const query = formData.get('query') as string;
    if (!query) return { response: null, error: 'Query is empty' };

    const userMessage: Message = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);

    const result = await shoppingAssistant({ query });
    
    if (result.answer) {
      const assistantMessage: Message = { role: 'assistant', content: result.answer };
      setMessages(prev => [...prev, assistantMessage]);
      // Clear the input field after successful submission
      const form = (document.querySelector('form[data-chat-form="true"]') as HTMLFormElement);
      if(form) form.reset();
      return { response: result.answer, error: null };
    } else {
      return { response: null, error: 'Sorry, I could not find an answer.' };
    }
  }

  const [state, action] = useActionState(formAction, { response: null, error: null });

  const SubmitButton = () => {
    const { pending } = useFormStatus();
    return (
      <Button type="submit" size="icon" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      </Button>
    );
  };
  
  return (
    <Card className="w-full max-w-md h-[60vh] flex flex-col shadow-2xl rounded-xl">
      <CardHeader>
        <CardTitle className="font-headline flex items-center">
          <Bot className="mr-2" /> AI Shopping Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full pr-4">
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
             {useFormStatus().pending && (
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
        <form data-chat-form="true" action={action} className="w-full flex items-center gap-2">
          <Input name="query" placeholder="Ask about products, prices..." required />
          <SubmitButton />
        </form>
      </CardFooter>
    </Card>
  );
}
