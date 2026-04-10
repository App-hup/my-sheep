'use client';

import { useState, useMemo, useCallback } from 'react';
import type {
  PregnancyRecord,
  DiseaseRecord,
  BirthRecord,
  VaccinationRecord,
  FinancialRecord,
} from '@/lib/types';
import { GENDER_LABELS } from '@/lib/types';
import { formatShortDate, formatDateArabic } from '@/lib/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Baby,
  HeartPulse,
  Sprout,
  Syringe,
  Wallet,
  Package,
} from 'lucide-react';

// ─── Props ─────────────────────────────────────────────────────────

interface CalendarTimelineProps {
  pregnancies: PregnancyRecord[];
  diseases: DiseaseRecord[];
  births: BirthRecord[];
  vaccinations: VaccinationRecord[];
  financialRecords: FinancialRecord[];
}

// ─── Event Types ───────────────────────────────────────────────────

type EventType = 'expected-birth' | 'birth' | 'vaccination' | 'disease' | 'financial';

interface CalendarEvent {
  id: string;
  type: EventType;
  date: string; // YYYY-MM-DD
  description: string;
}

// ─── Event Type Config ─────────────────────────────────────────────

const EVENT_COLORS: Record<EventType, {
  dot: string;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  hoverBg: string;
}> = {
  'expected-birth': {
    dot: 'bg-emerald-500 dark:bg-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    hoverBg: 'hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30',
  },
  'birth': {
    dot: 'bg-sky-500 dark:bg-sky-400',
    iconBg: 'bg-sky-100 dark:bg-sky-900/40',
    iconColor: 'text-sky-600 dark:text-sky-400',
    badgeBg: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    hoverBg: 'hover:bg-sky-50/60 dark:hover:bg-sky-950/30',
  },
  'vaccination': {
    dot: 'bg-violet-500 dark:bg-violet-400',
    iconBg: 'bg-violet-100 dark:bg-violet-900/40',
    iconColor: 'text-violet-600 dark:text-violet-400',
    badgeBg: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 border-violet-200 dark:border-violet-800',
    hoverBg: 'hover:bg-violet-50/60 dark:hover:bg-violet-950/30',
  },
  'disease': {
    dot: 'bg-rose-500 dark:bg-rose-400',
    iconBg: 'bg-rose-100 dark:bg-rose-900/40',
    iconColor: 'text-rose-600 dark:text-rose-400',
    badgeBg: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    hoverBg: 'hover:bg-rose-50/60 dark:hover:bg-rose-950/30',
  },
  'financial': {
    dot: 'bg-orange-500 dark:bg-orange-400',
    iconBg: 'bg-orange-100 dark:bg-orange-900/40',
    iconColor: 'text-orange-600 dark:text-orange-400',
    badgeBg: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    hoverBg: 'hover:bg-orange-50/60 dark:hover:bg-orange-950/30',
  },
};

// ─── Calendar Constants ────────────────────────────────────────────

const ARABIC_WEEK_DAYS = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
];

const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

// ─── Date Helpers ──────────────────────────────────────────────────

/** Extract YYYY-MM-DD from a date string, handling various formats */
function toDateString(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
}

/** Format a Date to YYYY-MM-DD */
function dateToKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ─── Compute Events ────────────────────────────────────────────────

function computeEvents(
  pregnancies: PregnancyRecord[],
  diseases: DiseaseRecord[],
  births: BirthRecord[],
  vaccinations: VaccinationRecord[],
  financialRecords: FinancialRecord[],
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  // Expected births from pregnancies
  for (const p of pregnancies) {
    if (p.expectedBirthDate) {
      const dateKey = toDateString(p.expectedBirthDate);
      if (dateKey) {
        events.push({
          id: `expected-birth-${p.id}`,
          type: 'expected-birth',
          date: dateKey,
          description: `ولادة متوقعة - خروف رقم ${p.sheepNumber}`,
        });
      }
    }
  }

  // Births
  for (const b of births) {
    if (b.birthDate) {
      const dateKey = toDateString(b.birthDate);
      if (dateKey) {
        const genderLabel = GENDER_LABELS[b.gender] || b.gender;
        events.push({
          id: `birth-${b.id}`,
          type: 'birth',
          date: dateKey,
          description: `ميلاد - ${genderLabel} (${b.number})`,
        });
      }
    }
  }

  // Vaccinations (both vaccinationDate and nextDueDate)
  for (const v of vaccinations) {
    if (v.vaccinationDate) {
      const dateKey = toDateString(v.vaccinationDate);
      if (dateKey) {
        events.push({
          id: `vaccination-date-${v.id}`,
          type: 'vaccination',
          date: dateKey,
          description: `تحصين - ${v.vaccineName || ''} - خروف رقم ${v.sheepNumber}`,
        });
      }
    }
    if (v.nextDueDate) {
      const dateKey = toDateString(v.nextDueDate);
      if (dateKey) {
        events.push({
          id: `vaccination-due-${v.id}`,
          type: 'vaccination',
          date: dateKey,
          description: `موعد تحصين - ${v.vaccineName || ''} - خروف رقم ${v.sheepNumber}`,
        });
      }
    }
  }

  // Diseases
  for (const d of diseases) {
    if (d.createdAt) {
      const dateKey = toDateString(d.createdAt);
      if (dateKey) {
        events.push({
          id: `disease-${d.id}`,
          type: 'disease',
          date: dateKey,
          description: `مرض مسجل - خروف رقم ${d.sheepNumber}`,
        });
      }
    }
  }

  // Financial records
  for (const f of financialRecords) {
    if (f.date) {
      const dateKey = toDateString(f.date);
      if (dateKey) {
        const typeLabel = f.type === 'income' ? 'دخل' : 'مصروف';
        events.push({
          id: `financial-${f.id}`,
          type: 'financial',
          date: dateKey,
          description: `${typeLabel} - ${f.category} - ${f.amount.toLocaleString('ar-SA')} ر.س`,
        });
      }
    }
  }

  return events;
}

// ─── Main Component ────────────────────────────────────────────────

export default function CalendarTimeline({
  pregnancies,
  diseases,
  births,
  vaccinations,
  financialRecords,
}: CalendarTimelineProps) {
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Compute all events
  const allEvents = useMemo(
    () => computeEvents(pregnancies, diseases, births, vaccinations, financialRecords),
    [pregnancies, diseases, births, vaccinations, financialRecords],
  );

  // Compute events for current month
  const monthEvents = useMemo(() => {
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    return allEvents
      .filter((e) => e.date.startsWith(monthPrefix))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [allEvents, currentMonth, currentYear]);

  // Build a map of date -> event types for the calendar grid
  const eventsByDate = useMemo(() => {
    const map = new Map<string, Set<EventType>>();
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    for (const event of allEvents) {
      if (event.date.startsWith(monthPrefix)) {
        if (!map.has(event.date)) {
          map.set(event.date, new Set());
        }
        map.get(event.date)!.add(event.type);
      }
    }
    return map;
  }, [allEvents, currentMonth, currentYear]);

  // Calendar grid computation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Day of week for the 1st (0=Sun, 6=Sat)
    const startDayOfWeek = firstDay.getDay();

    // Previous month days to show
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    const prevDays: { day: number; currentMonth: boolean; dateKey: string }[] = [];
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateKey = dateToKey(new Date(prevYear, prevMonth, day));
      prevDays.push({ day, currentMonth: false, dateKey });
    }

    // Current month days
    const currentDays: { day: number; currentMonth: boolean; dateKey: string }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = dateToKey(new Date(currentYear, currentMonth, d));
      currentDays.push({ day: d, currentMonth: true, dateKey });
    }

    // Next month days to fill the grid (fill to complete the last row = 7 cells per row)
    const totalCells = prevDays.length + currentDays.length;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    const nextDays: { day: number; currentMonth: boolean; dateKey: string }[] = [];
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateKey = dateToKey(new Date(nextYear, nextMonth, d));
      nextDays.push({ day: d, currentMonth: false, dateKey });
    }

    return [...prevDays, ...currentDays, ...nextDays];
  }, [currentMonth, currentYear]);

  // Navigation handlers
  const goToPrevMonth = useCallback(() => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDay(null);
  }, [currentMonth]);

  const goToNextMonth = useCallback(() => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDay(null);
  }, [currentMonth]);

  const goToToday = useCallback(() => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDay(dateToKey(today));
  }, [today]);

  // Filter events for selected day
  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return null;
    return monthEvents.filter((e) => e.date === selectedDay);
  }, [monthEvents, selectedDay]);

  // Stats for the current month
  const monthStats = useMemo(() => {
    const expectedBirths = monthEvents.filter((e) => e.type === 'expected-birth').length;
    const vaccEvents = monthEvents.filter((e) => e.type === 'vaccination').length;
    const financial = monthEvents.filter((e) => e.type === 'financial').length;
    return { expectedBirths, vaccEvents, financial };
  }, [monthEvents]);

  // Today's date key
  const todayKey = dateToKey(today);

  // Current Hijri date
  const hijriDate = useMemo(() => {
    try {
      return today.toLocaleDateString('ar-SA-u-ca-islamic-umalqura', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  }, [today]);

  // Gregorian date
  const gregorianDate = formatDateArabic(today.toISOString().split('T')[0]);

  return (
    <section className="space-y-3">
      {/* ── Section Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="size-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-lg font-bold text-foreground">التقويم والجدول الزمني</h2>
          <Badge variant="secondary" className="text-[10px] h-5">
            {monthEvents.length} حدث
          </Badge>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-0">
          <span className="text-[10px] text-muted-foreground font-medium">{hijriDate}</span>
          <span className="text-[10px] text-muted-foreground">{gregorianDate}</span>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* ── Month Navigation ── */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextMonth}
              className="size-8 rounded-lg border-emerald-200 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400"
              aria-label="الشهر التالي"
            >
              <ChevronRight className="size-4" />
            </Button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={goToToday}
                className="text-xs text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors underline-offset-2 hover:underline"
              >
                اليوم
              </button>
              <h3 className="text-base sm:text-lg font-bold text-foreground tabular-nums min-w-[160px] text-center">
                {ARABIC_MONTHS[currentMonth]} {currentYear}
              </h3>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevMonth}
              className="size-8 rounded-lg border-emerald-200 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400"
              aria-label="الشهر السابق"
            >
              <ChevronLeft className="size-4" />
            </Button>
          </div>

          {/* ── Mini Calendar Grid ── */}
          <div className="select-none">
            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-0 mb-1">
              {ARABIC_WEEK_DAYS.map((dayName) => (
                <div
                  key={dayName}
                  className="text-center text-[10px] sm:text-xs font-semibold text-muted-foreground py-1"
                >
                  {dayName}
                </div>
              ))}
            </div>

            {/* Calendar cells */}
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
              {calendarDays.map((cell, idx) => {
                const isToday = cell.dateKey === todayKey;
                const isSelected = cell.dateKey === selectedDay;
                const eventTypes = eventsByDate.get(cell.dateKey);
                const isOutsideMonth = !cell.currentMonth;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDay(cell.dateKey === selectedDay ? null : cell.dateKey)}
                    className={`
                      relative flex flex-col items-center justify-center
                      rounded-lg sm:rounded-xl py-1 sm:py-2 min-h-[36px] sm:min-h-[44px]
                      transition-all duration-150
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1
                      ${isOutsideMonth
                        ? 'opacity-30 cursor-default'
                        : 'cursor-pointer hover:bg-muted/80'
                      }
                      ${isSelected && !isOutsideMonth
                        ? 'bg-emerald-500 dark:bg-emerald-600 text-white shadow-sm'
                        : ''
                      }
                      ${isToday && !isSelected && !isOutsideMonth
                        ? 'ring-2 ring-emerald-500 dark:ring-emerald-400'
                        : ''
                      }
                    `}
                    aria-label={`${cell.day} ${ARABIC_MONTHS[currentMonth]}`}
                    disabled={isOutsideMonth}
                  >
                    <span
                      className={`
                        text-[11px] sm:text-sm font-medium tabular-nums leading-none
                        ${isSelected && !isOutsideMonth
                          ? 'text-white font-bold'
                          : isToday && !isOutsideMonth
                            ? 'text-emerald-700 dark:text-emerald-300 font-bold'
                            : isOutsideMonth
                              ? 'text-muted-foreground'
                              : 'text-foreground'
                        }
                      `}
                    >
                      {cell.day}
                    </span>

                    {/* Event dots */}
                    {eventTypes && eventTypes.size > 0 && (
                      <div className="flex items-center gap-[2px] mt-0.5">
                        {Array.from(eventTypes).map((type) => (
                          <span
                            key={type}
                            className={`
                              size-[5px] sm:size-[6px] rounded-full
                              ${isSelected && !isOutsideMonth
                                ? 'bg-white/80 dark:bg-white/70'
                                : EVENT_COLORS[type].dot
                              }
                            `}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Event Legend ── */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1">
            <LegendDot color="bg-emerald-500 dark:bg-emerald-400" label="ولادة متوقعة" />
            <LegendDot color="bg-sky-500 dark:bg-sky-400" label="ميلاد" />
            <LegendDot color="bg-violet-500 dark:bg-violet-400" label="تحصين" />
            <LegendDot color="bg-rose-500 dark:bg-rose-400" label="مرض" />
            <LegendDot color="bg-orange-500 dark:bg-orange-400" label="مالي" />
          </div>

          {/* ── Stats Bar ── */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 py-2 rounded-lg bg-muted/40 border border-border/50">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Baby className="size-3 text-emerald-500 dark:text-emerald-400" />
              <span className="font-semibold text-foreground tabular-nums">{monthStats.expectedBirths}</span>
              ولادات متوقعة
            </span>
            <span className="text-border">|</span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Syringe className="size-3 text-violet-500 dark:text-violet-400" />
              <span className="font-semibold text-foreground tabular-nums">{monthStats.vaccEvents}</span>
              تحصينات
            </span>
            <span className="text-border">|</span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Wallet className="size-3 text-orange-500 dark:text-orange-400" />
              <span className="font-semibold text-foreground tabular-nums">{monthStats.financial}</span>
              سجلات مالية
            </span>
          </div>

          {/* ── Event List ── */}
          {selectedDay && selectedDayEvents && selectedDayEvents.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <h4 className="text-xs font-semibold text-foreground">
                  أحداث {formatShortDate(selectedDay)}
                </h4>
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                  {selectedDayEvents.length}
                </Badge>
              </div>
              <ScrollArea className="max-h-64">
                <div className="space-y-1">
                  {selectedDayEvents.map((event) => (
                    <EventRow key={event.id} event={event} />
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : selectedDay && selectedDayEvents && selectedDayEvents.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-xs text-muted-foreground">
                لا توجد أحداث في {formatShortDate(selectedDay)}
              </p>
            </div>
          ) : monthEvents.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <h4 className="text-xs font-semibold text-foreground">
                  جميع أحداث الشهر
                </h4>
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                  {monthEvents.length}
                </Badge>
              </div>
              <ScrollArea className="max-h-64">
                <div className="space-y-1">
                  {monthEvents.map((event) => (
                    <EventRow
                      key={event.id}
                      event={event}
                      isHighlighted={selectedDay !== null}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

// ─── Sub-components ────────────────────────────────────────────────

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
      <span className={`size-2 rounded-full shrink-0 ${color}`} />
      <span>{label}</span>
    </div>
  );
}

function EventRow({
  event,
  isHighlighted = false,
}: {
  event: CalendarEvent;
  isHighlighted?: boolean;
}) {
  const config = EVENT_COLORS[event.type];
  const icon = getEventIcon(event.type);

  return (
    <div
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors duration-150
        ${isHighlighted ? 'opacity-40' : ''}
        ${config.hoverBg}
        border-transparent hover:border-border/50
      `}
    >
      {/* Icon */}
      <div
        className={`
          shrink-0 flex items-center justify-center size-7 rounded-lg
          ${config.iconBg} ${config.iconColor}
        `}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground truncate leading-relaxed">
          {event.description}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">
          {formatShortDate(event.date)}
        </p>
      </div>

      {/* Type Badge */}
      <Badge
        variant="outline"
        className={`text-[9px] px-1.5 py-0 h-4 font-medium shrink-0 ${config.badgeBg}`}
      >
        {getEventLabel(event.type)}
      </Badge>
    </div>
  );
}

function getEventIcon(type: EventType): React.ReactNode {
  switch (type) {
    case 'expected-birth':
      return <Baby className="size-3.5" />;
    case 'birth':
      return <Sprout className="size-3.5" />;
    case 'vaccination':
      return <Syringe className="size-3.5" />;
    case 'disease':
      return <HeartPulse className="size-3.5" />;
    case 'financial':
      return <Wallet className="size-3.5" />;
  }
}

function getEventLabel(type: EventType): string {
  switch (type) {
    case 'expected-birth':
      return 'ولادة';
    case 'birth':
      return 'ميلاد';
    case 'vaccination':
      return 'تحصين';
    case 'disease':
      return 'مرض';
    case 'financial':
      return 'مالي';
  }
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="size-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
        <Calendar className="size-7 text-emerald-500 dark:text-emerald-400" />
      </div>
      <p className="text-sm font-semibold text-foreground mb-1">
        لا توجد أحداث في هذا الشهر
      </p>
      <p className="text-xs text-muted-foreground max-w-[260px]">
        لم يتم تسجيل أي أحداث (ولادات، تحصينات، أمراض، أو سجلات مالية) خلال هذا الشهر
      </p>
    </div>
  );
}
