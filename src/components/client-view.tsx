'use client';

import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode.react';
import QrScanner from 'react-qr-scanner';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QrCode } from 'lucide-react';

export default function ClientView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const wakeLock = useRef<WakeLockSentinel | null>(null);
  const { toast } = useToast();

  const [offer, setOffer] = useState('');
  const [answer, setAnswer] = useState('');
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isScanningAnswer, setIsScanningAnswer] = useState(false);


  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLock.current = await navigator.wakeLock.request('screen');
        } catch (err: any) {
          console.error(`${err.name}, ${err.message}`);
        }
      }
    };

    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        await requestWakeLock();

      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    getCameraPermission();
    
    return () => {
      if (wakeLock.current) {
        wakeLock.current.release();
        wakeLock.current = null;
      }
      peerConnectionRef.current?.close();
    };

  }, [toast]);

  const createOffer = async () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    peerConnectionRef.current = pc;

    pc.onicecandidate = event => {
      if (!event.candidate) {
        setOffer(JSON.stringify(pc.localDescription));
        toast({ title: "Offer Created", description: "Show this QR code to the Host device." });
      }
    };
    
    pc.onconnectionstatechange = () => {
      const connected = pc.connectionState === 'connected';
      setIsConnected(connected);
      if(connected) {
        toast({ title: "Connection Established!", description: "You are connected to the host."});
      }
    };

    const stream = videoRef.current?.srcObject as MediaStream;
    if (stream) {
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
    }

    const offerDesc = await pc.createOffer();
    await pc.setLocalDescription(offerDesc);
  };

  const receiveAnswer = async (answerData: string) => {
    if (peerConnectionRef.current && answerData) {
      try {
        const answerObj = JSON.parse(answerData);
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answerObj));
        setIsScanningAnswer(false);
      } catch (error) {
        console.error("Error setting remote description", error);
        toast({ variant: 'destructive', title: "Invalid Answer QR", description: "The QR code format was incorrect." });
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4">
      <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-lg bg-black relative">
        <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
        {hasCameraPermission === false && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <Alert variant="destructive" className="max-w-sm">
              <AlertTitle>Camera Access Required</AlertTitle>
              <AlertDescription>
                Please allow camera access to use this feature. You may need to grant permissions in your browser settings.
              </AlertDescription>
            </Alert>
          </div>
        )}
        {hasCameraPermission === null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
              <p className="text-muted-foreground">Requesting camera permission...</p>
          </div>
        )}
        {isConnected && <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs">CONNECTED</div>}
      </div>
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle>1. Generate Connection QR</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={createOffer} className="w-full" disabled={!hasCameraPermission || !!offer}>Generate Connection QR Code</Button>
          {offer && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">Show Offer QR Code</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Scan with Host Device</DialogTitle>
                </DialogHeader>
                <div className="flex items-center justify-center p-4 bg-white rounded-lg">
                  <QRCode value={offer} size={256} />
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>
      <Card className="w-full">
        <CardHeader>
            <CardTitle>2. Scan Answer from Host</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <Button onClick={() => setIsScanningAnswer(true)} className="w-full" disabled={!offer || isScanningAnswer}>
                <QrCode className="mr-2" /> Scan Answer QR
            </Button>
            {isScanningAnswer && (
                <Dialog open={isScanningAnswer} onOpenChange={setIsScanningAnswer}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Scan Answer from Host</DialogTitle>
                        </DialogHeader>
                        <QrScanner
                            delay={300}
                            onError={(err: any) => console.error(err)}
                            onScan={(data: any) => data && receiveAnswer(data.text)}
                            style={{ width: '100%' }}
                        />
                         <p className="text-center text-sm text-muted-foreground">Position the host's QR code in the frame.</p>
                    </DialogContent>
                </Dialog>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
