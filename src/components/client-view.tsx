'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getBackgroundServiceSuggestion } from '@/app/actions';
import { ManageBackgroundServiceOutput } from '@/ai/flows/background-service-manager';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Bot, Battery, Power } from 'lucide-react';

export default function ClientView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [suggestion, setSuggestion] = useState<ManageBackgroundServiceOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const wakeLock = useRef<WakeLockSentinel | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLock.current = await navigator.wakeLock.request('screen');
          console.log('Screen Wake Lock is active.');
          toast({
            title: 'Screen Lock Active',
            description: 'The screen will stay on while using the camera.',
          });
        } catch (err: any) {
          console.error(`${err.name}, ${err.message}`);
        }
      }
    };

    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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

    // Fetch AI suggestion
    const fetchSuggestion = async () => {
      setIsLoading(true);
      const fakeDeviceData = {
        deviceModel: 'Pixel 8 Pro',
        osVersion: 'Android 14',
        batteryLevel: 78,
        isScreenOn: true,
      };
      try {
        const result = await getBackgroundServiceSuggestion(fakeDeviceData);
        setSuggestion(result);
      } catch (error) {
        console.error('Error getting AI suggestion:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestion();
    
    return () => {
      if (wakeLock.current) {
        wakeLock.current.release();
        wakeLock.current = null;
      }
    };

  }, [toast]);

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
      </div>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot /> AI Background Service Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-muted-foreground">Analyzing device state...</p>}
          {suggestion && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                {suggestion.shouldKeepAlive ? (
                   <Power className="text-green-500" />
                ) : (
                  <Power className="text-red-500" />
                )}
                <p className="font-semibold">
                  Recommendation: {suggestion.shouldKeepAlive ? "Keep Service Active" : "Stop Service"}
                </p>
              </div>
              <p className="text-sm text-muted-foreground pl-8">{suggestion.reason}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
