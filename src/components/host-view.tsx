'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Slider } from './ui/slider';
import { Button } from './ui/button';
import { Zap, ZapOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function HostView() {
  const [zoom, setZoom] = useState(1);
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();

  const videoPlaceholder = PlaceHolderImages.find(p => p.id === 'client-video-feed');

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
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
  }, [toast]);

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-lg bg-black relative">
      <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted />
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
      <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">LIVE</div>

      <div
        className="absolute top-4 left-4 flex items-center gap-2 p-1 rounded-lg backdrop-blur-md"
        style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }}
      >
        <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-white w-10 h-10 hover:bg-white/20"
            onClick={() => setIsFlashOn(!isFlashOn)}
        >
            {isFlashOn ? <ZapOff /> : <Zap />}
            <span className="sr-only">Toggle Flashlight</span>
        </Button>
      </div>
      
      <div
        className="absolute right-4 top-1/2 -translate-y-1/2 h-1/2 w-8 backdrop-blur-md rounded-lg p-1 flex flex-col items-center justify-center space-y-2 transition-opacity group"
        style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }}
      >
        <div className="h-1/2 flex flex-col items-center justify-center gap-2 text-white w-full">
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
        <div className="h-1/2 flex flex-col items-center justify-center gap-2 text-white w-full">
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
