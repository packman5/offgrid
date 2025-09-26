import ClientView from '@/components/client-view';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ClientPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
       <header className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">Client (Camera)</h1>
        <div className="w-8"></div>
      </header>
      <main className="flex-grow p-4 md:p-6 lg:p-8 flex items-center justify-center">
        <div className="w-full max-w-2xl">
            <ClientView />
        </div>
      </main>
    </div>
  );
}
