import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CreditCard, ShieldCheck, Zap, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Declare IntaSend types
declare global {
  interface Window {
    IntaSend: any;
    intaSendInitialized?: boolean;
  }
}

interface ReportPaywallProps {
  onPaymentSuccess: () => void;
  studentName?: string;
  email?: string;
}

export interface ReportPaywallHandle {
  handlePayment: () => void;
}

const ReportPaywall = forwardRef<ReportPaywallHandle, ReportPaywallProps>(({ onPaymentSuccess, studentName, email }, ref) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [intaSendInstance, setIntaSendInstance] = useState<any>(null);

  const PAYMENT_AMOUNT = 50; // KSh 50

  useImperativeHandle(ref, () => ({
    handlePayment
  }));

  useEffect(() => {
    // Check if script is already loaded
    if (window.IntaSend) {
      setIsSdkLoaded(true);
      initializeIntaSend();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/intasend-inlinejs-sdk@4.0.7/build/intasend-inline.js';
    script.async = true;
    script.onload = () => {
      setIsSdkLoaded(true);
      initializeIntaSend();
    };
    script.onerror = () => {
      setError('Failed to load payment system. Please refresh the page.');
    };
    document.head.appendChild(script);

    return () => {
        // Cleanup if needed
    };
  }, []);

  const initializeIntaSend = () => {
    if (!window.IntaSend || window.intaSendInitialized) return;

    try {
      const apiKey = import.meta.env.VITE_INTASEND_PUBLIC_KEY || 'ISPubKey_test_123456789';
      const isLive = import.meta.env.VITE_INTASEND_LIVE === 'true';

      const intaSend = new window.IntaSend({
        publicAPIKey: apiKey,
        live: isLive,
      })
      .on("COMPLETE", (results: any) => {
        onPaymentSuccess();
      })
      .on("FAILED", (results: any) => {
        setError(results.message || 'Payment failed. Please try again.');
        setIsLoading(false);
      })
      .on("ERROR", (error: any) => {
        setError('Payment system error. Please try again.');
        setIsLoading(false);
      });

      setIntaSendInstance(intaSend);
      window.intaSendInitialized = true;
    } catch (err) {
      setError('Failed to initialize payment system.');
    }
  };

  const handlePayment = () => {
    if (!intaSendInstance) {
      setError('Payment system is not ready. Please refresh.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create a unique reference for quick assessment payment tracking
      const sanitizedName = studentName?.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) || 'GUEST';
      const recoveryRef = `QA_${sanitizedName}_${Date.now().toString().slice(-6)}`;

      intaSendInstance.run({
        amount: PAYMENT_AMOUNT,
        currency: 'KES',
        email: email || '',
        api_ref: recoveryRef,
        first_name: studentName?.split(' ')[0] || 'Student',
        last_name: studentName?.split(' ').slice(1).join(' ') || 'Report',
      });
      console.log('Payment initiated with Ref:', recoveryRef);
    } catch (err) {
      setError('Failed to open payment window.');
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-blue-600/5 border-primary/20 shadow-2xl overflow-hidden rounded-2xl">
      <CardContent className="p-4 md:p-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center shadow-sm">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          
          <div className="space-y-1">
            <h3 className="text-xl md:text-2xl font-black tracking-tight text-foreground">Unlock Full Diagnostic</h3>
            <p className="text-muted-foreground text-[11px] md:text-sm max-w-[250px] mx-auto leading-tight">
              Get your MBTI profile, RIASEC scores, and 12-month career roadmap.
            </p>
          </div>

          <div className="relative py-3 px-6 bg-background/50 rounded-xl border border-primary/10 shadow-inner">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-primary/60">KSh</span>
              <span className="text-4xl md:text-5xl font-black text-primary tracking-tighter">50</span>
            </div>
            <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[8px] font-extrabold px-1.5 py-0.5 rounded-full">ONE-TIME</div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full max-w-[300px]">
            <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-background/40 border border-primary/5 text-[10px] font-bold text-foreground/80">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> Instant
            </div>
            <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-background/40 border border-primary/5 text-[10px] font-bold text-foreground/80">
              <ShieldCheck className="w-3.5 h-3.5 text-green-500" /> Secure
            </div>
          </div>

          <Button 
            onClick={handlePayment} 
            disabled={isLoading || !isSdkLoaded}
            size="lg"
            className="w-full h-15 md:h-16 text-lg md:text-xl font-black bg-primary hover:bg-primary/95 text-white rounded-2xl shadow-[0_10px_30px_-10px_rgba(59,130,246,0.6)] active:scale-[0.98] transition-all duration-300 transform"
          >
            {isLoading ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> PROCEEDING...</>
            ) : (
              <><CreditCard className="w-5 h-5 mr-2" /> UNLOCK NOW</>
            )}
          </Button>

          {error && (
            <Alert variant="destructive" className="py-2 border-none bg-destructive/10">
              <AlertDescription className="text-[10px] font-semibold">{error}</AlertDescription>
            </Alert>
          )}

          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider opacity-60">
            M-Pesa & Cards Accepted
          </p>
        </div>
      </CardContent>
    </Card>
  );
});

ReportPaywall.displayName = 'ReportPaywall';

export default ReportPaywall;
