'use client';

import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode.react';
import QrScanner from 'react-qr-scanner';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QrCode, ScanLine } from 'lucide-react';

export default function ClientView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const wakeLock = useRef<WakeLockSentinel | null>(null);
  const { toast } = useToast();

  const [offer, setOffer] = useState('');
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
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

  const sendPhoto = (photoData: string) => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
        const message = { type: 'photo', data: photoData };
        dataChannelRef.current.send(JSON.stringify(message));
    }
  };

  const handleCapture = () => {
    if (videoRef.current) {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUri = canvas.toDataURL('image/jpeg');
            sendPhoto(dataUri);
        }
    }
  };

  const handleCommand = (command: any) => {
    const stream = videoRef.current?.srcObject as MediaStream;
    if (!stream) return;

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack || !('applyConstraints' in videoTrack)) return;

    if (command.type === 'flash') {
      const capabilities = videoTrack.getCapabilities();
      if (capabilities.torch) {
        videoTrack.applyConstraints({
          advanced: [{ torch: command.value }]
        }).catch(e => {
          console.error('Error applying flashlight constraint:', e)
          toast({ variant: 'destructive', title: "Flashlight Error", description: "This device may not support controlling the flashlight." });
        });
      }
    } else if (command.type === 'zoom') {
        const capabilities = videoTrack.getCapabilities();
        if (capabilities.zoom) {
            videoTrack.applyConstraints({
                advanced: [{ zoom: command.value }]
            }).catch(e => {
                console.error('Error applying zoom constraint:', e);
            });
        }
    } else if (command.type === 'capture') {
        handleCapture();
    }
  };


  const createOffer = async () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    peerConnectionRef.current = pc;

    pc.ondatachannel = (event) => {
      const dc = event.channel;
      dataChannelRef.current = dc;
      dc.onmessage = (event) => {
        try {
          const command = JSON.parse(event.data);
          handleCommand(command);
        } catch (e) {
          console.error("Failed to parse command", e)
        }
      };
    };

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
    <div className="w-full h-screen relative bg-black">
      <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
      
      {hasCameraPermission === false && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
          <Alert variant="destructive" className="max-w-sm">
            <AlertTitle>Camera Access Required</AlertTitle>
            <AlertDescription>
              Please allow camera access to use this feature. You may need to grant permissions in your browser settings.
            </AlertDescription>
          </Alert>
        </div>
      )}
      {hasCameraPermission === null && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <p className="text-muted-foreground">Requesting camera permission...</p>
        </div>
      )}

      {hasCameraPermission && (
         <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 p-2 rounded-lg bg-black/50 backdrop-blur-sm z-10">
            {!offer && (
              <Button onClick={createOffer} size="sm" disabled={!hasCameraPermission || !!offer}>
                <QrCode className="mr-2"/> Create Offer
              </Button>
            )}
            {offer && !isConnected && (
               <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">Show Offer</Button>
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

            <Button onClick={() => setIsScanningAnswer(true)} size="sm" disabled={!offer || isScanningAnswer || isConnected}>
                <ScanLine className="mr-2" /> Scan Answer
            </Button>
            
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-background/80">
                <div className={`w-3 h-3 rounded-full animate-pulse ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} data-testid="connection-status-indicator"></div>
                <span className="text-sm text-muted-foreground">{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
         </div>
      )}
      
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

    </div>
  );
}
