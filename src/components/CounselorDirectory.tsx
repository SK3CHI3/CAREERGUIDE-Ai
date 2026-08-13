import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Video, Star, Phone, MapPin, XCircle, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// IntaSend Types
declare global {
  interface Window {
    IntaSend: any
  }
}

export const CounselorDirectory = ({ limit }: { limit?: number }) => {
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Payment States
  const [isIntaSendLoaded, setIsIntaSendLoaded] = useState(false);
  const [intaSendInstance, setIntaSendInstance] = useState<any>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  // Single hardcoded counselor
  const counselor = {
    id: 'victor-omollo',
    full_name: 'Victor Omollo',
    title: 'Career Guidance Specialist',
    bio: 'Experienced career counselor specializing in helping students navigate their educational and professional paths in Kenya.',
    hourly_rate: 100,
    image_url: null
  };

  useEffect(() => {
    loadIntaSend();
  }, []);

  const loadIntaSend = () => {
    if (window.IntaSend) {
      setIsIntaSendLoaded(true);
      return;
    }
    
    // Check if script is already being loaded
    if (document.querySelector('script[src*="intasend-inlinejs-sdk"]')) {
      const checkIntaSend = () => {
        if (window.IntaSend) {
          setIsIntaSendLoaded(true);
        } else {
          setTimeout(checkIntaSend, 100);
        }
      };
      setTimeout(checkIntaSend, 100);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/intasend-inlinejs-sdk@4.0.7/build/intasend-inline.js';
    script.async = true;
    script.onload = () => setIsIntaSendLoaded(true);
    document.head.appendChild(script);
  };

  const initiateBooking = (counselor: any) => {
    if (!window.IntaSend) {
      toast({ title: 'Error', description: 'Payment system not loaded. Please refresh.', variant: 'destructive' });
      return;
    }

    setProcessingId(counselor.id);
    
    try {
      const apiKey = import.meta.env.VITE_INTASEND_PUBLIC_KEY || 'ISPubKey_test_123456789';
      const isLive = import.meta.env.VITE_INTASEND_LIVE === 'true';
      
      const intaSend = new window.IntaSend({
        publicAPIKey: apiKey,
        live: isLive,
        redirectURL: window.location.origin + '/student'
      })
      .on("COMPLETE", async (results: any) => {
        await handlePaymentSuccess(results, counselor);
      })
      .on("FAILED", (results: any) => {
        setProcessingId(null);
        toast({ title: 'Payment Failed', description: 'Your transaction could not be processed.', variant: 'destructive' });
      })
      .on("IN-PROGRESS", () => {
        toast({ title: 'Processing', description: 'Completing your payment... Please wait.' });
      })
      .on("ERROR", () => {
        setProcessingId(null);
        toast({ title: 'Error', description: 'A system error occurred.', variant: 'destructive' });
      });
      
      intaSend.run({
        amount: counselor.hourly_rate,
        currency: 'KES',
        email: profile?.email || user?.email || '',
        phone_number: '254700000000',
        api_ref: `BOOK_${user?.id}_${counselor.id}_${Date.now()}`,
        first_name: profile?.full_name?.split(' ')[0] || 'Student'
      });
      
    } catch (err) {
      setProcessingId(null);
      toast({ title: 'System Error', description: 'Failed to open payment gateway.', variant: 'destructive' });
    }
  };

  const handlePaymentSuccess = async (results: any, counselor: any) => {
    // The secure background webhook (intasend-webhook) will create the counselor_sessions record.
    setProcessingId(null);
    toast({ title: 'Booking Confirmed!', description: `Your session with ${counselor.full_name} has been processed successfully. Please check your dashboard shortly.` });
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-3 md:gap-6">
        <Card className="group relative bg-card border-card-border shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 overflow-hidden flex flex-col rounded-2xl">
          <div className="h-24 sm:h-28 bg-gradient-to-r from-blue-600/10 to-purple-600/10 relative overflow-hidden">
            {/* Background Logo Watermark */}
            <div className="absolute top-2 right-2 opacity-[0.05] grayscale brightness-0 dark:invert group-hover:scale-110 transition-transform duration-500">
              <img src="/logos/CareerGuide_Logo.webp" alt="" className="h-20 w-auto" />
            </div>
          </div>
          <div className="px-4 sm:px-6 flex justify-between items-end -mt-10 sm:-mt-12 relative z-10">
            <div className="relative group/avatar">
              <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-card rounded-2xl shadow-xl bg-background">
                <AvatarFallback className="text-2xl sm:text-3xl font-bold bg-primary/10 text-primary">{counselor.full_name?.substring(0, 2) || 'C'}</AvatarFallback>
              </Avatar>
              {/* Brand Badge on Avatar */}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-card border-2 border-background rounded-lg flex items-center justify-center shadow-lg transform group-hover/avatar:scale-110 transition-transform duration-300">
                <img src="/logos/CareerGuide_Logo.webp" alt="Verified" className="w-6 h-auto" />
              </div>
            </div>

            <Badge variant="outline" className="mb-2 bg-background/90 backdrop-blur font-extrabold border-primary/30 text-primary shadow-sm py-1 text-[10px] sm:text-xs">
              KSh {Number(counselor.hourly_rate).toLocaleString()}/hr
            </Badge>
          </div>

          <CardContent className="pt-4 sm:pt-5 px-4 sm:px-6 flex-1 flex flex-col">
            <h3 className="text-lg sm:text-xl font-bold text-foreground leading-tight tracking-tight mb-0.5">{counselor.full_name || 'Verified Counselor'}</h3>
            <p className="text-xs sm:text-sm font-semibold text-primary/80 mb-3 sm:mb-4">{counselor.title}</p>

            <p className="text-sm text-foreground-subtle line-clamp-3 mb-6 flex-1 leading-relaxed">
              {counselor.bio}
            </p>

            <div className="space-y-2 mt-auto">
              <Button
                className="w-full"
                disabled={processingId === counselor.id || !isIntaSendLoaded}
                onClick={() => initiateBooking(counselor)}
              >
                {processingId === counselor.id ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                ) : (
                  <><Video className="w-4 h-4 mr-2" /> Book Call</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
