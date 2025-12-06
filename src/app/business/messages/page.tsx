'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare,
  Search,
  Send,
  Paperclip,
  MoreVertical,
  Archive,
  CheckCheck,
  Clock,
  User,
  Settings,
  Zap,
  RefreshCw,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getConversations, getMessages, sendMessage, markConversationRead, updateConversationStatus } from './actions';
import { QuickRepliesDialog } from './quick-replies-dialog';
import { NotificationSettingsDialog } from './notification-settings-dialog';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_avatar?: string;
  subject?: string;
  status: 'open' | 'closed' | 'archived';
  last_message_at: string;
  seller_unread_count: number;
  last_message?: string;
  order_id?: string;
}

interface Message {
  id: string;
  sender_id: string;
  sender_type: 'customer' | 'seller';
  content: string;
  attachments: any[];
  is_read: boolean;
  created_at: string;
}

interface QuickReply {
  id: string;
  title: string;
  content: string;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [activeTab, setActiveTab] = useState('open');

  useEffect(() => {
    loadConversations();
  }, [activeTab]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      if (selectedConversation.seller_unread_count > 0) {
        markConversationRead(selectedConversation.id);
      }
    }
  }, [selectedConversation]);

  async function loadConversations() {
    setLoading(true);
    const result = await getConversations(activeTab as any);
    if (result.success) {
      setConversations(result.data || []);
    }
    setLoading(false);
  }

  async function loadMessages(conversationId: string) {
    const result = await getMessages(conversationId);
    if (result.success) {
      setMessages(result.data || []);
    }
  }

  async function handleSend() {
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    const result = await sendMessage(selectedConversation.id, newMessage.trim());
    if (result.success) {
      setMessages([...messages, result.data]);
      setNewMessage('');
    }
    setSending(false);
  }

  async function handleStatusChange(conversationId: string, status: 'open' | 'closed' | 'archived') {
    const result = await updateConversationStatus(conversationId, status);
    if (result.success) {
      loadConversations();
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
      }
    }
  }

  function useQuickReply(content: string) {
    setNewMessage(content);
    setShowQuickReplies(false);
  }

  const filteredConversations = conversations.filter(conv =>
    conv.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unreadCount = conversations.reduce((sum, c) => sum + c.seller_unread_count, 0);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Conversations List */}
      <Card className="w-96 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messages
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-1">
              <QuickRepliesDialog />
              <NotificationSettingsDialog />
            </div>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mx-4">
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab} className="flex-1 m-0">
            <ScrollArea className="h-full">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mb-2" />
                  <p>No {activeTab} conversations</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedConversation?.id === conv.id
                          ? 'bg-primary/10'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => setSelectedConversation(conv)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                          {conv.customer_avatar ? (
                            <img
                              src={conv.customer_avatar}
                              alt={conv.customer_name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium truncate">
                              {conv.customer_name || 'Customer'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                            </span>
                          </div>
                          {conv.subject && (
                            <p className="text-sm text-muted-foreground truncate">
                              {conv.subject}
                            </p>
                          )}
                          {conv.last_message && (
                            <p className="text-sm text-muted-foreground truncate">
                              {conv.last_message}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {conv.order_id && (
                              <Badge variant="outline" className="text-xs">
                                Order
                              </Badge>
                            )}
                            {conv.seller_unread_count > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {conv.seller_unread_count} new
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {selectedConversation.customer_name || 'Customer'}
                    </h3>
                    {selectedConversation.subject && (
                      <p className="text-sm text-muted-foreground">
                        {selectedConversation.subject}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {selectedConversation.status === 'open' && (
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(selectedConversation.id, 'closed')}
                      >
                        <CheckCheck className="h-4 w-4 mr-2" />
                        Mark as Resolved
                      </DropdownMenuItem>
                    )}
                    {selectedConversation.status === 'closed' && (
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(selectedConversation.id, 'open')}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Reopen Conversation
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => handleStatusChange(selectedConversation.id, 'archived')}
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_type === 'seller' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.sender_type === 'seller'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <div className={`flex items-center gap-1 mt-1 text-xs ${
                        msg.sender_type === 'seller' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        {msg.sender_type === 'seller' && msg.is_read && (
                          <CheckCheck className="h-3 w-3 ml-1" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowQuickReplies(!showQuickReplies)}
                  title="Quick Replies"
                >
                  <Zap className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" title="Attach File">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="flex-1"
                />
                <Button onClick={handleSend} disabled={!newMessage.trim() || sending}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {showQuickReplies && quickReplies.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {quickReplies.map((qr) => (
                    <Button
                      key={qr.id}
                      variant="outline"
                      size="sm"
                      onClick={() => useQuickReply(qr.content)}
                    >
                      {qr.title}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="h-16 w-16 mb-4" />
            <h3 className="text-lg font-medium">Select a conversation</h3>
            <p className="text-sm">Choose a conversation from the list to start messaging</p>
          </div>
        )}
      </Card>
    </div>
  );
}
