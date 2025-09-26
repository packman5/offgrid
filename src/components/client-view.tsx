'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { ZoomIn, Sun } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';

let wakeLock: WakeLockSentinel | null = null;

export default function ClientView() {
  const [zoom, setZoom] = useState(1);
  const [keepScreenOn, setKeepScreenOn] = useState(false);
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
  }, [keepScreenOn]);

  return (
    <div className="w-full h-full flex flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-0">
      <div className="flex-grow flex items-center justify-center overflow-hidden rounded-lg bg-black relative">
        {videoPlaceholder && (
            <Image
            src={videoPlaceholder.imageUrl}
            alt={videoPlaceholder.description}
            width={1280}
            height={720}
            priority
            data-ai-hint={videoPlaceholder.imageHint}
            className="transition-transform duration-300 ease-in-out"
            style={{ transform: `scale(${zoom})` }}
            />
        )}
        <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">LIVE</div>
      </div>

      <div className="w-full md:w-80 flex-shrink-0">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Display Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <Label htmlFor="zoom" className="flex items-center gap-2">
                <ZoomIn className="w-5 h-5" />
                Digital Zoom
              </Label>
              <div className="flex items-center gap-4">
                <Slider
                  id="zoom"
                  min={1}
                  max={4}
                  step={0.1}
                  value={[zoom]}
                  onValueChange={(value) => setZoom(value[0])}
                />
                <span className="text-sm font-mono w-12 text-center">{zoom.toFixed(1)}x</span>
              </div>
            </div>

            <div className="space-y-4">
              <Label htmlFor="screen-lock" className="flex items-center gap-2">
                <Sun className="w-5 h-5" />
                Display Settings
              </Label>
              <div className="flex items-center justify-between p-3 bg-card-foreground/5 rounded-md">
                <Label htmlFor="screen-lock-switch" className="font-medium cursor-pointer">
                  Keep Screen On
                </Label>
                <Switch
                  id="screen-lock-switch"
                  checked={keepScreenOn}
                  onCheckedChange={setKeepScreenOn}
                  aria-label="Keep screen on"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
