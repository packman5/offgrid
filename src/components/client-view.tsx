'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ClientView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();

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
  );
}
