'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  Send, 
  Store, 
  ArrowLeft,
  Clock,
  CheckCheck,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface Conversation {
  id: string;
  boutique_id: string;
  customer_id: string;
  subject?: string;
  status: string;
  last_message_at: string;
  customer_unread_count: number;
  boutique?: {
    display_name: string;
    logo?: string;
    slug: string;
  };
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: 'customer' | 'seller';
  content: string;
  is_read: boolean;
  created_at: string;
}

export default function CustomerMessagesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const boutiqueIdParam = searchParams?.get('boutique');

  // Check auth and load conversations
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirect=/messages');
        return;
      }
      setUser(user);
      await loadConversations(user.id);
      setLoading(false);
    }
    init();
  }, []);

  // Handle boutique param - create or open conversation
  useEffect(() => {
    if (boutiqueIdParam && user && !loading) {
      handleStartConversation(boutiqueIdParam);
    }
  }, [boutiqueIdParam, user, loading]);

  async function loadConversations(userId: string) {
    const { data, error } = await supabase
      .from('seller_conversations')
      .select(`
        *,
        boutique:boutiques(display_name, logo, slug)
      `)
      .eq('customer_id', userId)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Error loading conversations:', error);
      return;
    }

    setConversations(data || []);
  }

  async function handleStartConversation(boutiqueId: string) {
    // Check if conversation already exists
    const existing = conversations.find(c => c.boutique_id === boutiqueId);
    if (existing) {
      setSelectedConversation(existing);
      await loadMessages(existing.id);
      return;
    }

    // Create new conversation
    const { data, error } = await supabase
      .from('seller_conversations')
      .insert({
        boutique_id: boutiqueId,
        customer_id: user.id,
        status: 'open',
      })
      .select(`
        *,
        boutique:boutiques(display_name, logo, slug)
      `)
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Could not start conversation. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    setConversations(prev => [data, ...prev]);
    setSelectedConversation(data);
  }

  async function loadMessages(conversationId: string) {
    const { data, error } = await supabase
      .from('seller_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages(data || []);
    
    // Mark messages as read
    await supabase
      .from('seller_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('sender_type', 'seller')
      .eq('is_read', false);

    // Reset unread count
    await supabase
      .from('seller_conversations')
      .update({ customer_unread_count: 0 })
      .eq('id', conversationId);

    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  async function handleSendMessage() {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    
    const { data, error } = await supabase
      .from('seller_messages')
      .insert({
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        sender_type: 'customer',
        content: newMessage.trim(),
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Could not send message. Please try again.',
        variant: 'destructive',
      });
      setSending(false);
      return;
    }

    setMessages(prev => [...prev, data]);
    setNewMessage('');
    setSending(false);
    
    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <MessageCircle className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">My Messages</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Conversations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-sm mt-1">Start chatting with a seller from their boutique page</p>
                </div>
              ) : (
                <div className="divide-y">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setSelectedConversation(conv);
                        loadMessages(conv.id);
                      }}
                      className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                        selectedConversation?.id === conv.id ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conv.boutique?.logo} />
                          <AvatarFallback>
                            <Store className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">
                              {conv.boutique?.display_name || 'Unknown Store'}
                            </p>
                            {conv.customer_unread_count > 0 && (
                              <Badge variant="default" className="ml-2">
                                {conv.customer_unread_count}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="md:col-span-2 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Header */}
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="md:hidden"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedConversation.boutique?.logo} />
                    <AvatarFallback>
                      <Store className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {selectedConversation.boutique?.display_name}
                    </p>
                    <Link 
                      href={`/boutique/${selectedConversation.boutique?.slug}`}
                      className="text-xs text-primary hover:underline"
                    >
                      Visit Store
                    </Link>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No messages yet</p>
                      <p className="text-sm">Send a message to start the conversation</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                            msg.sender_type === 'customer'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <div className={`flex items-center gap-1 mt-1 ${
                            msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'
                          }`}>
                            <span className="text-xs opacity-70">
                              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                            </span>
                            {msg.sender_type === 'customer' && msg.is_read && (
                              <CheckCheck className="h-3 w-3 opacity-70" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                  className="flex gap-2"
                >
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    disabled={sending}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!newMessage.trim() || sending}>
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Select a conversation</p>
                <p className="text-sm">or start a new one from a boutique page</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
