'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Slider } from './ui/slider';
import { Button } from './ui/button';
import { Zap, ZapOff, ZoomIn, Eye } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

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

  const createAnswer = async () => {
    if (!offer) {
        toast({variant: 'destructive', title: "No Offer", description: "Please paste the offer from the client first."});
        return;
    }

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
        if (event.candidate) {
            // ICE candidate handling
        } else {
            setAnswer(JSON.stringify(pc.localDescription));
            toast({ title: "Answer Created", description: "Copy the answer and send it back to the Client." });
        }
    };

    pc.onconnectionstatechange = () => {
        setIsConnected(pc.connectionState === 'connected');
    };

    try {
        const offerObj = JSON.parse(offer);
        await pc.setRemoteDescription(new RTCSessionDescription(offerObj));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
    } catch (error) {
        console.error("Error creating answer", error);
        toast({variant: 'destructive', title: "Invalid Offer", description: "The offer format was incorrect."});
    }
  };


  const videoPlaceholder = PlaceHolderImages.find(p => p.id === 'client-video-feed');

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black relative">
       <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" style={{ display: isConnected ? 'block' : 'none' }} />
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

      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 gap-4 bg-black/50" style={{ display: isConnected ? 'none' : 'flex' }}>
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>1. Receive Offer</CardTitle>
                </CardHeader>
                <CardContent>
                    <Label htmlFor="offer">Paste offer from Client:</Label>
                    <Textarea id="offer" value={offer} onChange={e => setOffer(e.target.value)} placeholder="Paste offer here..." rows={4} />
                    <Button onClick={createAnswer} className="w-full mt-4" disabled={!offer}>Create Answer</Button>
                </CardContent>
            </Card>
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>2. Send Answer</CardTitle>
                </CardHeader>
                <CardContent>
                    {answer && (
                        <div className="space-y-2">
                          <Label htmlFor="answer">Copy this answer to Client:</Label>
                          <Textarea id="answer" value={answer} readOnly rows={4} />
                        </div>
                    )}
                </CardContent>
            </Card>
      </div>

      <div
        className="absolute top-2 left-2 flex items-center gap-1 p-1 rounded-lg backdrop-blur-md"
        style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }}
      >
        <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-white w-8 h-8 hover:bg-white/20"
            onClick={() => setIsFlashOn(!isFlashOn)}
        >
            {isFlashOn ? <ZapOff size={18} /> : <Zap size={18} />}
        </Button>
      </div>
      
      <div
        className="absolute right-4 top-1/2 -translate-y-1/2 h-auto w-auto backdrop-blur-md rounded-lg p-2 flex flex-col items-center justify-center space-y-4"
        style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }}
      >
        <div className="h-24 w-8 flex flex-col items-center justify-center text-white">
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
            <Slider
                id="opacity"
                orientation="vertical"
                min={0.1}
                max={0.9}
                step={0.1}
                value={[overlayOpacity]}
                onValue-change={(value) => setOverlayOpacity(value[0])}
                className="h-full"
            />
        </div>
      </div>
    </div>
  );
}
