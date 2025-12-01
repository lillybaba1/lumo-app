
"use client";

import { useState, useEffect, useRef, useTransition, useCallback } from 'react';
import { Bot, X, MessageCircle } from 'lucide-react';
import { Button } from './ui/button';
import { ChatInterface } from './chat-interface';
import Image from 'next/image';

export type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const CHAT_CLEAR_TIMEOUT = 3 * 60 * 1000; // 3 minutes
const POSITION_STORAGE_KEY = 'chatbot-position';

interface ChatbotSettings {
  chatbotImage?: string;
  chatbotName?: string;
  chatbotEnabled?: boolean;
  chatbotGlowColor?: string;
  chatbotBubbleGradientFrom?: string;
  chatbotBubbleGradientTo?: string;
  chatbotLabelBgColor?: string;
  chatbotLabelTextColor?: string;
  chatbotPulseEnabled?: boolean;
}

export function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [settings, setSettings] = useState<ChatbotSettings>({});
  const timeoutRef = useRef<any>(null);
  const [isPending, startTransition] = useTransition();
  
  // Draggable state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load saved position and settings on mount
  useEffect(() => {
    // Load position
    const savedPosition = localStorage.getItem(POSITION_STORAGE_KEY);
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition);
        setPosition(parsed);
      } catch (e) {
        // Invalid saved position, use default
      }
    }

    // Load chatbot settings
    fetch('/api/settings?nocache=' + Date.now())
      .then(res => res.json())
      .then(data => {
        console.log('[Chatbot] Loaded settings:', data);
        setSettings({
          chatbotImage: data.chatbotImage || '',
          chatbotName: data.chatbotName || 'Luna',
          chatbotEnabled: data.chatbotEnabled !== false,
          chatbotGlowColor: data.chatbotGlowColor || '#8b5cf6',
          chatbotBubbleGradientFrom: data.chatbotBubbleGradientFrom || '#8b5cf6',
          chatbotBubbleGradientTo: data.chatbotBubbleGradientTo || '#ec4899',
          chatbotLabelBgColor: data.chatbotLabelBgColor || '#ffffff',
          chatbotLabelTextColor: data.chatbotLabelTextColor || '#8b5cf6',
          chatbotPulseEnabled: data.chatbotPulseEnabled !== false,
        });
      })
      .catch((err) => {
        console.error('[Chatbot] Failed to load settings:', err);
        // Use defaults on error
      });
  }, []);

  // Save position when it changes
  useEffect(() => {
    if (position.x !== 0 || position.y !== 0) {
      localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(position));
    }
  }, [position]);

  // Handle mouse/touch events for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!buttonRef.current) return;
    
    e.preventDefault();
    const rect = buttonRef.current.getBoundingClientRect();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setDragOffset({
      x: clientX - rect.left,
      y: clientY - rect.top,
    });
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const newX = window.innerWidth - clientX - (56 - dragOffset.x); // 56 = button width
    const newY = window.innerHeight - clientY - (56 - dragOffset.y); // 56 = button height
    
    // Clamp to viewport
    const clampedX = Math.max(16, Math.min(window.innerWidth - 72, newX));
    const clampedY = Math.max(16, Math.min(window.innerHeight - 72, newY));
    
    setPosition({ x: clampedX, y: clampedY });
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add/remove global event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

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

  // Don't render if chatbot is disabled
  if (settings.chatbotEnabled === false) {
    return null;
  }

  const handleClick = () => {
    // Only toggle if we weren't dragging
    if (!isDragging) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="fixed z-50 select-none"
      style={{ 
        right: position.x || 16, 
        bottom: position.y || 16,
        transition: isDragging ? 'none' : 'right 0.1s, bottom 0.1s',
      }}
    >
      {isOpen && (
        <div className="mb-2">
           <ChatInterface 
             messages={messages}
             onQuerySubmit={handleQuerySubmit}
             isPending={isPending}
           />
        </div>
      )}
      
      {/* Chat Button Container */}
      <div className="flex flex-col items-center gap-1">
        <Button
          ref={buttonRef}
          size="icon"
          className={`rounded-full h-14 w-14 shadow-lg relative overflow-visible group ${
            isDragging ? 'cursor-grabbing scale-110' : 'cursor-grab hover:scale-105'
          } transition-transform ${settings.chatbotImage && !isOpen ? 'bg-transparent p-0' : ''}`}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
          style={!isOpen && settings.chatbotImage ? {
            border: `2px solid ${settings.chatbotGlowColor || '#8b5cf6'}`,
            outline: `4px solid ${(settings.chatbotGlowColor || '#8b5cf6')}4D`,
            boxShadow: `0 0 20px ${settings.chatbotGlowColor || '#8b5cf6'}66, 0 4px 12px rgba(0, 0, 0, 0.15)`
          } : undefined}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : settings.chatbotImage ? (
            <>
              <Image
                src={settings.chatbotImage}
                alt={settings.chatbotName || 'AI Assistant'}
                fill
                className="object-cover rounded-full"
                sizes="56px"
                unoptimized
              />
              {/* Chat bubble indicator - larger and more visible */}
              <div 
                className={`absolute -top-1 -right-1 text-white rounded-full p-1.5 shadow-lg z-10 ${settings.chatbotPulseEnabled !== false ? 'animate-pulse' : ''}`}
                style={{
                  background: `linear-gradient(to bottom right, ${settings.chatbotBubbleGradientFrom || '#8b5cf6'}, ${settings.chatbotBubbleGradientTo || '#ec4899'})`
                }}
              >
                <MessageCircle className="h-3.5 w-3.5" />
              </div>
            </>
          ) : (
            <Bot className="h-6 w-6" />
          )}
          <span className="sr-only">{isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}</span>
          
          {/* Drag hint on hover */}
          {!isOpen && !isDragging && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/75 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Drag to move
            </div>
          )}
        </Button>
        
        {/* Chat label on mobile */}
        {!isOpen && (
          <span 
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm"
            style={{
              backgroundColor: settings.chatbotLabelBgColor || '#ffffff',
              color: settings.chatbotLabelTextColor || '#8b5cf6',
            }}
          >
            Chat
          </span>
        )}
      </div>
    </div>
  );
}
