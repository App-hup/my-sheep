'use client';

import { useMemo } from 'react';
import type {
  PregnancyRecord,
  DiseaseRecord,
  BirthRecord,
  FeedSection,
  VaccinationRecord,
  SheepProfile,
  WeightRecord,
  FinancialRecord,
} from '@/lib/types';
import { formatShortDate } from '@/lib/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Activity,
  TrendingUp,
  BarChart3,
  PieChart,
  CalendarCheck,
  AlertTriangle,
  Users,
  GitBranch,
  CalendarDays,
  Package,
  HeartPulse,
  Grid3X3,
  Wheat,
  Syringe,
  User,
  Scale,
  Wallet,
} from 'lucide-react';

// ─── Props ─────────────────────────────────────────────────────────

interface StatisticsPanelProps {
  pregnancies: PregnancyRecord[];
  diseases: DiseaseRecord[];
  births: BirthRecord[];
  feedSections: FeedSection[];
  vaccinations: VaccinationRecord[];
  sheepProfiles: SheepProfile[];
  weightRecords?: WeightRecord[];
  financialRecords?: FinancialRecord[];
}

// ─── Main Component ────────────────────────────────────────────────

export default function StatisticsPanel({
  pregnancies,
  diseases,
  births,
  feedSections,
  vaccinations,
  sheepProfiles,
  weightRecords = [],
  financialRecords = [],
}: StatisticsPanelProps) {
  const stats = useMemo(() => computeStats(pregnancies, diseases, births, feedSections, vaccinations, sheepProfiles, weightRecords, financialRecords), [
    pregnancies,
    diseases,
    births,
    feedSections,
    vaccinations,
    sheepProfiles,
    weightRecords,
    financialRecords,
  ]);

  const earliestDate = useMemo(() => {
    const dates: string[] = [
      ...pregnancies.map((p) => p.createdAt),
      ...diseases.map((d) => d.createdAt),
      ...births.map((b) => b.createdAt),
      ...feedSections.map((f) => f.createdAt),
      ...vaccinations.map((v) => v.createdAt),
      ...sheepProfiles.map((s) => s.createdAt),
    ];
    if (dates.length === 0) return null;
    return dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
  }, [pregnancies, diseases, births, feedSections, vaccinations, sheepProfiles]);

  return (
    <section className="space-y-4">
      {/* Section Heading */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-lg font-bold text-foreground">نظرة عامة</h2>
          <Badge variant="secondary" className="text-[10px] h-5">
            إحصائيات مرئية
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {earliestDate ? (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <CalendarDays className="size-3" />
              بيانات منذ: {formatShortDate(earliestDate)}
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <CalendarDays className="size-3" />
              لا توجد بيانات بعد
            </span>
          )}
          <Separator orientation="vertical" className="h-3" />
          <span className="text-[10px] text-muted-foreground">
            آخر تحديث: {formatShortDate(new Date().toISOString().split('T')[0])}
          </span>
        </div>
      </div>

      {/* ── Quick Overview Cards ────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3 stagger-children">
        <OverviewCard
          icon={<Users className="size-4 text-emerald-600 dark:text-emerald-400" />}
          label="إجمالي الأغنام"
          value={stats.totalSheep}
          sub="رأس في جميع الأقسام"
          accent="emerald"
        />
        <OverviewCard
          icon={<GitBranch className="size-4 text-violet-600 dark:text-violet-400" />}
          label="نسبة الحمل"
          value={stats.monitoredCount > 0 ? `${stats.pregnancyRate}%` : '—'}
          sub={stats.monitoredCount > 0 ? `${stats.confirmedCount} من ${stats.monitoredCount} رقابة` : 'لا توجد بيانات رقابة'}
          accent="violet"
        />
        <OverviewCard
          icon={<CalendarCheck className="size-4 text-sky-600 dark:text-sky-400" />}
          label="مواليد الشهر"
          value={stats.totalBirths > 0 ? stats.birthsThisMonth : 0}
          sub={stats.totalBirths > 0 ? `إجمالي ${stats.totalBirths} مواليد` : 'لا توجد مواليد بعد'}
          accent="sky"
        />
        <OverviewCard
          icon={<AlertTriangle className="size-4 text-rose-600 dark:text-rose-400" />}
          label="أمراض نشطة"
          value={stats.activeDiseases}
          sub={`${stats.totalDiseases} حالة مسجلة`}
          accent="rose"
        />
        <OverviewCard
          icon={<Syringe className="size-4 text-violet-600 dark:text-violet-400" />}
          label="تحصينات متأخرة"
          value={stats.overdueVaccinations}
          sub={`${stats.totalVaccinations} سجل تحصين`}
          accent="violet"
        />
        <OverviewCard
          icon={<User className="size-4 text-teal-600 dark:text-teal-400" />}
          label="أغنام مسجلة"
          value={stats.registeredSheep}
          sub={`${stats.registeredMales} ذكور / ${stats.registeredFemales} إناث`}
          accent="teal"
        />
        <OverviewCard
          icon={<Scale className="size-4 text-lime-600 dark:text-lime-400" />}
          label="متوسط الأوزان"
          value={stats.averageWeight > 0 ? `${stats.averageWeight.toFixed(1)} كجم` : '—'}
          sub={`${weightRecords.length} سجل وزن`}
          accent="lime"
        />
        <OverviewCard
          icon={<Wallet className="size-4 text-orange-600 dark:text-orange-400" />}
          label="صافي الميزانية"
          value={`${stats.netBudget.toLocaleString('ar-SA')} ر.س`}
          sub={stats.netBudget >= 0 ? 'رصيد إيجابي' : 'رصيد سلبي'}
          accent="orange"
        />
      </div>

      {/* ── Quick Metrics Row ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Pregnancy Success Rate - Circular indicator */}
        <Card className="overflow-hidden shine-hover">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Activity className="size-4 text-emerald-600 dark:text-emerald-400" />
              نسبة نجاح الحمل
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center justify-center gap-4">
            <CircularProgress
              value={stats.monitoredCount > 0 ? stats.pregnancyRate : 0}
              label={`${stats.confirmedCount}/${stats.monitoredCount}`}
              colorClass="text-emerald-500 dark:text-emerald-400"
              trackClass="bg-emerald-100 dark:bg-emerald-900/30"
            />
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p><span className="font-semibold text-foreground tabular-nums">{stats.confirmedCount}</span> مؤكد</p>
              <p><span className="font-semibold text-foreground tabular-nums">{stats.monitoredCount}</span> تحت الرقابة</p>
              <p><span className="font-semibold text-foreground tabular-nums">{stats.pendingCount}</span> بانتظار</p>
            </div>
          </CardContent>
        </Card>

        {/* Disease Recovery Rate - Circular indicator */}
        <Card className="overflow-hidden shine-hover">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <HeartPulse className="size-4 text-rose-600 dark:text-rose-400" />
              نسبة الشفاء والمتابعة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center justify-center gap-4">
            <CircularProgress
              value={stats.treatedDiseases > 0 ? stats.recoveryRate : 0}
              label={`${stats.recoveredDiseases}/${stats.treatedDiseases}`}
              colorClass="text-rose-500 dark:text-rose-400"
              trackClass="bg-rose-100 dark:bg-rose-900/30"
            />
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p><span className="font-semibold text-foreground tabular-nums">{stats.recoveredDiseases}</span> تمت المتابعة</p>
              <p><span className="font-semibold text-foreground tabular-nums">{stats.treatedDiseases}</span> قيد العلاج</p>
              <p><span className="font-semibold text-foreground tabular-nums">{stats.totalDiseases}</span> إجمالي</p>
            </div>
          </CardContent>
        </Card>

        {/* Average Sheep Per Section */}
        <Card className="overflow-hidden shine-hover">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Grid3X3 className="size-4 text-amber-600 dark:text-amber-400" />
              متوسط الأغنام لكل قسم
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center justify-center gap-4">
            <CircularProgress
              value={stats.totalSheep > 0 ? Math.min(100, Math.round((stats.avgSheepPerSection / Math.max(1, stats.maxSectionCount)) * 100)) : 0}
              label={stats.feedSectionCount > 0 ? `${Math.round(stats.avgSheepPerSection)}` : '0'}
              colorClass="text-amber-500 dark:text-amber-400"
              trackClass="bg-amber-100 dark:bg-amber-900/30"
              displayAsNumber
            />
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p><span className="font-semibold text-foreground tabular-nums">{stats.feedSectionCount}</span> قسم</p>
              <p><span className="font-semibold text-foreground tabular-nums">{stats.totalSheep}</span> إجمالي الأغنام</p>
              <p>متوسط: <span className="font-semibold text-foreground tabular-nums">{stats.avgSheepPerSection.toFixed(1)}</span> رأس</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Visual Indicators ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Pregnancy Distribution */}
        <Card className="overflow-hidden">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Activity className="size-4 text-emerald-600 dark:text-emerald-400" />
              توزيع حالات الحمل
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <PregnancyBar stats={stats} />
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <LegendItem color="bg-emerald-500 dark:bg-emerald-400" label="مؤكد" count={stats.confirmedCount} />
              <LegendItem color="bg-amber-500 dark:bg-amber-400" label="قيد الانتظار" count={stats.pendingCount} />
              <LegendItem color="bg-gray-300 dark:bg-gray-600" label="غير مراقب" count={stats.unmonitoredCount} />
            </div>
          </CardContent>
        </Card>

        {/* Birth Gender Distribution */}
        <Card className="overflow-hidden">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <PieChart className="size-4 text-sky-600 dark:text-sky-400" />
              توزيع المواليد حسب الجنس
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <GenderDistribution
              males={stats.maleBirths}
              females={stats.femaleBirths}
              total={stats.totalBirths}
            />
            <div className="flex gap-4">
              <LegendItem color="bg-sky-500 dark:bg-sky-400" label="ذكور" count={stats.maleBirths} />
              <LegendItem color="bg-pink-400 dark:bg-pink-500" label="إناث" count={stats.femaleBirths} />
            </div>
          </CardContent>
        </Card>

        {/* Feed Sections Summary */}
        <Card className="overflow-hidden">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <TrendingUp className="size-4 text-amber-600 dark:text-amber-400" />
              أقسام الأغنام
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2.5">
            {feedSections.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">
                لم يتم إضافة أقسام بعد
              </p>
            ) : (
              feedSections.map((section) => (
                <SectionBar
                  key={section.id}
                  name={section.name}
                  count={section.count}
                  color={section.color}
                  total={stats.totalSheep}
                />
              ))
            )}
            {feedSections.length > 0 && (
              <Separator className="my-1" />
            )}
            {feedSections.length > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">الإجمالي</span>
                <span className="font-bold tabular-nums">{stats.totalSheep} رأس</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Monthly Birth Trend (6 months) ──────────────────────── */}
      <Card className="overflow-hidden">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <TrendingUp className="size-4 text-sky-600 dark:text-sky-400" />
            اتجاه المواليد الشهري (آخر 6 أشهر)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {stats.monthlyBirthTrend.length === 0 || stats.monthlyBirthTrend.every((m) => m.count === 0) ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              لا توجد بيانات مواليد للعرض
            </p>
          ) : (
            <div className="space-y-2">
              {stats.monthlyBirthTrend.map((month) => {
                const maxCount = Math.max(...stats.monthlyBirthTrend.map((m) => m.count), 1);
                const barWidth = (month.count / maxCount) * 100;
                return (
                  <div key={month.label} className="flex items-center gap-3">
                    <span className="text-[11px] text-muted-foreground w-16 shrink-0 text-left tabular-nums">
                      {month.label}
                    </span>
                    <div className="flex-1 h-6 rounded-md bg-gray-100 dark:bg-gray-800 overflow-hidden relative">
                      <div
                        className="h-full rounded-md bg-gradient-to-l from-sky-500 to-sky-400 dark:from-sky-400 dark:to-sky-500 transition-all duration-500 flex items-center justify-end px-2"
                        style={{ width: `${Math.max(barWidth, month.count > 0 ? 12 : 0)}%` }}
                      >
                        {month.count > 0 && (
                          <span className="text-[10px] font-bold text-white tabular-nums drop-shadow-sm">
                            {month.count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Feed Summary Stats ───────────────────────────────────── */}
      <Card className="overflow-hidden">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Package className="size-4 text-amber-600 dark:text-amber-400" />
            ملخص الأعلاف
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {stats.feedSectionCount === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              لا توجد بيانات أعلاف مسجلة
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/15">
                <Wheat className="size-5 text-amber-600 dark:text-amber-400" />
                <span className="text-xl font-bold tabular-nums text-amber-700 dark:text-amber-300">
                  {stats.feedSectionCount}
                </span>
                <span className="text-[10px] text-muted-foreground">قسم</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/15">
                <Package className="size-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                  {stats.totalFeedItems}
                </span>
                <span className="text-[10px] text-muted-foreground">مكون علفي</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-sky-50/60 dark:bg-sky-950/15">
                <Users className="size-5 text-sky-600 dark:text-sky-400" />
                <span className="text-xl font-bold tabular-nums text-sky-700 dark:text-sky-300">
                  {stats.totalSheep}
                </span>
                <span className="text-[10px] text-muted-foreground">رأس إجمالي</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-violet-50/60 dark:bg-violet-950/15">
                <Grid3X3 className="size-5 text-violet-600 dark:text-violet-400" />
                <span className="text-xl font-bold tabular-nums text-violet-700 dark:text-violet-300">
                  {stats.sectionsWithFeeds}
                </span>
                <span className="text-[10px] text-muted-foreground">قسم بعليقة</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

// ─── Compute Statistics ────────────────────────────────────────────

interface ComputedStats {
  totalSheep: number;
  confirmedCount: number;
  pendingCount: number;
  unmonitoredCount: number;
  monitoredCount: number;
  pregnancyRate: number;
  birthsThisMonth: number;
  totalBirths: number;
  maleBirths: number;
  femaleBirths: number;
  activeDiseases: number;
  totalDiseases: number;
  treatedDiseases: number;
  recoveredDiseases: number;
  recoveryRate: number;
  feedSectionCount: number;
  totalFeedItems: number;
  sectionsWithFeeds: number;
  avgSheepPerSection: number;
  maxSectionCount: number;
  monthlyBirthTrend: { label: string; count: number }[];
  totalVaccinations: number;
  overdueVaccinations: number;
  vaccinationCompletionRate: number;
  registeredSheep: number;
  registeredMales: number;
  registeredFemales: number;
  averageWeight: number;
  netBudget: number;
}

function computeStats(
  pregnancies: PregnancyRecord[],
  diseases: DiseaseRecord[],
  births: BirthRecord[],
  feedSections: FeedSection[],
  vaccinations: VaccinationRecord[],
  sheepProfiles: SheepProfile[],
  weightRecords: WeightRecord[],
  financialRecords: FinancialRecord[],
): ComputedStats {
  // Total sheep
  const totalSheep = feedSections.reduce((sum, s) => sum + s.count, 0);

  // Pregnancy categories
  const confirmed = pregnancies.filter(
    (r) =>
      (r.firstExamResult === 'yes' && r.expectedBirthDate) ||
      (r.firstExamResult === 'no' && r.secondExamResult === 'yes' && r.expectedBirthDate),
  );

  const pending = pregnancies.filter((r) => {
    const isConfirmed = confirmed.some((c) => c.id === r.id);
    if (isConfirmed) return false;
    if (r.status === 'unmonitored') return false;
    if (r.firstExamResult === 'yes' && !r.expectedBirthDate) return true;
    if (r.firstExamResult === 'no' && !r.secondExamResult) return true;
    if (r.firstExamResult === 'no' && r.secondExamResult === 'no') return true;
    if (r.firstExamResult === '' && r.secondExamResult === '') return true;
    return false;
  });

  const monitored = pregnancies.filter((r) => r.status === 'monitored');
  const unmonitored = pregnancies.filter((r) => r.status === 'unmonitored');

  // Pregnancy rate: confirmed out of monitored
  const pregnancyRate =
    monitored.length > 0 ? Math.round((confirmed.length / monitored.length) * 100) : 0;

  // Births this month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const birthsThisMonth = births.filter((b) => {
    const d = new Date(b.birthDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  // Birth gender
  const maleBirths = births.filter((b) => b.gender === 'male').length;
  const femaleBirths = births.filter((b) => b.gender === 'female').length;

  // Diseases
  const activeDiseases = diseases.filter(
    (r) => r.suggestedTreatment && !r.followUp,
  ).length;
  const treatedDiseases = diseases.filter((r) => r.suggestedTreatment).length;
  const recoveredDiseases = diseases.filter((r) => r.followUp).length;
  const recoveryRate =
    treatedDiseases > 0 ? Math.round((recoveredDiseases / treatedDiseases) * 100) : 0;

  // Feed stats
  const feedSectionCount = feedSections.length;
  const totalFeedItems = feedSections.reduce((sum, s) => sum + s.feeds.length, 0);
  const sectionsWithFeeds = feedSections.filter((s) => s.feeds.length > 0).length;
  const maxSectionCount = feedSections.length > 0 ? Math.max(...feedSections.map((s) => s.count), 1) : 1;
  const avgSheepPerSection = feedSectionCount > 0 ? totalSheep / feedSectionCount : 0;

  // Vaccination stats
  const totalVaccinations = vaccinations.length;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueVaccinations = vaccinations.filter((v) => {
    if (!v.nextDueDate) return false;
    const due = new Date(v.nextDueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  }).length;
  const vaccinationCompletionRate = totalVaccinations > 0
    ? Math.round(((totalVaccinations - overdueVaccinations) / totalVaccinations) * 100)
    : 0;

  // Sheep profile stats
  const registeredSheep = sheepProfiles.length;
  const registeredMales = sheepProfiles.filter((p) => p.gender === 'male').length;
  const registeredFemales = sheepProfiles.filter((p) => p.gender === 'female').length;

  // Weight stats
  const averageWeight = weightRecords.length > 0
    ? weightRecords.reduce((sum, r) => sum + r.weight, 0) / weightRecords.length
    : 0;

  // Financial stats
  const totalIncome = financialRecords.filter((r) => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
  const totalExpenses = financialRecords.filter((r) => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
  const netBudget = totalIncome - totalExpenses;

  // Monthly birth trend (last 6 months)
  const monthlyBirthTrend: { label: string; count: number }[] = [];
  const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const monthIdx = d.getMonth();
    const yearIdx = d.getFullYear();
    const count = births.filter((b) => {
      const bd = new Date(b.birthDate);
      return bd.getMonth() === monthIdx && bd.getFullYear() === yearIdx;
    }).length;
    monthlyBirthTrend.push({
      label: `${arabicMonths[monthIdx].slice(0, 5)} ${yearIdx}`,
      count,
    });
  }

  return {
    totalSheep,
    confirmedCount: confirmed.length,
    pendingCount: pending.length,
    unmonitoredCount: unmonitored.length,
    monitoredCount: monitored.length,
    pregnancyRate,
    birthsThisMonth,
    totalBirths: births.length,
    maleBirths,
    femaleBirths,
    activeDiseases,
    totalDiseases: diseases.length,
    treatedDiseases,
    recoveredDiseases,
    recoveryRate,
    feedSectionCount,
    totalFeedItems,
    sectionsWithFeeds,
    avgSheepPerSection,
    maxSectionCount,
    monthlyBirthTrend,
    totalVaccinations,
    overdueVaccinations,
    vaccinationCompletionRate,
    registeredSheep,
    registeredMales,
    registeredFemales,
    averageWeight,
    netBudget,
  };
}

// ─── Sub-components ────────────────────────────────────────────────

function OverviewCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  accent: string;
}) {
  const borderMap: Record<string, string> = {
    emerald: 'border-emerald-200 dark:border-emerald-800',
    violet: 'border-violet-200 dark:border-violet-800',
    sky: 'border-sky-200 dark:border-sky-800',
    rose: 'border-rose-200 dark:border-rose-800',
    teal: 'border-teal-200 dark:border-teal-800',
    lime: 'border-lime-200 dark:border-lime-800',
    orange: 'border-orange-200 dark:border-orange-800',
  };
  const bgMap: Record<string, string> = {
    emerald: 'bg-emerald-50/60 dark:bg-emerald-950/20',
    violet: 'bg-violet-50/60 dark:bg-violet-950/20',
    sky: 'bg-sky-50/60 dark:bg-sky-950/20',
    rose: 'bg-rose-50/60 dark:bg-rose-950/20',
    teal: 'bg-teal-50/60 dark:bg-teal-950/20',
    lime: 'bg-lime-50/60 dark:bg-lime-950/20',
    orange: 'bg-orange-50/60 dark:bg-orange-950/20',
  };

  return (
    <Card className={`${bgMap[accent]} ${borderMap[accent]} border animate-card-enter`}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 shrink-0">{icon}</div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">
              {label}
            </p>
            <p className="text-xl sm:text-2xl font-bold tabular-nums mt-0.5">{value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{sub}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CircularProgress({
  value,
  label,
  colorClass,
  trackClass,
  displayAsNumber = false,
}: {
  value: number;
  label: string;
  colorClass: string;
  trackClass: string;
  displayAsNumber?: boolean;
}) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative shrink-0">
      <svg className="size-20 -rotate-90" viewBox="0 0 80 80">
        {/* Track */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          strokeWidth="6"
          className={trackClass}
        />
        {/* Progress */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${colorClass} transition-all duration-700`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold tabular-nums">
          {displayAsNumber ? label : `${value}%`}
        </span>
        {!displayAsNumber && (
          <span className="text-[8px] text-muted-foreground">{label}</span>
        )}
      </div>
    </div>
  );
}

function PregnancyBar({ stats }: { stats: ComputedStats }) {
  const total = stats.confirmedCount + stats.pendingCount + stats.unmonitoredCount;

  if (total === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">لا توجد سجلات حمل</p>
      </div>
    );
  }

  const confirmedPct = (stats.confirmedCount / total) * 100;
  const pendingPct = (stats.pendingCount / total) * 100;
  const unmonitoredPct = (stats.unmonitoredCount / total) * 100;

  return (
    <div className="space-y-1.5">
      {/* Stacked Bar */}
      <div className="h-5 rounded-full overflow-hidden flex bg-gray-100 dark:bg-gray-800">
        {confirmedPct > 0 && (
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${confirmedPct}%` }}
            title={`مؤكد: ${stats.confirmedCount}`}
          />
        )}
        {pendingPct > 0 && (
          <div
            className="h-full bg-amber-500 transition-all duration-500"
            style={{ width: `${pendingPct}%` }}
            title={`قيد الانتظار: ${stats.pendingCount}`}
          />
        )}
        {unmonitoredPct > 0 && (
          <div
            className="h-full bg-gray-300 transition-all duration-500"
            style={{ width: `${unmonitoredPct}%` }}
            title={`غير مراقب: ${stats.unmonitoredCount}`}
          />
        )}
      </div>
      {/* Percentage labels */}
      <div className="flex items-center justify-between text-[10px] tabular-nums text-muted-foreground">
        <span>{Math.round(confirmedPct)}%</span>
        <span>{Math.round(pendingPct)}%</span>
        <span>{Math.round(unmonitoredPct)}%</span>
      </div>
    </div>
  );
}

function GenderDistribution({
  males,
  females,
  total,
}: {
  males: number;
  females: number;
  total: number;
}) {
  if (total === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">لا توجد سجلات مواليد</p>
      </div>
    );
  }

  const malePct = Math.round((males / total) * 100);
  const femalePct = 100 - malePct;

  // Build a conic-gradient string for a pie-like visual
  const gradient = `conic-gradient(#0ea5e9 0% ${malePct}%, #f472b6 ${malePct}% 100%)`;

  return (
    <div className="flex items-center gap-4">
      {/* Pie-like circle */}
      <div className="relative shrink-0">
        <div
          className="size-16 sm:size-20 rounded-full shadow-inner"
          style={{ background: gradient }}
        />
        <div className="absolute inset-2 rounded-full bg-card flex items-center justify-center">
          <span className="text-xs font-bold tabular-nums">{total}</span>
        </div>
      </div>
      {/* Stats */}
      <div className="flex-1 space-y-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-sky-500 shrink-0" />
              <span>ذكور</span>
            </div>
            <span className="font-semibold tabular-nums">{males} ({malePct}%)</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div
              className="h-full bg-sky-500 rounded-full transition-all duration-500"
              style={{ width: `${malePct}%` }}
            />
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-pink-400 shrink-0" />
              <span>إناث</span>
            </div>
            <span className="font-semibold tabular-nums">{females} ({femalePct}%)</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div
              className="h-full bg-pink-400 rounded-full transition-all duration-500"
              style={{ width: `${femalePct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionBar({
  name,
  count,
  color,
  total,
}: {
  name: string;
  count: number;
  color: string;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="size-2.5 rounded-sm shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="truncate">{name}</span>
        </div>
        <span className="font-semibold tabular-nums shrink-0 mr-2">
          {count} ({pct}%)
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function LegendItem({
  color,
  label,
  count,
}: {
  color: string;
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span className={`size-2.5 rounded-sm shrink-0 ${color}`} />
      <span>{label}</span>
      <span className="font-semibold tabular-nums text-foreground">({count})</span>
    </div>
  );
}
