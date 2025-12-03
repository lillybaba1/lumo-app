'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Bot, Send, Loader2, User, Sparkles, Shield, 
  TrendingUp, Package, DollarSign, PenTool, RefreshCw, FileText,
  MessageSquare, Wand2, Copy, Check, Settings2
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface WritingConfig {
  contentType: string;
  tone: string;
  length: string;
  style: string;
  customInstructions: string;
  topic: string;
}

const QUICK_ACTIONS = [
  { label: 'Dashboard', query: 'Show me the dashboard overview', icon: TrendingUp, color: 'text-amber-600' },
  { label: 'Low Stock', query: 'Show low stock report', icon: Package, color: 'text-blue-600' },
  { label: 'Recent Orders', query: 'Show recent orders', icon: DollarSign, color: 'text-green-600' },
  { label: 'Help', query: 'What can you do?', icon: Sparkles, color: 'text-primary' },
];

const CONTENT_TYPES = [
  { value: 'product-description', label: 'Product Description' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'email', label: 'Email' },
  { value: 'social-post', label: 'Social Media Post' },
  { value: 'category-description', label: 'Category Description' },
  { value: 'promotion', label: 'Promotion/Sale' },
  { value: 'policy', label: 'Policy/Terms' },
  { value: 'custom', label: 'Custom Content' },
];

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly & Approachable' },
  { value: 'luxurious', label: 'Luxurious & Premium' },
  { value: 'casual', label: 'Casual & Relaxed' },
  { value: 'urgent', label: 'Urgent & Action-Oriented' },
  { value: 'playful', label: 'Playful & Fun' },
  { value: 'minimalist', label: 'Minimalist & Clean' },
  { value: 'storytelling', label: 'Storytelling' },
];

const LENGTHS = [
  { value: 'short', label: 'Short (1-2 sentences)' },
  { value: 'medium', label: 'Medium (1-2 paragraphs)' },
  { value: 'long', label: 'Long (3+ paragraphs)' },
  { value: 'detailed', label: 'Detailed (comprehensive)' },
];

const STYLES = [
  { value: 'descriptive', label: 'Descriptive' },
  { value: 'persuasive', label: 'Persuasive/Sales' },
  { value: 'informative', label: 'Informative' },
  { value: 'emotional', label: 'Emotional/Evocative' },
  { value: 'technical', label: 'Technical/Detailed' },
  { value: 'seo-optimized', label: 'SEO Optimized' },
];

// Simple markdown renderer for basic formatting
function renderMarkdown(content: string) {
  // Process the content line by line
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  
  let inList = false;
  let listItems: string[] = [];
  
  lines.forEach((line, index) => {
    // Headers
    if (line.startsWith('**') && line.endsWith('**') && !line.includes('\n')) {
      if (inList) {
        elements.push(
          <ul key={`list-${index}`} className="list-disc list-inside mb-2 space-y-1">
            {listItems.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        );
        listItems = [];
        inList = false;
      }
      elements.push(
        <p key={index} className="font-semibold">
          {line.replace(/\*\*/g, '')}
        </p>
      );
    }
    // List items
    else if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
      inList = true;
      listItems.push(line.replace(/^[\s]*[•\-]\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1'));
    }
    // Bold text in line
    else if (line.includes('**')) {
      if (inList) {
        elements.push(
          <ul key={`list-${index}`} className="list-disc list-inside mb-2 space-y-1">
            {listItems.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        );
        listItems = [];
        inList = false;
      }
      const parts = line.split(/\*\*(.*?)\*\*/g);
      elements.push(
        <p key={index} className="mb-1">
          {parts.map((part, i) => 
            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
          )}
        </p>
      );
    }
    // Empty lines
    else if (line.trim() === '') {
      if (inList) {
        elements.push(
          <ul key={`list-${index}`} className="list-disc list-inside mb-2 space-y-1">
            {listItems.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    }
    // Regular text
    else if (line.trim()) {
      if (inList) {
        elements.push(
          <ul key={`list-${index}`} className="list-disc list-inside mb-2 space-y-1">
            {listItems.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        );
        listItems = [];
        inList = false;
      }
      elements.push(<p key={index} className="mb-1">{line}</p>);
    }
  });
  
  // Flush remaining list items
  if (inList && listItems.length > 0) {
    elements.push(
      <ul key="final-list" className="list-disc list-inside mb-2 space-y-1">
        {listItems.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    );
  }
  
  return <div className="space-y-1">{elements}</div>;
}

export default function AdminAIChat() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 **Hello, Admin!** I'm your AI assistant with full platform access.

**I can help you with:**

📊 **Analytics:** Dashboard overview, revenue, top products
📦 **Inventory:** Stock levels, restock alerts, valuations
✍️ **Writing:** Use the "Content Writer" tab to customize exactly how I generate content!
👥 **Sellers:** Account management, approvals, performance

**Try the quick actions below or switch to Content Writer for customized writing!**`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [writingConfig, setWritingConfig] = useState<WritingConfig>({
    contentType: 'product-description',
    tone: 'professional',
    length: 'medium',
    style: 'descriptive',
    customInstructions: '',
    topic: '',
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (query: string) => {
    if (!query.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          history: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.answer || 'I apologize, but I could not process your request.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to get AI response. Please try again.',
        variant: 'destructive',
      });
      
      // Add error message
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '❌ I encountered an error. Please try again or check if you have admin access.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickAction = (query: string) => {
    sendMessage(query);
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome-new',
      role: 'assistant',
      content: `Chat cleared! How can I help you?

**Quick Commands:**
• "System overview" - See platform stats
• "What needs attention?" - Pending actions
• "Help" - See all capabilities`,
      timestamp: new Date(),
    }]);
  };

  // Generate customized content
  const generateContent = async () => {
    if (!writingConfig.topic.trim()) {
      toast({
        title: 'Topic Required',
        description: 'Please enter a topic or subject for the content.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setGeneratedContent('');

    // Build the customized prompt
    const contentTypeLabel = CONTENT_TYPES.find(t => t.value === writingConfig.contentType)?.label || writingConfig.contentType;
    const toneLabel = TONES.find(t => t.value === writingConfig.tone)?.label || writingConfig.tone;
    const lengthLabel = LENGTHS.find(l => l.value === writingConfig.length)?.label || writingConfig.length;
    const styleLabel = STYLES.find(s => s.value === writingConfig.style)?.label || writingConfig.style;

    let prompt = `Generate a ${contentTypeLabel} about: ${writingConfig.topic}

**Writing Requirements:**
- Tone: ${toneLabel}
- Length: ${lengthLabel}
- Style: ${styleLabel}`;

    if (writingConfig.customInstructions.trim()) {
      prompt += `

**Additional Instructions from Admin:**
${writingConfig.customInstructions}`;
    }

    prompt += `

Please generate the content now following all the above specifications exactly.`;

    try {
      const response = await fetch('/api/admin/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: prompt,
          history: [],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      setGeneratedContent(data.answer || 'Failed to generate content.');
      
      toast({
        title: 'Content Generated!',
        description: 'Your customized content is ready. You can copy or regenerate.',
      });
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Content copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy to clipboard.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[600px]">
      {/* Tabs for Chat vs Content Writer */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat Assistant
            </TabsTrigger>
            <TabsTrigger value="writer" className="flex items-center gap-2">
              <PenTool className="h-4 w-4" />
              Content Writer
            </TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            {activeTab === 'chat' && (
              <Button variant="outline" size="sm" onClick={clearChat}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Chat
              </Button>
            )}
          </div>
        </div>

        {/* Chat Tab */}
        <TabsContent value="chat" className="flex-1 flex flex-col mt-0">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mb-4">
            {QUICK_ACTIONS.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction(action.query)}
                disabled={isLoading}
                className="text-xs hover:bg-muted"
              >
                <action.icon className={`h-3 w-3 mr-1 ${action.color}`} />
                {action.label}
              </Button>
            ))}
          </div>

          {/* Chat Messages */}
          <Card className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-primary/10'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div
                      className={`flex-1 max-w-[80%] ${
                        message.role === 'user' ? 'text-right' : ''
                      }`}
                    >
                      <div
                        className={`inline-block p-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className={`text-sm ${
                          message.role === 'user' ? '' : ''
                        }`}>
                          {renderMarkdown(message.content)}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isLoading && activeTab === 'chat' && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-primary/10">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="inline-block p-3 rounded-lg bg-muted">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Thinking...
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t p-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything about your platform..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading || !input.trim()}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                <Shield className="h-3 w-3 inline mr-1" />
                Admin-only access. All actions are logged.
              </p>
            </div>
          </Card>
        </TabsContent>

        {/* Content Writer Tab */}
        <TabsContent value="writer" className="flex-1 mt-0">
          <div className="grid gap-6 lg:grid-cols-2 h-full">
            {/* Configuration Panel */}
            <Card className="flex flex-col">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-purple-600" />
                  Content Configuration
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Customize exactly how the AI generates your content
                </p>
              </CardHeader>
              <CardContent className="flex-1 space-y-4 overflow-auto">
                {/* Content Type */}
                <div className="space-y-2">
                  <Label htmlFor="content-type">Content Type</Label>
                  <Select
                    value={writingConfig.contentType}
                    onValueChange={(value) => setWritingConfig(prev => ({ ...prev, contentType: value }))}
                  >
                    <SelectTrigger id="content-type">
                      <SelectValue placeholder="Select content type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Topic */}
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic / Subject *</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Handmade ceramic vase with floral patterns"
                    value={writingConfig.topic}
                    onChange={(e) => setWritingConfig(prev => ({ ...prev, topic: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Describe what you want to write about
                  </p>
                </div>

                {/* Tone */}
                <div className="space-y-2">
                  <Label htmlFor="tone">Tone</Label>
                  <Select
                    value={writingConfig.tone}
                    onValueChange={(value) => setWritingConfig(prev => ({ ...prev, tone: value }))}
                  >
                    <SelectTrigger id="tone">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TONES.map((tone) => (
                        <SelectItem key={tone.value} value={tone.value}>
                          {tone.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Length */}
                <div className="space-y-2">
                  <Label htmlFor="length">Length</Label>
                  <Select
                    value={writingConfig.length}
                    onValueChange={(value) => setWritingConfig(prev => ({ ...prev, length: value }))}
                  >
                    <SelectTrigger id="length">
                      <SelectValue placeholder="Select length" />
                    </SelectTrigger>
                    <SelectContent>
                      {LENGTHS.map((length) => (
                        <SelectItem key={length.value} value={length.value}>
                          {length.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Style */}
                <div className="space-y-2">
                  <Label htmlFor="style">Writing Style</Label>
                  <Select
                    value={writingConfig.style}
                    onValueChange={(value) => setWritingConfig(prev => ({ ...prev, style: value }))}
                  >
                    <SelectTrigger id="style">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      {STYLES.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Instructions */}
                <div className="space-y-2">
                  <Label htmlFor="instructions">Custom Instructions (Optional)</Label>
                  <Textarea
                    id="instructions"
                    placeholder="Add any specific requirements, keywords to include, format preferences, brand voice guidelines, etc..."
                    value={writingConfig.customInstructions}
                    onChange={(e) => setWritingConfig(prev => ({ ...prev, customInstructions: e.target.value }))}
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Be as specific as you want - the AI will follow your instructions
                  </p>
                </div>

                {/* Generate Button */}
                <Button 
                  onClick={generateContent} 
                  disabled={isLoading || !writingConfig.topic.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Output Panel */}
            <Card className="flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    Generated Content
                  </CardTitle>
                  {generatedContent && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={copyToClipboard}>
                        {copied ? (
                          <>
                            <Check className="h-4 w-4 mr-1 text-green-600" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button variant="outline" size="sm" onClick={generateContent} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                        Regenerate
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  {generatedContent ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      {renderMarkdown(generatedContent)}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                      <Wand2 className="h-12 w-12 mb-4 opacity-50" />
                      <h3 className="font-medium text-lg mb-2">No Content Yet</h3>
                      <p className="text-sm">
                        Configure your preferences on the left and click &quot;Generate Content&quot; to create customized content with AI.
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
