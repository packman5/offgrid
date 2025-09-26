'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Slider } from './ui/slider';
import { Button } from './ui/button';
import { Zap, ZapOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { WakeLockSentinel } from 'next/dist/shared/lib/hooks-client-context';
import { Switch } from './ui/switch';

export default function HostView() {
  const [zoom, setZoom] = useState(1);
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();
  const [keepScreenOn, setKeepScreenOn] = useState(false);
  let wakeLock: WakeLockSentinel | null = null;


  const videoPlaceholder = PlaceHolderImages.find(p => p.id === 'client-video-feed');

  const handleWakeLock = async (enabled: boolean) => {
    if (enabled) {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
          toast({
            title: 'Screen Lock Active',
            description: 'The screen will stay on while viewing the feed.',
          });
          wakeLock.addEventListener('release', () => {
            setKeepScreenOn(false);
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Unsupported Feature',
            description: 'Screen Wake Lock is not supported by your browser.',
          });
          setKeepScreenOn(false);
        }
      } catch (err) {
        console.error('Failed to request wake lock:', err);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not activate screen lock.',
        });
        setKeepScreenOn(false);
      }
    } else {
      if (wakeLock !== null) {
        await wakeLock.release();
        wakeLock = null;
      }
    }
  };

  useEffect(() => {
    handleWakeLock(keepScreenOn);

    return () => {
      if (wakeLock !== null) {
        wakeLock.release().then(() => {
          wakeLock = null;
        });
      }
    };
  }, [keepScreenOn, toast]);

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-lg bg-black relative">
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