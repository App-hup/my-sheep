'use client';

import { Fence, Heart, Shield, Package, Baby, HeartPulse, Sprout, Syringe, User, Wallet, Scale } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface EnhancedFooterProps {
  onNavigateToTab: (tab: string) => void;
  totalPregnancies: number;
  totalBirths: number;
  totalDiseases: number;
  totalVaccinations: number;
}

const QUICK_LINKS = [
  { label: 'متابعة الحمل', tab: 'pregnancy', icon: Baby, color: 'emerald' as const },
  { label: 'الأمراض', tab: 'diseases', icon: HeartPulse, color: 'rose' as const },
  { label: 'المواليد', tab: 'births', icon: Sprout, color: 'sky' as const },
  { label: 'الأعلاف', tab: 'feed', icon: Package, color: 'amber' as const },
  { label: 'التحصينات', tab: 'vaccinations', icon: Syringe, color: 'violet' as const },
  { label: 'سجل الأغنام', tab: 'profiles', icon: User, color: 'teal' as const },
  { label: 'المالية', tab: 'financial', icon: Wallet, color: 'orange' as const },
  { label: 'الأوزان', tab: 'weight', icon: Scale, color: 'lime' as const },
] as const;

const LINK_COLOR_MAP: Record<string, { bg: string; icon: string; hover: string }> = {
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', icon: 'text-emerald-600 dark:text-emerald-400', hover: 'hover:bg-emerald-100 dark:hover:bg-emerald-950/40' },
  rose: { bg: 'bg-rose-50 dark:bg-rose-950/20', icon: 'text-rose-600 dark:text-rose-400', hover: 'hover:bg-rose-100 dark:hover:bg-rose-950/40' },
  sky: { bg: 'bg-sky-50 dark:bg-sky-950/20', icon: 'text-sky-600 dark:text-sky-400', hover: 'hover:bg-sky-100 dark:hover:bg-sky-950/40' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-950/20', icon: 'text-amber-600 dark:text-amber-400', hover: 'hover:bg-amber-100 dark:hover:bg-amber-950/40' },
  violet: { bg: 'bg-violet-50 dark:bg-violet-950/20', icon: 'text-violet-600 dark:text-violet-400', hover: 'hover:bg-violet-100 dark:hover:bg-violet-950/40' },
  teal: { bg: 'bg-teal-50 dark:bg-teal-950/20', icon: 'text-teal-600 dark:text-teal-400', hover: 'hover:bg-teal-100 dark:hover:bg-teal-950/40' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-950/20', icon: 'text-orange-600 dark:text-orange-400', hover: 'hover:bg-orange-100 dark:hover:bg-orange-950/40' },
  lime: { bg: 'bg-lime-50 dark:bg-lime-950/20', icon: 'text-lime-600 dark:text-lime-400', hover: 'hover:bg-lime-100 dark:hover:bg-lime-950/40' },
};

export default function EnhancedFooter({
  onNavigateToTab,
  totalPregnancies,
  totalBirths,
  totalDiseases,
  totalVaccinations,
}: EnhancedFooterProps) {
  const stats = [
    { label: 'سجلات الحمل', value: totalPregnancies, color: 'emerald' as const },
    { label: 'المواليد', value: totalBirths, color: 'sky' as const },
    { label: 'الأمراض', value: totalDiseases, color: 'rose' as const },
    { label: 'التحصينات', value: totalVaccinations, color: 'violet' as const },
  ];

  return (
    <footer className="mt-auto">
      {/* Decorative Top Accent Bar */}
      <div className="h-0.5 bg-gradient-to-l from-emerald-500 via-teal-400 to-emerald-600" />

      {/* Feature Highlights Section */}
      <div className="border-b border-border/50 bg-muted/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="size-9 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200/60 dark:from-emerald-900/40 dark:to-emerald-800/30 flex items-center justify-center transition-transform duration-200 hover:scale-110">
                <Shield className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground text-shadow-sm">إدارة شاملة</p>
                <p className="text-[11px] text-muted-foreground">إدارة كاملة لجميع جوانب القطيع — الحمل، الأمراض، المواليد، والأعلاف</p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <div className="size-9 rounded-lg bg-gradient-to-br from-sky-100 to-sky-200/60 dark:from-sky-900/40 dark:to-sky-800/30 flex items-center justify-center transition-transform duration-200 hover:scale-110">
                <Heart className="size-4 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground text-shadow-sm">بيانات آمنة</p>
                <p className="text-[11px] text-muted-foreground">جميع البيانات محفوظة محلياً على جهازك — لا تحتاج إنترنت</p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center sm:justify-end">
              <div className="size-9 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200/60 dark:from-amber-900/40 dark:to-amber-800/30 flex items-center justify-center transition-transform duration-200 hover:scale-110">
                <Package className="size-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground text-shadow-sm">سهل الاستخدام</p>
                <p className="text-[11px] text-muted-foreground">واجهة بسيطة وسهلة التنقل مع دعم كامل للعربية</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="glass-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* ── Brand Section ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-lg bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700 opacity-40 blur-[2px] animate-pulse" />
                  <div className="relative size-10 rounded-lg bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700 flex items-center justify-center shadow-md">
                    <Fence className="size-5 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-bold bg-gradient-to-l from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
                    الحظيرة
                  </h2>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                نظام ذكي لإدارة حظيرة الأغنام
              </p>
              <p className="text-xs text-muted-foreground/70 leading-relaxed">
                تسهّل الحظيرة عليك متابعة صحة القطيع وإدارة السجلات اليومية بكفاءة عالية. نظام متكامل يحفظ بياناتك محلياً بأمان تام.
              </p>
            </div>

            {/* ── Quick Links Section ── */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-emerald-500" />
                الروابط السريعة
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                {QUICK_LINKS.map((link) => {
                  const colors = LINK_COLOR_MAP[link.color] || LINK_COLOR_MAP.emerald;
                  const Icon = link.icon;
                  return (
                    <Button
                      key={link.tab}
                      variant="ghost"
                      size="sm"
                      onClick={() => onNavigateToTab(link.tab)}
                      className={`justify-start gap-2 text-xs font-normal h-8 px-2 ${colors.hover} text-muted-foreground hover:text-foreground transition-colors`}
                    >
                      <Icon className={`size-3.5 ${colors.icon}`} />
                      {link.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* ── Stats Summary Section ── */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-emerald-500" />
                ملخص الإحصائيات
              </h3>
              <div className="space-y-2">
                {stats.map((stat) => {
                  const colors = LINK_COLOR_MAP[stat.color] || LINK_COLOR_MAP.emerald;
                  return (
                    <div
                      key={stat.label}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 ${colors.bg} border-border/50`}
                    >
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                      <span className={`text-sm font-bold tabular-nums ${colors.icon}`}>
                        {stat.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── About Section ── */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-emerald-500" />
                حول النظام
              </h3>
              <Card className="glass-card border-border/50">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20">
                      الإصدار 2.0
                    </Badge>
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                      PWA جاهز
                    </Badge>
                  </div>
                  <ul className="space-y-1.5">
                    {['تتبع الحمل والولادة', 'سجل الأمراض والعلاج', 'إدارة الأعلاف', 'نظام التحصينات'].map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="size-1 rounded-full bg-emerald-400 dark:bg-emerald-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <Separator className="opacity-50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 safe-bottom">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="size-5 rounded-md bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm">
                <Fence className="size-3 text-white" />
              </div>
              <span className="font-medium text-foreground/80">© 2025 الحظيرة — جميع الحقوق محفوظة</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20">
                الإصدار 2.0
              </Badge>
              <Separator orientation="vertical" className="h-3" />
              <span className="text-muted-foreground/70">صُنع بـ ❤️</span>
              <Separator orientation="vertical" className="h-3" />
              <span className="footer-link cursor-default">جميع البيانات محفوظة محلياً</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
