'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode.react';
import QrScanner from 'react-qr-scanner';
import { Slider } from './ui/slider';
import { Button } from './ui/button';
import { Zap, ZapOff, QrCode } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function HostView() {
  const [zoom, setZoom] = useState(1);
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const wakeLock = useRef<WakeLockSentinel | null>(null);
  const { toast } = useToast();

  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [offer, setOffer] = useState('');
  const [answer, setAnswer] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isScanningOffer, setIsScanningOffer] = useState(false);

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

    requestWakeLock();

    return () => {
      if (wakeLock.current) {
        wakeLock.current.release();
        wakeLock.current = null;
      }
      peerConnectionRef.current?.close();
    };
  }, []);
  
  const createAnswer = async (offerData: string) => {
    if (!offerData) return;

    setIsScanningOffer(false);
    setOffer(offerData);

    const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    peerConnectionRef.current = pc;
    
    pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
        }
    };

    pc.onicecandidate = event => {
        if (!event.candidate) {
            setAnswer(JSON.stringify(pc.localDescription));
            toast({ title: "Answer Created", description: "Show this QR code to the Client device." });
        }
    };

    pc.onconnectionstatechange = () => {
      const connected = pc.connectionState === 'connected';
      setIsConnected(connected);
      if(connected) {
        toast({ title: "Connection Established!", description: "You are connected to the client."});
      }
    };

    try {
        const offerObj = JSON.parse(offerData);
        await pc.setRemoteDescription(new RTCSessionDescription(offerObj));
        const answerDesc = await pc.createAnswer();
        await pc.setLocalDescription(answerDesc);
    } catch (error) {
        console.error("Error creating answer", error);
        toast({variant: 'destructive', title: "Invalid Offer QR", description: "The offer format was incorrect."});
    }
  };


  const videoPlaceholder = PlaceHolderImages.find(p => p.id === 'client-video-feed');

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-black relative">
       <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" style={{ transform: `scale(${zoom})`, display: isConnected ? 'block' : 'none' }} />
       {videoPlaceholder && !isConnected && (
          <Image
            src={videoPlaceholder.imageUrl}
            alt={videoPlaceholder.description}
            fill
            priority
            data-ai-hint={videoPlaceholder.imageHint}
            className="transition-transform duration-300 ease-in-out object-cover"
            style={{ transform: `scale(${zoom})` }}
          />
      )}
      
      {!isConnected && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/50 z-10">
            <Card className="w-full max-w-md bg-background/80 backdrop-blur-sm">
                <CardHeader>
                    <div className='flex justify-between items-start'>
                      <div>
                        <CardTitle>Connect to Client</CardTitle>
                        <CardDescription>Follow the steps to establish a connection.</CardDescription>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-black/50">
                          <div className={`w-3 h-3 rounded-full animate-pulse ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className="text-sm text-muted-foreground">{isConnected ? 'Connected' : 'Disconnected'}</span>
                      </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="font-semibold mb-2">1. Scan Offer from Client</h3>
                        <Button onClick={() => setIsScanningOffer(true)} className="w-full" disabled={isScanningOffer}>
                          <QrCode className="mr-2" /> Scan Offer QR
                        </Button>
                        {isScanningOffer && (
                            <Dialog open={isScanningOffer} onOpenChange={setIsScanningOffer}>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Scan Offer from Client</DialogTitle>
                                    </DialogHeader>
                                    <QrScanner
                                        delay={300}
                                        onError={(err: any) => console.error(err)}
                                        onScan={(data: any) => data && createAnswer(data.text)}
                                        style={{ width: '100%' }}
                                    />
                                    <p className="text-center text-sm text-muted-foreground">Position the client's QR code in the frame.</p>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                     <div>
                        <h3 className="font-semibold mb-2">2. Show Answer to Client</h3>
                        {answer ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="w-full">Show Answer QR Code</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>Scan with Client Device</DialogTitle>
                              </DialogHeader>
                              <div className="flex items-center justify-center p-4 bg-white rounded-lg">
                                <QRCode value={answer} size={256} />
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <Button variant="outline" className="w-full" disabled>Waiting for Offer...</Button>
                        )}
                    </div>
                </CardContent>
            </Card>
      </div>
      )}

      {isConnected && (
         <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 p-2 rounded-lg bg-black/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-background/80">
              <div className={`w-3 h-3 rounded-full animate-pulse ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} data-testid="connection-status-indicator"></div>
              <span className="text-sm text-muted-foreground">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
         </div>
      )}

      <div
        className="absolute top-1/4 left-4 flex items-center gap-1 p-2 rounded-lg backdrop-blur-md"
        style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`}}
      >
        <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-white w-10 h-10 hover:bg-white/20"
            onClick={() => setIsFlashOn(!isFlashOn)}
        >
            {isFlashOn ? <ZapOff size={24} /> : <Zap size={24} />}
        </Button>
      </div>
      
      <div
        className="absolute right-4 top-1/2 -translate-y-1/2 h-auto w-auto backdrop-blur-md rounded-lg p-2 flex flex-col items-center justify-center space-y-4"
        style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }}
      >
        <div className="h-24 w-8 flex flex-col items-center justify-center text-white">
            <span className='text-xs mb-2'>Zoom</span>
            <Slider
              id="zoom"
              orientation="vertical"
              min={1}
              max={4}
              step={0.1}
              value={[zoom]}
              onValueChange={(value) => setZoom(value[0])}
              className="h-full"
            />
        </div>
        <div className="h-24 w-8 flex flex-col items-center justify-center text-white">
            <span className='text-xs mb-2'>UI</span>
            <Slider
                id="opacity"
                orientation="vertical"
                min={0.1}
                max={0.9}
                step={0.1}
                value={[overlayOpacity]}
                onValueChange={(value) => setOverlayOpacity(value[0])}
                className="h-full"
            />
        </div>
      </div>
    </div>
  );
}
