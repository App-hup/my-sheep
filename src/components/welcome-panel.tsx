'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Fence,
  Baby,
  HeartPulse,
  Sprout,
  Package,
  Syringe,
  Keyboard,
  Shield,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Sparkles,
} from 'lucide-react';

interface WelcomePanelProps {
  totalRecords: number;
  onNavigateToTab: (tab: string) => void;
}

const quickStartCards = [
  {
    key: 'pregnancy',
    icon: Baby,
    emoji: '🐑',
    title: 'متابعة الحمل',
    description: 'تتبع حالات الحمل والفحوصات',
    color: 'emerald' as const,
    bg: 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-800',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/30',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  },
  {
    key: 'diseases',
    icon: HeartPulse,
    emoji: '💊',
    title: 'الأمراض',
    description: 'تسجيل الأمراض والعلاجات',
    color: 'rose' as const,
    bg: 'bg-rose-50/80 dark:bg-rose-950/20 border-rose-100 dark:border-rose-800',
    iconColor: 'text-rose-600 dark:text-rose-400',
    hoverBg: 'hover:bg-rose-50 dark:hover:bg-rose-950/30',
    badgeBg: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
  },
  {
    key: 'births',
    icon: Sprout,
    emoji: '🐣',
    title: 'المواليد',
    description: 'إدارة سجلات المواليد',
    color: 'sky' as const,
    bg: 'bg-sky-50/80 dark:bg-sky-950/20 border-sky-100 dark:border-sky-800',
    iconColor: 'text-sky-600 dark:text-sky-400',
    hoverBg: 'hover:bg-sky-50 dark:hover:bg-sky-950/30',
    badgeBg: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300',
  },
  {
    key: 'feed',
    icon: Package,
    emoji: '📦',
    title: 'الأعلاف',
    description: 'تحديد الأقسام والعليقة',
    color: 'amber' as const,
    bg: 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-100 dark:border-amber-800',
    iconColor: 'text-amber-600 dark:text-amber-400',
    hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-950/30',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  },
  {
    key: 'vaccinations',
    icon: Syringe,
    emoji: '💉',
    title: 'التحصينات',
    description: 'تتبع جدول التحصينات',
    color: 'violet' as const,
    bg: 'bg-violet-50/80 dark:bg-violet-950/20 border-violet-100 dark:border-violet-800',
    iconColor: 'text-violet-600 dark:text-violet-400',
    hoverBg: 'hover:bg-violet-50 dark:hover:bg-violet-950/30',
    badgeBg: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
  },
];

const tips = [
  {
    icon: Keyboard,
    text: 'استخدم ⌘K للبحث السريع في جميع البيانات',
  },
  {
    icon: Shield,
    text: 'جميع البيانات محفوظة محلياً في المتصفح',
  },
  {
    icon: Package,
    text: 'يمكنك تصدير البيانات كملف JSON للنسخ الاحتياطي',
  },
];

export default function WelcomePanel({ totalRecords, onNavigateToTab }: WelcomePanelProps) {
  const [tipsOpen, setTipsOpen] = useState(false);

  if (totalRecords > 0) return null;

  return (
    <div className="mb-6 animate-card-enter">
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardContent className="p-0">
          {/* ── Hero Section ──────────────────────────────────── */}
          <div className="relative bg-gradient-to-bl from-emerald-50 via-teal-50/50 to-white dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-transparent px-6 pt-8 pb-6 text-center">
            {/* Decorative glow behind icon */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-emerald-200/40 dark:bg-emerald-800/20 blur-3xl pointer-events-none" />

            {/* Animated icon */}
            <div className="relative mx-auto mb-4">
              <div className="relative inline-flex">
                <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-400 to-emerald-600 opacity-50 blur-md animate-pulse" />
                <div className="relative size-16 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/30 animate-breathe">
                  <Fence className="size-8 text-white" />
                </div>
              </div>
              {/* Sparkle decorations */}
              <Sparkles className="absolute -top-1 -right-2 size-4 text-amber-400 dark:text-amber-500 animate-float" />
              <Sparkles className="absolute -bottom-1 -left-3 size-3 text-emerald-400 dark:text-emerald-500 animate-float" style={{ animationDelay: '1s' }} />
            </div>

            {/* Welcome text */}
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              مرحباً بك في{' '}
              <span className="bg-gradient-to-l from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                الحظيرة
              </span>
              !
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
              ابدأ بإدارة حظيرتك من خلال إضافة أول سجل
            </p>

            {/* Quick start label */}
            <div className="flex items-center justify-center gap-2 mt-5 mb-4">
              <div className="h-px flex-1 max-w-[60px] bg-gradient-to-l from-emerald-300 dark:from-emerald-700 to-transparent" />
              <Badge variant="secondary" className="text-xs font-medium gap-1.5 px-3 py-1">
                <Lightbulb className="size-3.5 text-amber-500 dark:text-amber-400" />
                دليل البدء السريع
              </Badge>
              <div className="h-px flex-1 max-w-[60px] bg-gradient-to-r from-emerald-300 dark:from-emerald-700 to-transparent" />
            </div>
          </div>

          {/* ── Quick Start Cards ─────────────────────────────── */}
          <div className="px-4 sm:px-6 pb-6 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
              {quickStartCards.map((card) => (
                <button
                  key={card.key}
                  onClick={() => onNavigateToTab(card.key)}
                  className={`
                    group text-right rounded-xl border p-4
                    transition-all duration-200 cursor-pointer
                    hover-lift glass-card
                    ${card.bg} ${card.hoverBg}
                    animate-card-enter
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon with emoji background */}
                    <div className={`
                      shrink-0 size-10 rounded-lg flex items-center justify-center
                      ${card.badgeBg}
                      transition-transform duration-200 group-hover:scale-110
                    `}>
                      <card.icon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{card.emoji}</span>
                        <h3 className={`text-sm font-bold ${card.iconColor}`}>
                          {card.title}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {card.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Tips Section ──────────────────────────────────── */}
          <div className="border-t border-border/50 px-4 sm:px-6">
            <button
              onClick={() => setTipsOpen(!tipsOpen)}
              className="w-full flex items-center justify-between py-3 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="size-4 text-amber-500 dark:text-amber-400" />
                <span className="font-medium">نصائح مفيدة</span>
              </div>
              {tipsOpen ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </button>

            {tipsOpen && (
              <div className="pb-4 space-y-2.5 animate-card-enter">
                {tips.map((tip, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 px-3 py-2 rounded-lg bg-muted/30 dark:bg-muted/10"
                  >
                    <tip.icon className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {tip.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
