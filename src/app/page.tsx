import Link from "next/link";
import { Camera, Monitor, WifiOff, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function RoleSelectorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <header className="text-center mb-8 sm:mb-12">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground">
          OffGrid Camera
        </h1>
        <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
          Choose your role to begin. One device acts as the camera (Host), and the other as the screen (Client).
        </p>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 w-full max-w-4xl mb-8">
        <Card className="hover:border-primary transition-colors duration-300">
          <Link href="/host" className="block h-full">
            <CardHeader className="flex-row items-center gap-4">
              <Camera className="w-10 h-10 text-primary" />
              <div>
                <CardTitle className="text-2xl font-semibold">Host</CardTitle>
                <CardDescription>This device will be the camera.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Use this device to capture video. The screen can be turned off to save power while streaming.
              </p>
              <Button className="w-full" variant="outline">
                Start as Host
              </Button>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:border-primary transition-colors duration-300">
          <Link href="/client" className="block h-full">
            <CardHeader className="flex-row items-center gap-4">
              <Monitor className="w-10 h-10 text-primary" />
              <div>
                <CardTitle className="text-2xl font-semibold">Client</CardTitle>
                <CardDescription>This device will be the display.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                View the video stream from the Host device. Control zoom and other settings from here.
              </p>
              <Button className="w-full">
                Start as Client
              </Button>
            </CardContent>
          </Link>
        </Card>
      </main>

      <footer className="w-full max-w-4xl">
        <Alert>
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Offline Operation</AlertTitle>
          <AlertDescription>
            This app is designed for offline use via peer-to-peer Wi-Fi or Bluetooth. For best results, please disable cellular data and disconnect from any external Wi-Fi networks before starting.
          </AlertDescription>
        </Alert>
      </footer>
    </div>
  );
}
