'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Slider } from './ui/slider';
import { Button } from './ui/button';
import { Zap, ZapOff } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';

export default function HostView() {
  const [zoom, setZoom] = useState(1);
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const wakeLock = useRef<WakeLockSentinel | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLock.current = await navigator.wakeLock.request('screen');
          console.log('Screen Wake Lock is active.');
          
          wakeLock.current.addEventListener('release', () => {
            console.log('Screen Wake Lock was released.');
          });

        } catch (err: any) {
          console.error(`${err.name}, ${err.message}`);
          toast({
            variant: 'destructive',
            title: 'Wake Lock Error',
            description: 'Could not keep the screen awake. The screen may turn off automatically.',
          });
        }
      } else {
        console.warn('Wake Lock API not supported.');
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLock.current) {
        wakeLock.current.release();
        wakeLock.current = null;
      }
    };
  }, [toast]);


  const videoPlaceholder = PlaceHolderImages.find(p => p.id === 'client-video-feed');

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden bg-black relative">
       {videoPlaceholder && (
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
      <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">LIVE</div>

      <div
        className="absolute top-4 left-4 flex items-center gap-1 p-1 rounded-lg backdrop-blur-md"
        style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }}
      >
        <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-white w-8 h-8 hover:bg-white/20"
            onClick={() => setIsFlashOn(!isFlashOn)}
        >
            {isFlashOn ? <ZapOff size={18} /> : <Zap size={18} />}
            <span className="sr-only">Toggle Flashlight</span>
        </Button>
      </div>
      
      <div
        className="absolute right-4 top-1/2 -translate-y-1/2 h-auto w-auto backdrop-blur-md rounded-lg p-2 flex flex-col items-center justify-center space-y-4 transition-opacity group"
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
                onValueChange={(value) => setOverlayOpacity(value[0])}
                className="h-full"
            />
        </div>
      </div>
    </div>
  );
}
