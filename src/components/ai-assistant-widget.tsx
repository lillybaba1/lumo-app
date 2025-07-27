
"use client";

import { useState } from 'react';
import { Bot, X } from 'lucide-react';
import { Button } from './ui/button';
import { ChatInterface } from './chat-interface';

export function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen && (
        <div className="mb-2">
           <ChatInterface />
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
