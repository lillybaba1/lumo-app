import Header from '@/components/header';
import Footer from '@/components/footer';
import { ChatInterface } from '@/components/chat-interface';

export default function AssistantPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-headline font-bold">AI Shopping Assistant</h1>
            <p className="text-muted-foreground mt-2">I'm here to help you with your shopping questions!</p>
        </div>
        <ChatInterface />
      </main>
      <Footer />
    </div>
  );
}
