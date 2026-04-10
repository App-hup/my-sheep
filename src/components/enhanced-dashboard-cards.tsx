'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Baby, HeartPulse, Sprout, Package, Syringe, User, Wallet, Scale } from 'lucide-react';
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

// ─── Types ─────────────────────────────────────────────────────────
interface EnhancedDashboardCardsProps {
  pregnancies: PregnancyRecord[];
  diseases: DiseaseRecord[];
  births: BirthRecord[];
  feedSections: FeedSection[];
  vaccinations: VaccinationRecord[];
  financialRecords: FinancialRecord[];
  sheepProfiles: SheepProfile[];
  weightRecords: WeightRecord[];
  onNavigateToTab: (tab: string) => void;
}

interface CardConfig {
  key: string;
  label: string;
  icon: React.ElementType;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  bgLight: string;
  bgDark: string;
  textLight: string;
  textDark: string;
  borderLight: string;
  borderDark: string;
  badgeBgLight: string;
  badgeBgDark: string;
  subText: string;
}

// ─── Color mapping for each tab ────────────────────────────────────
const CARD_CONFIGS: CardConfig[] = [
  {
    key: 'pregnancy',
    label: 'متابعة الحمل',
    icon: Baby,
    color: 'emerald',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-emerald-600',
    bgLight: 'bg-emerald-50',
    bgDark: 'dark:bg-emerald-950/30',
    textLight: 'text-emerald-700',
    textDark: 'dark:text-emerald-300',
    borderLight: 'border-emerald-100',
    borderDark: 'dark:border-emerald-900/40',
    badgeBgLight: 'bg-emerald-100',
    badgeBgDark: 'dark:bg-emerald-900/50',
    subText: 'سجلات الحمل',
  },
  {
    key: 'diseases',
    label: 'الأمراض',
    icon: HeartPulse,
    color: 'rose',
    gradientFrom: 'from-rose-500',
    gradientTo: 'to-rose-600',
    bgLight: 'bg-rose-50',
    bgDark: 'dark:bg-rose-950/30',
    textLight: 'text-rose-700',
    textDark: 'dark:text-rose-300',
    borderLight: 'border-rose-100',
    borderDark: 'dark:border-rose-900/40',
    badgeBgLight: 'bg-rose-100',
    badgeBgDark: 'dark:bg-rose-900/50',
    subText: 'سجلات الأمراض',
  },
  {
    key: 'births',
    label: 'المواليد',
    icon: Sprout,
    color: 'sky',
    gradientFrom: 'from-sky-500',
    gradientTo: 'to-sky-600',
    bgLight: 'bg-sky-50',
    bgDark: 'dark:bg-sky-950/30',
    textLight: 'text-sky-700',
    textDark: 'dark:text-sky-300',
    borderLight: 'border-sky-100',
    borderDark: 'dark:border-sky-900/40',
    badgeBgLight: 'bg-sky-100',
    badgeBgDark: 'dark:bg-sky-900/50',
    subText: 'سجلات المواليد',
  },
  {
    key: 'feed',
    label: 'الأعلاف',
    icon: Package,
    color: 'amber',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-amber-600',
    bgLight: 'bg-amber-50',
    bgDark: 'dark:bg-amber-950/30',
    textLight: 'text-amber-700',
    textDark: 'dark:text-amber-300',
    borderLight: 'border-amber-100',
    borderDark: 'dark:border-amber-900/40',
    badgeBgLight: 'bg-amber-100',
    badgeBgDark: 'dark:bg-amber-900/50',
    subText: 'أقسام الأعلاف',
  },
  {
    key: 'vaccinations',
    label: 'التحصينات',
    icon: Syringe,
    color: 'violet',
    gradientFrom: 'from-violet-500',
    gradientTo: 'to-violet-600',
    bgLight: 'bg-violet-50',
    bgDark: 'dark:bg-violet-950/30',
    textLight: 'text-violet-700',
    textDark: 'dark:text-violet-300',
    borderLight: 'border-violet-100',
    borderDark: 'dark:border-violet-900/40',
    badgeBgLight: 'bg-violet-100',
    badgeBgDark: 'dark:bg-violet-900/50',
    subText: 'سجلات التحصينات',
  },
  {
    key: 'profiles',
    label: 'سجل الأغنام',
    icon: User,
    color: 'teal',
    gradientFrom: 'from-teal-500',
    gradientTo: 'to-teal-600',
    bgLight: 'bg-teal-50',
    bgDark: 'dark:bg-teal-950/30',
    textLight: 'text-teal-700',
    textDark: 'dark:text-teal-300',
    borderLight: 'border-teal-100',
    borderDark: 'dark:border-teal-900/40',
    badgeBgLight: 'bg-teal-100',
    badgeBgDark: 'dark:bg-teal-900/50',
    subText: 'ملفات الأغنام',
  },
  {
    key: 'financial',
    label: 'المالية',
    icon: Wallet,
    color: 'orange',
    gradientFrom: 'from-orange-500',
    gradientTo: 'to-orange-600',
    bgLight: 'bg-orange-50',
    bgDark: 'dark:bg-orange-950/30',
    textLight: 'text-orange-700',
    textDark: 'dark:text-orange-300',
    borderLight: 'border-orange-100',
    borderDark: 'dark:border-orange-900/40',
    badgeBgLight: 'bg-orange-100',
    badgeBgDark: 'dark:bg-orange-900/50',
    subText: 'السجلات المالية',
  },
  {
    key: 'weight',
    label: 'الأوزان',
    icon: Scale,
    color: 'lime',
    gradientFrom: 'from-lime-500',
    gradientTo: 'to-lime-600',
    bgLight: 'bg-lime-50',
    bgDark: 'dark:bg-lime-950/30',
    textLight: 'text-lime-700',
    textDark: 'dark:text-lime-300',
    borderLight: 'border-lime-100',
    borderDark: 'dark:border-lime-900/40',
    badgeBgLight: 'bg-lime-100',
    badgeBgDark: 'dark:bg-lime-900/50',
    subText: 'قياسات الوزن',
  },
];

// ─── Helper: Get sparkline data from records with dates ────────────
function getSparklineData(dates: string[]): number[] {
  if (dates.length === 0) return [0, 0, 0, 0, 0, 0, 0];

  const now = new Date();
  const buckets = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return { start: d.getTime(), count: 0 };
  });

  for (const dateStr of dates) {
    if (!dateStr) continue;
    const ts = new Date(dateStr).getTime();
    for (const bucket of buckets) {
      const nextDay = new Date(bucket.start);
      nextDay.setDate(nextDay.getDate() + 1);
      if (ts >= bucket.start && ts < nextDay.getTime()) {
        bucket.count++;
        break;
      }
    }
  }

  const counts = buckets.map(b => b.count);
  const maxVal = Math.max(...counts, 1);

  // Normalize to percentages (min 5% to show something)
  return counts.map(c => Math.max((c / maxVal) * 100, c > 0 ? 8 : 0));
}

// ─── Sparkline Component ───────────────────────────────────────────
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(t);
  }, []);

  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-400 dark:bg-emerald-500',
    rose: 'bg-rose-400 dark:bg-rose-500',
    sky: 'bg-sky-400 dark:bg-sky-500',
    amber: 'bg-amber-400 dark:bg-amber-500',
    violet: 'bg-violet-400 dark:bg-violet-500',
    teal: 'bg-teal-400 dark:bg-teal-500',
    orange: 'bg-orange-400 dark:bg-orange-500',
    lime: 'bg-lime-500 dark:bg-lime-500',
  };

  const barColor = colorMap[color] || colorMap.emerald;

  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-end gap-[3px] opacity-15 dark:opacity-10">
      {data.map((height, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{
            height: mounted ? `${Math.max(height, 4)}%` : '4%',
            maxHeight: '28px',
            transitionDelay: `${i * 40}ms`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Single Dashboard Card ─────────────────────────────────────────
function DashboardCardItem({
  config,
  value,
  sparkData,
  onClick,
}: {
  config: CardConfig;
  value: number;
  sparkData: number[];
  onClick: () => void;
}) {
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`glass-card-enhanced hover-lift-enhanced animate-card-enter
        relative overflow-hidden rounded-xl border p-4 text-right
        transition-all duration-200 cursor-pointer
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2
        ${config.bgLight} ${config.bgDark} ${config.borderLight} ${config.borderDark}
        hover:shadow-lg group`}
      aria-label={`انتقل إلى ${config.label}`}
    >
      {/* Icon with gradient background circle */}
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo}
          shadow-md group-hover:shadow-lg transition-shadow duration-200`}>
          <Icon className="size-5 text-white" />
        </div>
      </div>

      {/* Label */}
      <div className={`text-xs font-semibold mb-1 ${config.textLight} ${config.textDark}`}>
        {config.label}
      </div>

      {/* Value */}
      <div className="tabular text-2xl font-bold text-foreground leading-tight">
        {value}
      </div>

      {/* Sub text */}
      <div className="text-[11px] text-muted-foreground mt-1">
        {config.subText}
      </div>

      {/* Mini sparkline */}
      <MiniSparkline data={sparkData} color={config.color} />
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────────
export default function EnhancedDashboardCards({
  pregnancies,
  diseases,
  births,
  feedSections,
  vaccinations,
  financialRecords,
  sheepProfiles,
  weightRecords,
  onNavigateToTab,
}: EnhancedDashboardCardsProps) {
  const sparkData = useMemo(() => {
    return {
      pregnancy: getSparklineData(pregnancies.map(p => p.createdAt).filter(Boolean)),
      diseases: getSparklineData(diseases.map(d => d.createdAt).filter(Boolean)),
      births: getSparklineData(births.map(b => b.birthDate).filter(Boolean)),
      feed: getSparklineData(feedSections.map(s => s.createdAt).filter(Boolean)),
      vaccinations: getSparklineData(vaccinations.map(v => v.vaccinationDate).filter(Boolean)),
      profiles: getSparklineData(sheepProfiles.map(s => s.createdAt).filter(Boolean)),
      financial: getSparklineData(financialRecords.map(f => f.date).filter(Boolean)),
      weight: getSparklineData(weightRecords.map(w => w.date).filter(Boolean)),
    };
  }, [pregnancies, diseases, births, feedSections, vaccinations, financialRecords, sheepProfiles, weightRecords]);

  const values = useMemo(() => ({
    pregnancy: pregnancies.length,
    diseases: diseases.length,
    births: births.length,
    feed: feedSections.length,
    vaccinations: vaccinations.length,
    profiles: sheepProfiles.length,
    financial: financialRecords.length,
    weight: weightRecords.length,
  }), [pregnancies, diseases, births, feedSections, vaccinations, financialRecords, sheepProfiles, weightRecords]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger-children">
      {CARD_CONFIGS.map(config => (
        <DashboardCardItem
          key={config.key}
          config={config}
          value={values[config.key as keyof typeof values]}
          sparkData={sparkData[config.key as keyof typeof sparkData]}
          onClick={() => onNavigateToTab(config.key)}
        />
      ))}
    </div>
  );
}
