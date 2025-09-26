import HostView from "@/components/host-view";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HostPage() {
    return (
        <div className="min-h-screen bg-black text-foreground relative">
             <Button variant="ghost" size="icon" asChild className="absolute top-4 left-4 z-20 bg-black/50 hover:bg-black/75">
                <Link href="/">
                    <ArrowLeft />
                    <span className="sr-only">Back</span>
                </Link>
            </Button>
            <HostView />
        </div>
    );
}
