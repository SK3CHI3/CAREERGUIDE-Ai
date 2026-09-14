import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquarePlus, Send, X, Bug, Lightbulb, HelpCircle, MessageCircle, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const FeedbackWidget = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [category, setCategory] = useState<'Bug' | 'Feature' | 'Support' | 'General'>('General');
    const [content, setContent] = useState('');
    const [email, setEmail] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setLoading(true);
        try {
            const { error } = await supabase.from('feedbacks').insert({
                user_id: user?.id || null,
                user_email: email || user?.email || null,
                category,
                content,
                status: 'new'
            });

            if (error) throw error;

            setSubmitted(true);
            setTimeout(() => {
                setIsOpen(false);
                setSubmitted(false);
                setContent('');
                setEmail('');
                setCategory('General');
            }, 3000);
        } catch (error: any) {
            toast({
                title: "Error sending feedback",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const categories = [
        { id: 'General', icon: MessageCircle, label: 'General', color: 'text-sky-400' },
        { id: 'Bug', icon: Bug, label: 'Bug Report', color: 'text-destructive' },
        { id: 'Feature', icon: Lightbulb, label: 'Idea', color: 'text-amber-400' },
        { id: 'Support', icon: HelpCircle, label: 'Support', color: 'text-primary' },
    ];

    return (
        <div className="hidden md:flex fixed top-0 right-0 bottom-0 z-[100] items-center pointer-events-none">
            {/* The Tab Trigger */}
            {!isOpen && (
                <motion.button
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    whileHover={{ x: -5 }}
                    onClick={() => setIsOpen(true)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-auto bg-primary text-white py-4 px-2 rounded-l-xl shadow-elevated flex flex-col items-center gap-2 group transition-all"
                >
                    <MessageSquarePlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="[writing-mode:vertical-lr] font-bold text-xs uppercase tracking-widest py-2">Feedback</span>
                </motion.button>
            )}

            <AnimatePresence>
                {isOpen && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 p-6 pointer-events-auto">
                        <motion.div
                            initial={{ opacity: 0, x: 100, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 100, scale: 0.95 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="w-80 md:w-96"
                        >
                            <Card className="bg-gradient-surface border-card-border shadow-elevated overflow-hidden backdrop-blur-xl bg-background/95">
                                <CardHeader className="p-4 border-b border-card-border bg-muted/30">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <MessageSquarePlus className="w-4 h-4 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-sm">Share Feedback</CardTitle>
                                                <CardDescription className="text-[10px]">Help us improve CareerGuide</CardDescription>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                    {submitted ? (
                                        <div className="py-12 text-center space-y-4">
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto"
                                            >
                                                <CheckCircle2 className="w-8 h-8 text-green-500" />
                                            </motion.div>
                                            <div className="space-y-1">
                                                <p className="font-bold text-foreground">Thank You!</p>
                                                <p className="text-sm text-foreground-muted">Your feedback has been received.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            <div className="grid grid-cols-4 gap-2">
                                                {categories.map((cat) => {
                                                    const Icon = cat.icon;
                                                    const isSelected = category === cat.id;
                                                    return (
                                                        <button
                                                            key={cat.id}
                                                            type="button"
                                                            onClick={() => setCategory(cat.id as any)}
                                                            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${isSelected
                                                                    ? 'border-primary bg-primary/5 shadow-sm scale-105'
                                                                    : 'border-card-border hover:bg-muted/50 grayscale opacity-70 hover:opacity-100 hover:grayscale-0'
                                                                }`}
                                                        >
                                                            <Icon className={`w-4 h-4 ${isSelected ? cat.color : 'text-foreground-muted'}`} />
                                                            <span className={`text-[9px] font-black uppercase tracking-tighter ${isSelected ? 'text-foreground' : 'text-foreground-muted'}`}>
                                                                {cat.label}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {!user && (
                                                <Input
                                                    placeholder="Your email (optional)"
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="bg-muted/20 border-card-border h-9 text-sm"
                                                />
                                            )}

                                            <Textarea
                                                placeholder="Enter your feedback here..."
                                                value={content}
                                                onChange={(e) => setContent(e.target.value)}
                                                className="min-h-[120px] bg-muted/20 border-card-border resize-none text-sm focus-visible:ring-primary/30"
                                                required
                                            />

                                            <Button
                                                type="submit"
                                                disabled={loading || !content.trim()}
                                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-10 shadow-glow transition-all active:scale-95"
                                            >
                                                {loading ? (
                                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                ) : (
                                                    <>
                                                        <Send className="w-4 h-4 mr-2" /> Send Feedback
                                                    </>
                                                )}
                                            </Button>
                                        </form>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FeedbackWidget;
