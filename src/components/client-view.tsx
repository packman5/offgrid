'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function ClientView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const wakeLock = useRef<WakeLockSentinel | null>(null);
  const { toast } = useToast();

  const [offer, setOffer] = useState('');
  const [answer, setAnswer] = useState('');
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);


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
      if (event.candidate) {
        // This is part of the offer, but we'll handle ICE candidates separately later
      } else {
        setOffer(JSON.stringify(pc.localDescription));
        toast({ title: "Offer Created", description: "Copy the offer and send it to the Host device." });
      }
    };
    
    pc.onconnectionstatechange = () => {
        setIsConnected(pc.connectionState === 'connected');
    };

    const stream = videoRef.current?.srcObject as MediaStream;
    if (stream) {
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
    }

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
  };

  const receiveAnswer = async () => {
    if (peerConnectionRef.current && answer) {
      try {
        const answerObj = JSON.parse(answer);
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answerObj));
        toast({ title: "Connection Established!", description: "The devices should now be connected."});
      } catch (error) {
        console.error("Error setting remote description", error);
        toast({ variant: 'destructive', title: "Invalid Answer", description: "The answer format was incorrect." });
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
          <CardTitle>1. Create Offer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={createOffer} className="w-full" disabled={!hasCameraPermission}>Generate Connection Offer</Button>
          {offer && (
            <div className="space-y-2">
              <Label htmlFor="offer">Copy this offer and send to Host:</Label>
              <Textarea id="offer" value={offer} readOnly rows={4} />
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="w-full">
        <CardHeader>
            <CardTitle>2. Receive Answer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <Label htmlFor="answer">Paste the answer from the Host here:</Label>
            <Textarea id="answer" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Paste answer here..." rows={4} />
            <Button onClick={receiveAnswer} className="w-full" disabled={!answer}>Connect</Button>
        </CardContent>
      </Card>
    </div>
  );
}
