'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { getBackgroundServiceSuggestion } from '@/app/actions';
import type { ManageBackgroundServiceOutput } from '@/ai/flows/background-service-manager';
import { Loader, Power, PowerOff, Sparkles, Battery, ScreenShare, ScreenShareOff } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { useToast } from '@/hooks/use-toast';


export default function HostView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<ManageBackgroundServiceOutput | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [isScreenOn, setIsScreenOn] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Not Supported',
          description: 'Your browser does not support video streaming.',
        });
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
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

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);

  useEffect(() => {
    const getDeviceStatus = async () => {
      // Battery Status
      try {
        if ('getBattery' in navigator) {
            const battery = await (navigator as any).getBattery();
            setBatteryLevel(Math.floor(battery.level * 100));
            battery.addEventListener('levelchange', () => {
                setBatteryLevel(Math.floor(battery.level * 100));
            });
        }
      } catch (e) {
        console.warn('Battery status API not available.');
      }

      // Screen/Visibility Status
      const handleVisibilityChange = () => {
        setIsScreenOn(document.visibilityState === 'visible');
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    };

    getDeviceStatus();
  }, []);

  const fetchSuggestion = async () => {
    setIsLoadingSuggestion(true);
    try {
      const suggestion = await getBackgroundServiceSuggestion({
        deviceModel: 'Galaxy Fold 7', // Mock data as browsers can't access this
        osVersion: 'Android 14', // Mock data
        batteryLevel: batteryLevel,
        isScreenOn: isScreenOn,
      });
      setAiSuggestion(suggestion);
    } catch (error) {
      console.error('Failed to get AI suggestion:', error);
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden aspect-video">
        <div className="relative w-full h-full bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {hasCameraPermission === false && (
                <Alert variant="destructive" className="absolute w-auto m-4">
                    <AlertTitle>Camera Access Required</AlertTitle>
                    <AlertDescription>
                        Please allow camera access to use this feature.
                    </AlertDescription>
                </Alert>
            )}
            {hasCameraPermission === null && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4">
                    <Loader className="animate-spin mb-4" />
                    <p>Starting camera...</p>
                </div>
            )}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="text-primary w-5 h-5" />
                    Background Service Manager
                </CardTitle>
                <CardDescription>
                    AI-powered suggestions to keep the camera running efficiently.
                </CardDescription>
            </div>
            <Button onClick={fetchSuggestion} disabled={isLoadingSuggestion} size="sm">
                {isLoadingSuggestion ? <Loader className="w-4 h-4 animate-spin" /> : 'Get Suggestion'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 p-3 bg-card-foreground/5 rounded-md">
                    <Battery className="w-5 h-5 text-primary" />
                    <span>Battery: {batteryLevel}%</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-card-foreground/5 rounded-md">
                    {isScreenOn ? <ScreenShare className="w-5 h-5 text-primary"/> : <ScreenShareOff className="w-5 h-5 text-muted-foreground" />}
                    <span>Screen: {isScreenOn ? 'On' : 'Off'}</span>
                </div>
            </div>
          {aiSuggestion ? (
            <Alert variant={aiSuggestion.shouldKeepAlive ? "default" : "destructive"}>
                {aiSuggestion.shouldKeepAlive ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                <AlertTitle>AI Recommendation</AlertTitle>
                <AlertDescription>{aiSuggestion.reason}</AlertDescription>
            </Alert>
          ) : (
            <div className="text-center text-muted-foreground py-4">
                Click "Get Suggestion" for an AI-powered recommendation.
            </div>
          )}
          <div className="flex items-center justify-between pt-4 border-t">
            <Label htmlFor="background-mode" className="font-medium">
              Force Background Service
            </Label>
            <Switch id="background-mode" defaultChecked={true} aria-label="Force background service"/>
          </div>
          <p className="text-xs text-muted-foreground">
            To save power, you can manually turn off your screen. This service will attempt to continue running in the background.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
