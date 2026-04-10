'use client';

import { useMemo } from 'react';
import type { PregnancyRecord, DiseaseRecord, VaccinationRecord, WeightRecord } from '@/lib/types';
import { formatShortDate } from '@/lib/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertTriangle,
  Clock,
  Stethoscope,
  Bell,
  ChevronLeft,
  ShieldCheck,
  Syringe,
  Scale,
} from 'lucide-react';

// ─── Props ─────────────────────────────────────────────────────────

interface AlertsPanelProps {
  pregnancies: PregnancyRecord[];
  diseases: DiseaseRecord[];
  vaccinations: VaccinationRecord[];
  weightRecords?: WeightRecord[];
  onNavigateToTab: (tab: 'pregnancy' | 'diseases' | 'vaccinations' | 'weight') => void;
}

// ─── Alert Types ───────────────────────────────────────────────────

type AlertSeverity = 'urgent' | 'warning' | 'info';

interface AlertItem {
  id: string;
  type: 'imminent-birth' | 'upcoming-birth' | 'overdue-exam' | 'pending-followup' | 'overdue-vaccination' | 'poor-body-condition';
  severity: AlertSeverity;
  sheepNumber: string;
  title: string;
  description: string;
  dateLabel: string;
  navigateTab: 'pregnancy' | 'diseases' | 'vaccinations' | 'weight';
}

// ─── Date Helpers ──────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  // Reset time part for accurate day counting
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDaysRemaining(days: number): string {
  if (days === 0) return 'اليوم';
  if (days === 1) return 'غداً';
  if (days > 1) return `بعد ${days} يوم`;
  const absDays = Math.abs(days);
  if (absDays === 1) return 'أمس';
  return `منذ ${absDays} يوم`;
}

// ─── Compute Alerts ────────────────────────────────────────────────

function computeAlerts(
  pregnancies: PregnancyRecord[],
  diseases: DiseaseRecord[],
  vaccinations: VaccinationRecord[],
  weightRecords: WeightRecord[],
): AlertItem[] {
  const alerts: AlertItem[] = [];

  for (const p of pregnancies) {
    // Skip if already born
    if (p.birthDate) continue;

    // ── Imminent / Upcoming Birth ──
    if (p.expectedBirthDate) {
      const days = daysUntil(p.expectedBirthDate);

      if (days <= 7 && days >= 0) {
        alerts.push({
          id: `imminent-birth-${p.id}`,
          type: 'imminent-birth',
          severity: 'urgent',
          sheepNumber: p.sheepNumber,
          title: 'ولادة وشيكة',
          description: `النعجة رقم ${p.sheepNumber} على وشك الولادة`,
          dateLabel: formatDaysRemaining(days),
          navigateTab: 'pregnancy',
        });
      } else if (days > 7 && days <= 30) {
        alerts.push({
          id: `upcoming-birth-${p.id}`,
          type: 'upcoming-birth',
          severity: 'warning',
          sheepNumber: p.sheepNumber,
          title: 'موعد قريب',
          description: `النعجة رقم ${p.sheepNumber} موعدها قريب`,
          dateLabel: formatDaysRemaining(days),
          navigateTab: 'pregnancy',
        });
      }
    }

    // ── Overdue Second Exam ──
    // First exam was negative, second exam date exists, but no second exam result
    if (
      p.firstExamResult === 'no' &&
      p.secondExamDate &&
      !p.secondExamResult
    ) {
      const days = daysUntil(p.secondExamDate);
      if (days < 0) {
        alerts.push({
          id: `overdue-exam-${p.id}`,
          type: 'overdue-exam',
          severity: 'warning',
          sheepNumber: p.sheepNumber,
          title: 'فحص متأخر',
          description: `النعجة رقم ${p.sheepNumber} تحتاج فحص ثانٍ`,
          dateLabel: formatDaysRemaining(days),
          navigateTab: 'pregnancy',
        });
      }
    }
  }

  // ── Pending Follow-up for Diseases ──
  for (const d of diseases) {
    if (d.suggestedTreatment && !d.followUp) {
      alerts.push({
        id: `pending-followup-${d.id}`,
        type: 'pending-followup',
        severity: 'warning',
        sheepNumber: d.sheepNumber,
        title: 'متابعة مطلوبة',
        description: d.symptoms
          ? `النعجة رقم ${d.sheepNumber} — ${d.symptoms}`
          : `النعجة رقم ${d.sheepNumber} تحتاج متابعة`,
        dateLabel: formatShortDate(d.createdAt),
        navigateTab: 'diseases',
      });
    }
  }

  // ── Overdue Vaccinations ──
  for (const v of vaccinations) {
    if (!v.nextDueDate) continue;
    const days = daysUntil(v.nextDueDate);
    if (days < 0) {
      alerts.push({
        id: `overdue-vaccination-${v.id}`,
        type: 'overdue-vaccination',
        severity: 'warning',
        sheepNumber: v.sheepNumber,
        title: 'تحصين متأخر',
        description: v.vaccineName
          ? `النعجة رقم ${v.sheepNumber} — تحصين ${v.vaccineName}`
          : `النعجة رقم ${v.sheepNumber} تحتاج تحصين`,
        dateLabel: formatDaysRemaining(days),
        navigateTab: 'vaccinations',
      });
    }
  }

  // ── Poor Body Condition (Weight Records) ──
  const poorConditionRecords = weightRecords.filter((r) => r.bodyCondition === 'poor');
  if (poorConditionRecords.length > 0) {
    // Get unique sheep numbers with poor condition
    const uniqueSheep = [...new Set(poorConditionRecords.map((r) => r.sheepNumber))];
    alerts.push({
      id: `poor-body-condition-${uniqueSheep.join('-')}`,
      type: 'poor-body-condition',
      severity: 'warning',
      sheepNumber: uniqueSheep[0],
      title: 'حالة جسدية ضعيفة',
      description: uniqueSheep.length === 1
        ? `النعجة رقم ${uniqueSheep[0]} بحالة جسدية ضعيفة`
        : `${uniqueSheep.length} أغنام بحالة جسدية ضعيفة تحتاج متابعة`,
      dateLabel: `${poorConditionRecords.length} سجل`,
      navigateTab: 'weight',
    });
  }

  // Sort: urgent first, then by date
  const severityOrder: Record<AlertSeverity, number> = {
    urgent: 0,
    warning: 1,
    info: 2,
  };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return alerts;
}

// ─── Severity Configs ──────────────────────────────────────────────

function getSeverityConfig(severity: AlertSeverity) {
  switch (severity) {
    case 'urgent':
      return {
        borderColor: 'border-r-rose-500 dark:border-r-rose-400',
        iconBg: 'bg-rose-100 dark:bg-rose-900/40',
        iconColor: 'text-rose-600 dark:text-rose-400',
        badgeBg: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        hoverBg: 'hover:bg-rose-50/60 dark:hover:bg-rose-950/30',
        icon: <AlertTriangle className="size-4" />,
      };
    case 'warning':
      return {
        borderColor: 'border-r-amber-500 dark:border-r-amber-400',
        iconBg: 'bg-amber-100 dark:bg-amber-900/40',
        iconColor: 'text-amber-600 dark:text-amber-400',
        badgeBg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        hoverBg: 'hover:bg-amber-50/60 dark:hover:bg-amber-950/30',
        icon: <Clock className="size-4" />,
      };
    case 'info':
      return {
        borderColor: 'border-r-emerald-500 dark:border-r-emerald-400',
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        badgeBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        hoverBg: 'hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30',
        icon: <Bell className="size-4" />,
      };
  }
}

function getAlertTypeIcon(type: AlertItem['type']) {
  switch (type) {
    case 'imminent-birth':
      return <AlertTriangle className="size-4" />;
    case 'upcoming-birth':
      return <Clock className="size-4" />;
    case 'overdue-exam':
      return <Stethoscope className="size-4" />;
    case 'pending-followup':
      return <Stethoscope className="size-4" />;
    case 'overdue-vaccination':
      return <Syringe className="size-4" />;
    case 'poor-body-condition':
      return <Scale className="size-4" />;
  }
}

// ─── Main Component ────────────────────────────────────────────────

export default function AlertsPanel({
  pregnancies,
  diseases,
  vaccinations,
  weightRecords = [],
  onNavigateToTab,
}: AlertsPanelProps) {
  const alerts = useMemo(
    () => computeAlerts(pregnancies, diseases, vaccinations, weightRecords),
    [pregnancies, diseases, vaccinations, weightRecords],
  );

  const urgentCount = alerts.filter((a) => a.severity === 'urgent').length;

  return (
    <section className="space-y-3">
      {/* ── Section Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="size-5 text-emerald-600 dark:text-emerald-400" />
            {alerts.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-background dark:ring-background animate-pulse-dot">
                {alerts.length}
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-foreground">التنبيهات والمواعيد القادمة</h2>
          {alerts.length > 0 && (
            <Badge variant="secondary" className="text-[10px] h-5">
              {alerts.length} تنبيه
            </Badge>
          )}
        </div>
        {urgentCount > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-medium">
            <AlertTriangle className="size-3" />
            <span>{urgentCount} عاجل</span>
          </div>
        )}
      </div>

      {/* ── Alerts List ── */}
      <Card className="overflow-hidden">
        {alerts.length === 0 ? (
          <CardContent className="p-6">
            <EmptyState />
          </CardContent>
        ) : (
          <ScrollArea className="max-h-[420px]">
            <div className="divide-y divide-border/60">
              {alerts.map((alert) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  onClick={() => onNavigateToTab(alert.navigateTab)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </Card>
    </section>
  );
}

// ─── Sub-components ────────────────────────────────────────────────

function AlertRow({
  alert,
  onClick,
}: {
  alert: AlertItem;
  onClick: () => void;
}) {
  const config = getSeverityConfig(alert.severity);
  const typeIcon = getAlertTypeIcon(alert.type);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3 text-right transition-colors duration-150
        border-r-4 ${config.borderColor}
        ${config.hoverBg}
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        group
      `}
      aria-label={alert.description}
    >
      {/* Icon */}
      <div
        className={`
          shrink-0 flex items-center justify-center size-8 rounded-lg
          ${config.iconBg} ${config.iconColor}
        `}
      >
        {typeIcon}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-bold text-foreground truncate">
            {alert.sheepNumber}
          </span>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 h-4 font-medium shrink-0 ${config.badgeBg}`}
          >
            {alert.title}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground truncate">
          {alert.description}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5 font-medium tabular-nums">
          {alert.dateLabel}
        </p>
      </div>

      {/* Navigate Chevron */}
      <ChevronLeft className="size-4 shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors rtl:rotate-180" />
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="size-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
        <ShieldCheck className="size-7 text-emerald-500 dark:text-emerald-400" />
      </div>
      <p className="text-sm font-semibold text-foreground mb-1">
        لا توجد تنبيهات حالياً
      </p>
      <p className="text-xs text-muted-foreground max-w-[260px]">
        جميع السجلات محدثة ولا توجد مواعيد قادمة أو متأخرة تحتاج متابعة
      </p>
    </div>
  );
}
