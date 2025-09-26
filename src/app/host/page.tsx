import HostView from "@/components/host-view";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HostPage() {
    return (
        <div className="min-h-screen bg-black text-foreground flex flex-col">
            <header className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-sm z-20">
                <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                    <ArrowLeft />
                    <span className="sr-only">Back</span>
                </Link>
                </Button>
                <h1 className="text-xl font-semibold">Host (Display)</h1>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" data-testid="connection-status-indicator"></div>
                    <span className="text-sm text-muted-foreground">Disconnected</span>
                </div>
            </header>
            <main className="flex-grow flex items-center justify-center p-0 h-[calc(100vh-65px)]">
                <HostView />
            </main>
        </div>
    );
}
