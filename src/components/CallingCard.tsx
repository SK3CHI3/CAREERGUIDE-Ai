import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Check, ArrowRight, ShieldCheck, BarChart3, Users } from "lucide-react";
import { motion } from "framer-motion";

const CallingCard = () => {
    const features = [
        "Personalized AI Career Roster",
        "Institutional Analytics Dashboard",
        "Mentor-Student Guidance System",
        "Priority Support & Strategy",
        "Customizable CBE Pathways"
    ];

    return (
        <section className="py-24 relative overflow-hidden bg-surface">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="bg-gradient-surface border border-card-border rounded-[32px] overflow-hidden shadow-elevated">
                    <div className="grid lg:grid-cols-2">
                        {/* Content Section */}
                        <div className="p-8 md:p-12 lg:p-16 space-y-8">
                            <div className="space-y-4">
                                <h2 className="text-4xl md:text-5xl font-black text-foreground leading-[1.1]">
                                    Empower Your School with <span className="bg-gradient-text bg-clip-text text-transparent">AI Intelligence</span>
                                </h2>
                                <p className="text-lg text-foreground-muted leading-relaxed max-w-xl">
                                    Join the leading institutions across Kenya using AI to guide students toward their perfect career paths with 98% accuracy.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <p className="font-bold text-foreground">Why schools choose us:</p>
                                <ul className="grid sm:grid-cols-2 gap-4">
                                    {features.map((feature, idx) => (
                                        <li key={idx} className="flex items-center gap-3 text-sm text-foreground-muted font-medium">
                                            <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                                <Check className="w-3 h-3 text-green-500" />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="pt-4 flex flex-col sm:flex-row gap-4">
                                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-10 py-7 text-lg font-black shadow-glow group transition-all">
                                    Onboard My School
                                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                                <Button variant="outline" className="rounded-full px-10 py-7 text-lg font-bold border-card-border hover:bg-muted/50">
                                    Request Demo
                                </Button>
                            </div>
                        </div>

                        {/* Pricing/Badge Section */}
                        <div className="relative bg-primary/5 lg:border-l border-card-border p-8 md:p-12 lg:p-16 flex flex-col items-center justify-center text-center">
                            <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
                                    <ShieldCheck className="w-full h-full text-primary" />
                                </div>
                            </div>

                            <div className="relative space-y-6 max-w-xs">
                                <div className="inline-block px-4 py-1 bg-white dark:bg-card border border-card-border rounded-full text-xs font-black tracking-widest uppercase mb-4 shadow-sm">
                                    Transparent Pricing
                                </div>
                                <div className="space-y-1">
                                    <div className="text-sm font-bold text-foreground-muted">Starting from only</div>
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-6xl md:text-7xl font-black bg-gradient-text bg-clip-text text-transparent">100</span>
                                        <span className="text-xl font-bold text-foreground">KES</span>
                                    </div>
                                    <div className="text-base font-bold text-foreground-muted">per student / term</div>
                                    <p className="text-[10px] text-primary/60 font-bold uppercase tracking-wider mt-2">Institutional Access Model</p>
                                </div>
                                
                                <div className="pt-8 grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-white dark:bg-card border border-card-border shadow-sm">
                                        <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                                        <div className="text-xs font-black text-foreground">Unlimited</div>
                                        <div className="text-[10px] text-foreground-muted uppercase tracking-tighter">Students</div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white dark:bg-card border border-card-border shadow-sm">
                                        <BarChart3 className="w-6 h-6 text-secondary mx-auto mb-2" />
                                        <div className="text-xs font-black text-foreground">Full</div>
                                        <div className="text-[10px] text-foreground-muted uppercase tracking-tighter">Analytics</div>
                                    </div>
                                </div>

                                <p className="text-[11px] text-foreground-muted leading-tight pt-4">
                                    *Minimum enrollment requirements apply. Prices are billed per academic term. No hidden setup fees.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CallingCard;
