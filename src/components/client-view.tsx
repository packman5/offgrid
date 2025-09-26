'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { ZoomIn, Sun, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { Label } from './ui/label';

let wakeLock: WakeLockSentinel | null = null;

export default function ClientView() {
  const [zoom, setZoom] = useState(1);
  const [keepScreenOn, setKeepScreenOn] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(0.7);
  const { toast } = useToast();

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
          width={1280}
          height={720}
          priority
          data-ai-hint={videoPlaceholder.imageHint}
          className="transition-transform duration-300 ease-in-out h-full w-auto object-cover"
          style={{ transform: `scale(${zoom})` }}
          />
      )}
      <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">LIVE</div>

      <div className="absolute top-2 right-2 flex items-center gap-2 p-1.5 rounded-md bg-black/50 backdrop-blur-sm">
        <Sun className="w-4 h-4 text-white" />
        <Switch
            id="screen-lock-switch"
            checked={keepScreenOn}
            onCheckedChange={setKeepScreenOn}
            aria-label="Keep screen on"
        />
      </div>

      <div
        className="absolute right-4 top-1/2 -translate-y-1/2 h-2/3 w-20 bg-black/50 backdrop-blur-md rounded-lg p-3 flex flex-col items-center justify-center space-y-4 transition-opacity group"
        style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }}
      >
        <div className="flex-grow flex flex-col items-center justify-center gap-2 text-white w-full">
            <ZoomIn className="w-5 h-5" />
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
            <span className="text-sm font-mono">{zoom.toFixed(1)}x</span>
        </div>
        <div className="flex-shrink-0 flex flex-col items-center justify-center gap-2 text-white w-full h-1/3">
            <Eye className="w-5 h-5" />
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
            <span className="text-sm font-mono">{(overlayOpacity * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}
