'use client';

import React, { useMemo, useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Baby,
  HeartPulse,
  Package,
  Syringe,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Scale,
  Wallet,
  Calendar,
} from 'lucide-react';
import type {
  PregnancyRecord,
  DiseaseRecord,
  BirthRecord,
  FeedSection,
  VaccinationRecord,
  FinancialRecord,
  SheepProfile,
  WeightRecord,
} from '@/lib/types';

// ─── Props ────────────────────────────────────────────────────────
interface ProductionReportProps {
  pregnancies: PregnancyRecord[];
  diseases: DiseaseRecord[];
  births: BirthRecord[];
  feedSections: FeedSection[];
  vaccinations: VaccinationRecord[];
  financialRecords: FinancialRecord[];
  sheepProfiles: SheepProfile[];
  weightRecords: WeightRecord[];
}

// ─── Arabic month names ───────────────────────────────────────────
const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

// ─── Circular Progress SVG ────────────────────────────────────────
function CircularProgress({
  value,
  size = 56,
  strokeWidth = 5,
  color = '#059669',
  children,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const center = size / 2;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-emerald-100 dark:text-emerald-900"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────
function SectionHeader({
  icon: Icon,
  title,
  color = 'emerald',
}: {
  icon: React.ElementType;
  title: string;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
    rose: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400',
    sky: 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  };

  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`p-2 rounded-lg ${colorMap[color] || colorMap.emerald}`}>
        <Icon className="size-4" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <Separator className="flex-1 bg-border/50 dark:bg-border/30" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────
export default function ProductionReport({
  pregnancies,
  diseases,
  births,
  feedSections,
  vaccinations,
  financialRecords,
  sheepProfiles,
  weightRecords,
}: ProductionReportProps) {
  // Track mount state for bar animation
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  // ─── Computed Stats ────────────────────────────────────────────
  const stats = useMemo(() => {
    // Total births & gender split
    const totalBirths = births.length;
    const maleBirths = births.filter(b => b.gender === 'male').length;
    const femaleBirths = births.filter(b => b.gender === 'female').length;

    // Pregnancy success rate
    const confirmedPregnancies = pregnancies.filter(p => p.firstExamResult === 'yes').length;
    const totalPregnancies = pregnancies.length;
    const successRate = totalPregnancies > 0 ? Math.round((confirmedPregnancies / totalPregnancies) * 100) : 0;

    // Average weight
    const avgWeight = weightRecords.length > 0
      ? Math.round((weightRecords.reduce((sum, w) => sum + w.weight, 0) / weightRecords.length) * 10) / 10
      : 0;

    // Net profit
    const totalIncome = financialRecords
      .filter(f => f.type === 'income')
      .reduce((sum, f) => sum + f.amount, 0);
    const totalExpenses = financialRecords
      .filter(f => f.type === 'expense')
      .reduce((sum, f) => sum + f.amount, 0);
    const netProfit = totalIncome - totalExpenses;

    // Monthly trends — last 4 months
    const now = new Date();
    const monthlyTrends = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthIdx = d.getMonth();
      const year = d.getFullYear();
      const monthBirths = births.filter(b => {
        const bd = new Date(b.birthDate);
        return bd.getMonth() === monthIdx && bd.getFullYear() === year;
      }).length;
      const monthIncome = financialRecords.filter(f => {
        const fd = new Date(f.date);
        return fd.getMonth() === monthIdx && fd.getFullYear() === year && f.type === 'income';
      }).reduce((s, f) => s + f.amount, 0);
      const monthExpenses = financialRecords.filter(f => {
        const fd = new Date(f.date);
        return fd.getMonth() === monthIdx && fd.getFullYear() === year && f.type === 'expense';
      }).reduce((s, f) => s + f.amount, 0);
      monthlyTrends.push({
        label: ARABIC_MONTHS[monthIdx],
        births: monthBirths,
        income: monthIncome,
        expenses: monthExpenses,
      });
    }

    // Health summary
    const activeDiseases = diseases.length;
    const completedVaccinations = vaccinations.filter(v => v.status === 'completed').length;
    const followedUpDiseases = diseases.filter(d => d.followUp && d.followUp.trim() !== '').length;
    const followUpRate = diseases.length > 0
      ? Math.round((followedUpDiseases / diseases.length) * 100)
      : 0;

    // Feed efficiency
    const totalFeedSections = feedSections.length;
    const totalSheepInSections = feedSections.reduce((sum, s) => sum + s.count, 0);
    const totalFeedItems = feedSections.reduce((sum, s) => sum + s.feeds.length, 0);
    const avgFeedPerSection = totalFeedSections > 0
      ? Math.round((totalFeedItems / totalFeedSections) * 10) / 10
      : 0;

    // Quick insights
    const insights: { text: string; severity: number; color: string; bgColor: string; borderColor: string; darkBgColor: string; darkBorderColor: string }[] = [];

    if (pregnancies.length === 0) {
      insights.push({
        text: 'لم يتم تسجيل أي حمل بعد',
        severity: 3,
        color: 'text-amber-800 dark:text-amber-200',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        darkBgColor: 'dark:bg-amber-900/20',
        darkBorderColor: 'dark:border-amber-800/40',
      });
    }

    const overdueVaccinations = vaccinations.filter(v => v.status === 'overdue').length;
    if (overdueVaccinations > 0) {
      insights.push({
        text: `يوجد ${overdueVaccinations} تحصينات متأخرة`,
        severity: 4,
        color: 'text-rose-800 dark:text-rose-200',
        bgColor: 'bg-rose-50',
        borderColor: 'border-rose-200',
        darkBgColor: 'dark:bg-rose-900/20',
        darkBorderColor: 'dark:border-rose-800/40',
      });
    }

    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const birthsThisMonth = births.filter(b => {
      const bd = new Date(b.birthDate);
      return bd.getMonth() === thisMonth && bd.getFullYear() === thisYear;
    }).length;
    if (birthsThisMonth === 0) {
      insights.push({
        text: 'لا توجد مواليد هذا الشهر',
        severity: 2,
        color: 'text-sky-800 dark:text-sky-200',
        bgColor: 'bg-sky-50',
        borderColor: 'border-sky-200',
        darkBgColor: 'dark:bg-sky-900/20',
        darkBorderColor: 'dark:border-sky-800/40',
      });
    }

    if (netProfit > 0) {
      insights.push({
        text: 'الأرباح إيجابية هذا الشهر',
        severity: 1,
        color: 'text-emerald-800 dark:text-emerald-200',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        darkBgColor: 'dark:bg-emerald-900/20',
        darkBorderColor: 'dark:border-emerald-800/40',
      });
    }

    insights.sort((a, b) => b.severity - a.severity);

    // Max values for bar chart scaling
    const maxBirthsInMonth = Math.max(...monthlyTrends.map(m => m.births), 1);
    const maxFinancialInMonth = Math.max(
      ...monthlyTrends.map(m => Math.max(m.income, m.expenses)),
      1
    );

    return {
      totalBirths,
      maleBirths,
      femaleBirths,
      totalPregnancies,
      confirmedPregnancies,
      successRate,
      avgWeight,
      totalIncome,
      totalExpenses,
      netProfit,
      monthlyTrends,
      maxBirthsInMonth,
      maxFinancialInMonth,
      activeDiseases,
      completedVaccinations,
      followUpRate,
      totalFeedSections,
      totalSheepInSections,
      totalFeedItems,
      avgFeedPerSection,
      insights: insights.slice(0, 3),
    };
  }, [pregnancies, diseases, births, feedSections, vaccinations, financialRecords, sheepProfiles, weightRecords]);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('ar-SA');
  };

  return (
    <Card className="glass-card-enhanced animate-card-enter overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
            <BarChart3 className="size-4" />
          </div>
          تقرير الإنتاج
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* ─── Section 1: Production Overview ──────────────────── */}
        <div>
          <SectionHeader icon={Activity} title="نظرة عامة على الإنتاج" color="emerald" />
          <div className="grid grid-cols-2 gap-3">
            {/* Total Births */}
            <div className="stat-card-gradient-sky rounded-xl p-4 space-y-2 transition-transform duration-200 hover:scale-[1.02]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-sky-500/20">
                  <Baby className="size-4 text-sky-600 dark:text-sky-400" />
                </div>
                <span className="text-xs font-medium text-sky-700 dark:text-sky-300">إجمالي المواليد</span>
              </div>
              <div className="tabular text-2xl font-bold text-sky-800 dark:text-sky-200">
                {stats.totalBirths || '—'}
              </div>
              <div className="flex gap-2 text-xs text-sky-600 dark:text-sky-400">
                <span>♂ {stats.maleBirths}</span>
                <span>·</span>
                <span>♀ {stats.femaleBirths}</span>
              </div>
            </div>

            {/* Success Rate */}
            <div className="stat-card-gradient-emerald rounded-xl p-4 space-y-2 transition-transform duration-200 hover:scale-[1.02]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-emerald-500/20">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">نسبة النجاح</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CircularProgress
                  value={stats.totalPregnancies > 0 ? stats.successRate : 0}
                  color={stats.successRate >= 50 ? '#059669' : '#f59e0b'}
                >
                  <span className="tabular text-xs font-bold text-foreground">
                    {stats.totalPregnancies > 0 ? `${stats.successRate}%` : '—'}
                  </span>
                </CircularProgress>
              </div>
              <div className="text-[10px] text-center text-emerald-600 dark:text-emerald-400">
                {stats.confirmedPregnancies} من {stats.totalPregnancies} حمل
              </div>
            </div>

            {/* Average Weight */}
            <div className="stat-card-gradient-amber rounded-xl p-4 space-y-2 transition-transform duration-200 hover:scale-[1.02]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-amber-500/20">
                  <Scale className="size-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300">متوسط الوزن</span>
              </div>
              <div className="tabular text-2xl font-bold text-amber-800 dark:text-amber-200">
                {weightRecords.length > 0 ? stats.avgWeight : '—'}
                {weightRecords.length > 0 && <span className="text-sm font-normal mr-1">كجم</span>}
              </div>
              <div className="text-xs text-amber-600 dark:text-amber-400">
                من {weightRecords.length} قياس
              </div>
            </div>

            {/* Net Profit */}
            <div className={`rounded-xl p-4 space-y-2 transition-transform duration-200 hover:scale-[1.02] ${
              stats.netProfit >= 0 ? 'stat-card-gradient-emerald' : 'stat-card-gradient-rose'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-md ${stats.netProfit >= 0 ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                  {stats.netProfit >= 0
                    ? <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
                    : <TrendingDown className="size-4 text-rose-600 dark:text-rose-400" />
                  }
                </div>
                <span className={`text-xs font-medium ${stats.netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                  صافي الأرباح
                </span>
              </div>
              <div className={`tabular text-2xl font-bold ${stats.netProfit >= 0 ? 'text-emerald-800 dark:text-emerald-200' : 'text-rose-800 dark:text-rose-200'}`}>
                {financialRecords.length > 0 ? formatCurrency(stats.netProfit) : '—'}
              </div>
              <div className="flex items-center gap-1 text-xs">
                <Wallet className="size-3 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(stats.totalIncome)}
                </span>
                <span className="text-muted-foreground mx-1">—</span>
                <span className="text-rose-600 dark:text-rose-400">
                  {formatCurrency(stats.totalExpenses)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-border/30 dark:bg-border/15" />

        {/* ─── Section 2: Monthly Trends ───────────────────────── */}
        <div>
          <SectionHeader icon={Calendar} title="الاتجاهات الشهرية" color="sky" />
          <div className="space-y-3">
            {stats.monthlyTrends.map((month, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{month.label}</span>
                  <div className="flex gap-3 text-[10px]">
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-sky-500 dark:bg-sky-400" />
                      {month.births}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                      {formatCurrency(month.income)}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-rose-500 dark:bg-rose-400" />
                      {formatCurrency(month.expenses)}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  {/* Births bar */}
                  <div className="h-2 w-full rounded-full bg-sky-100 dark:bg-sky-900/30 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-sky-500 to-sky-400 transition-all duration-700 ease-out"
                      style={{
                        width: mounted ? `${Math.max((month.births / stats.maxBirthsInMonth) * 100, 0)}%` : '0%',
                        transitionDelay: `${idx * 100}ms`,
                      }}
                    />
                  </div>
                  {/* Income bar */}
                  <div className="h-2 w-full rounded-full bg-emerald-100 dark:bg-emerald-900/30 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-emerald-400 transition-all duration-700 ease-out"
                      style={{
                        width: mounted ? `${Math.max((month.income / stats.maxFinancialInMonth) * 100, 0)}%` : '0%',
                        transitionDelay: `${idx * 100 + 50}ms`,
                      }}
                    />
                  </div>
                  {/* Expenses bar */}
                  <div className="h-2 w-full rounded-full bg-rose-100 dark:bg-rose-900/30 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-rose-500 to-rose-400 transition-all duration-700 ease-out"
                      style={{
                        width: mounted ? `${Math.max((month.expenses / stats.maxFinancialInMonth) * 100, 0)}%` : '0%',
                        transitionDelay: `${idx * 100 + 100}ms`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {/* Legend */}
            <div className="flex justify-center gap-4 pt-1">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="inline-block w-2 h-2 rounded-full bg-sky-500 dark:bg-sky-400" />
                المواليد
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                الدخل
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="inline-block w-2 h-2 rounded-full bg-rose-500 dark:bg-rose-400" />
                المصروفات
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-border/30 dark:bg-border/15" />

        {/* ─── Section 3: Health Summary ───────────────────────── */}
        <div>
          <SectionHeader icon={HeartPulse} title="ملخص الصحة" color="rose" />
          <div className="grid grid-cols-3 gap-3">
            {/* Active Diseases */}
            <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30 p-3 space-y-2 transition-transform duration-200 hover:scale-[1.02]">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-medium text-rose-700 dark:text-rose-300">أمراض نشطة</span>
              </div>
              <div className="tabular text-xl font-bold text-rose-800 dark:text-rose-200">
                {stats.activeDiseases}
              </div>
              <Progress
                value={diseases.length > 0 ? 100 : 0}
                className="h-1 [&>div]:bg-rose-500"
              />
            </div>

            {/* Completed Vaccinations */}
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 p-3 space-y-2 transition-transform duration-200 hover:scale-[1.02]">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">تحصينات مكتملة</span>
              </div>
              <div className="tabular text-xl font-bold text-emerald-800 dark:text-emerald-200">
                {stats.completedVaccinations}
              </div>
              <Progress
                value={vaccinations.length > 0 ? (stats.completedVaccinations / vaccinations.length) * 100 : 0}
                className="h-1 [&>div]:bg-emerald-500"
              />
            </div>

            {/* Follow-up Rate */}
            <div className="rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/30 p-3 space-y-2 transition-transform duration-200 hover:scale-[1.02]">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-violet-500" />
                <span className="text-xs font-medium text-violet-700 dark:text-violet-300">نسبة المتابعة</span>
              </div>
              <div className="tabular text-xl font-bold text-violet-800 dark:text-violet-200">
                {diseases.length > 0 ? `${stats.followUpRate}%` : '—'}
              </div>
              <Progress
                value={stats.followUpRate}
                className="h-1 [&>div]:bg-violet-500"
              />
            </div>
          </div>
        </div>

        <Separator className="bg-border/30 dark:bg-border/15" />

        {/* ─── Section 4: Feed Efficiency ──────────────────────── */}
        <div>
          <SectionHeader icon={Package} title="كفاءة الأعلاف" color="amber" />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 p-3">
              <div className="p-2 rounded-lg bg-amber-500/15">
                <Package className="size-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="tabular text-lg font-bold text-amber-800 dark:text-amber-200">
                  {stats.totalFeedSections}
                </div>
                <div className="text-[10px] text-amber-600 dark:text-amber-400">أقسام</div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800/30 p-3">
              <div className="p-2 rounded-lg bg-teal-500/15">
                <Activity className="size-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <div className="tabular text-lg font-bold text-teal-800 dark:text-teal-200">
                  {stats.totalSheepInSections}
                </div>
                <div className="text-[10px] text-teal-600 dark:text-teal-400">رأس من الأغنام</div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-lime-50 dark:bg-lime-900/20 border border-lime-100 dark:border-lime-800/30 p-3">
              <div className="p-2 rounded-lg bg-lime-500/15">
                <BarChart3 className="size-4 text-lime-600 dark:text-lime-400" />
              </div>
              <div>
                <div className="tabular text-lg font-bold text-lime-800 dark:text-lime-200">
                  {stats.avgFeedPerSection}
                </div>
                <div className="text-[10px] text-lime-600 dark:text-lime-400">متوسط الأعلاف / قسم</div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30 p-3">
              <div className="p-2 rounded-lg bg-orange-500/15">
                <Shield className="size-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="tabular text-lg font-bold text-orange-800 dark:text-orange-200">
                  {stats.totalFeedItems}
                </div>
                <div className="text-[10px] text-orange-600 dark:text-orange-400">عنصر علفي معرّف</div>
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-border/30 dark:bg-border/15" />

        {/* ─── Section 5: Quick Insights ───────────────────────── */}
        <div>
          <SectionHeader icon={AlertTriangle} title="رؤى سريعة" color="amber" />
          {stats.insights.length > 0 ? (
            <div className="space-y-2">
              {stats.insights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 rounded-lg border p-3 transition-all duration-200 hover:scale-[1.01] ${insight.bgColor} ${insight.borderColor} ${insight.darkBgColor} ${insight.darkBorderColor}`}
                >
                  <AlertTriangle className={`size-4 shrink-0 ${insight.color}`} />
                  <span className={`text-sm font-medium ${insight.color}`}>
                    {insight.text}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Shield className="size-8 text-emerald-300 dark:text-emerald-700 mb-2" />
              <p className="text-sm text-muted-foreground">لا توجد رؤى في الوقت الحالي</p>
              <p className="text-xs text-muted-foreground/70 mt-1">أضف المزيد من البيانات للحصول على رؤى مفيدة</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
