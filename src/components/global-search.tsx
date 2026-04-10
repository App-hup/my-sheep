'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { GENDER_LABELS } from '@/lib/types';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Baby,
  HeartPulse,
  Sprout,
  Package,
  Clock,
  Syringe,
  User,
  Scale,
  Wallet,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────

type TabValue = 'pregnancy' | 'diseases' | 'births' | 'feed' | 'vaccinations' | 'profiles' | 'financial' | 'weight';

interface GlobalSearchProps {
  pregnancies: PregnancyRecord[];
  diseases: DiseaseRecord[];
  births: BirthRecord[];
  feedSections: FeedSection[];
  vaccinations: VaccinationRecord[];
  sheepProfiles: SheepProfile[];
  weightRecords?: WeightRecord[];
  financialRecords?: FinancialRecord[];
  onNavigateToTab: (tab: TabValue) => void;
}

// ─── Constants ────────────────────────────────────────────────────

const RECENT_KEY = 'alhazira_recent_searches';

function loadRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    return Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentSearches(queries: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(queries));
  } catch {
    /* ignore */
  }
}

// ─── Main Component ───────────────────────────────────────────────

export default function GlobalSearch({
  pregnancies,
  diseases,
  births,
  feedSections,
  vaccinations,
  sheepProfiles,
  weightRecords = [],
  financialRecords = [],
  onNavigateToTab,
}: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const recentSearches = useMemo(() => {
    if (!open) return [];
    return loadRecentSearches().slice(0, 8);
  }, [open, refreshKey]);

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const recent = loadRecentSearches().filter((q) => q !== trimmed);
    recent.unshift(trimmed);
    saveRecentSearches(recent.slice(0, 10));
    setRefreshKey((k) => k + 1);
  }, []);

  const clearRecent = useCallback(() => {
    saveRecentSearches([]);
    setRefreshKey((k) => k + 1);
  }, []);

  const handleNavigate = useCallback(
    (tab: TabValue) => {
      setOpen(false);
      onNavigateToTab(tab);
    },
    [onNavigateToTab],
  );

  return (
    <>
      {/* ─── Trigger Button ─── */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 text-muted-foreground border-dashed hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all duration-200 h-8 px-3"
      >
        <Search className="size-3.5 text-emerald-500" />
        <span className="hidden sm:inline text-xs">بحث...</span>
        <kbd className="pointer-events-none hidden sm:inline-flex h-5 items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* ─── Search Dialog ─── */}
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="بحث شامل"
        description="ابحث في جميع بيانات الحظيرة"
        showCloseButton={true}
        className="sm:max-w-[580px]"
      >
        <CommandInput
          placeholder="ابحث برقم الأغنام، التاريخ، الأعراض، اسم القسم..."
          className="text-right"
          dir="rtl"
        />

        <CommandList>
          <CommandEmpty>
            <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
              <div className="size-12 rounded-full bg-muted/50 flex items-center justify-center">
                <Search className="size-5 opacity-40" />
              </div>
              <p className="text-sm font-medium">لم يتم العثور على نتائج</p>
              <p className="text-xs opacity-70">جرّب البحث بكلمات أو أرقام مختلفة</p>
            </div>
          </CommandEmpty>

          {/* ── Recent Searches ── */}
          {recentSearches.length > 0 && (
            <>
              <CommandGroup heading={
                <div className="flex items-center gap-2">
                  <Clock className="size-3 text-muted-foreground" />
                  <span>عمليات بحث سابقة</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                    {loadRecentSearches().length}
                  </Badge>
                </div>
              }>
                {recentSearches.map((q, i) => (
                  <CommandItem
                    key={`recent-${i}`}
                    value={`__recent__${q}`}
                    onSelect={() => {
                      addSearch(q);
                      setOpen(false);
                    }}
                    className="gap-2"
                  >
                    <Clock className="size-3.5 text-muted-foreground/50 shrink-0" />
                    <span className="text-muted-foreground truncate">{q}</span>
                  </CommandItem>
                ))}
                <CommandItem
                  value="__clear_recent__"
                  onSelect={clearRecent}
                  className="gap-2 justify-center text-xs text-rose-500 hover:text-rose-600"
                >
                  مسح سجل البحث
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* ── Pregnancy Group ── */}
          <CommandGroup heading={
            <GroupHeading
              icon={<Baby className="size-3.5" />}
              label="متابعة الحمل"
              colorClass="text-emerald-600"
              count={pregnancies.length}
            />
          }>
            {pregnancies.length === 0 ? (
              <EmptySlot label="لا توجد سجلات حمل" />
            ) : (
              pregnancies.map((r) => (
                <CommandItem
                  key={r.id}
                  value={`${r.sheepNumber} ${r.monitoringDate} ${r.firstExamDate} ${r.firstExamResult === 'yes' ? 'حمل مؤكد' : r.status === 'monitored' ? 'تحت المراقبة' : 'غير مراقب'}`}
                  onSelect={() => {
                    addSearch(r.sheepNumber);
                    handleNavigate('pregnancy');
                  }}
                  className="gap-3"
                >
                  <div className="flex size-8 items-center justify-center rounded-md bg-emerald-50 dark:bg-emerald-950/40 shrink-0">
                    <Baby className="size-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1 text-right">
                    <p className="font-medium text-sm truncate">#{r.sheepNumber}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {r.firstExamResult === 'yes' ? 'حمل مؤكد' : r.status === 'monitored' ? 'تحت المراقبة' : 'غير مُراقَب'}
                      {r.monitoringDate ? ` | ${formatShortDate(r.monitoringDate)}` : ''}
                    </p>
                  </div>
                </CommandItem>
              ))
            )}
          </CommandGroup>

          <CommandSeparator />

          {/* ── Diseases Group ── */}
          <CommandGroup heading={
            <GroupHeading
              icon={<HeartPulse className="size-3.5" />}
              label="الأمراض"
              colorClass="text-rose-600"
              count={diseases.length}
            />
          }>
            {diseases.length === 0 ? (
              <EmptySlot label="لا توجد سجلات أمراض" />
            ) : (
              diseases.map((r) => (
                <CommandItem
                  key={r.id}
                  value={`${r.sheepNumber} ${r.symptoms} ${r.suggestedTreatment}`}
                  onSelect={() => {
                    addSearch(r.sheepNumber);
                    handleNavigate('diseases');
                  }}
                  className="gap-3"
                >
                  <div className="flex size-8 items-center justify-center rounded-md bg-rose-50 dark:bg-rose-950/40 shrink-0">
                    <HeartPulse className="size-4 text-rose-600" />
                  </div>
                  <div className="min-w-0 flex-1 text-right">
                    <p className="font-medium text-sm truncate">#{r.sheepNumber}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {r.symptoms || r.suggestedTreatment || 'بدون تفاصيل'}
                    </p>
                  </div>
                </CommandItem>
              ))
            )}
          </CommandGroup>

          <CommandSeparator />

          {/* ── Births Group ── */}
          <CommandGroup heading={
            <GroupHeading
              icon={<Sprout className="size-3.5" />}
              label="المواليد"
              colorClass="text-sky-600"
              count={births.length}
            />
          }>
            {births.length === 0 ? (
              <EmptySlot label="لا توجد سجلات مواليد" />
            ) : (
              births.map((r) => (
                <CommandItem
                  key={r.id}
                  value={`${r.number} ${r.birthDate} ${GENDER_LABELS[r.gender]}`}
                  onSelect={() => {
                    addSearch(r.number);
                    handleNavigate('births');
                  }}
                  className="gap-3"
                >
                  <div className="flex size-8 items-center justify-center rounded-md bg-sky-50 dark:bg-sky-950/40 shrink-0">
                    <Sprout className="size-4 text-sky-600" />
                  </div>
                  <div className="min-w-0 flex-1 text-right">
                    <p className="font-medium text-sm truncate">#{r.number}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {GENDER_LABELS[r.gender]}
                      {r.birthDate ? ` | ${formatShortDate(r.birthDate)}` : ''}
                    </p>
                  </div>
                </CommandItem>
              ))
            )}
          </CommandGroup>

          <CommandSeparator />

          {/* ── Feed Group ── */}
          <CommandGroup heading={
            <GroupHeading
              icon={<Package className="size-3.5" />}
              label="الأعلاف"
              colorClass="text-amber-600"
              count={feedSections.length}
            />
          }>
            {feedSections.length === 0 ? (
              <EmptySlot label="لا توجد أقسام أعلاف" />
            ) : (
              feedSections.map((s) => (
                <CommandItem
                  key={s.id}
                  value={`${s.name} ${s.count}`}
                  onSelect={() => {
                    addSearch(s.name);
                    handleNavigate('feed');
                  }}
                  className="gap-3"
                >
                  <div className="flex size-8 items-center justify-center rounded-md bg-amber-50 dark:bg-amber-950/40 shrink-0">
                    <Package className="size-4 text-amber-600" />
                  </div>
                  <div className="min-w-0 flex-1 text-right">
                    <p className="font-medium text-sm truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {s.count} رأس
                    </p>
                  </div>
                </CommandItem>
              ))
            )}
          </CommandGroup>

          <CommandSeparator />

          {/* ── Vaccinations Group ── */}
          <CommandGroup heading={
            <GroupHeading
              icon={<Syringe className="size-3.5" />}
              label="التحصينات"
              colorClass="text-violet-600"
              count={vaccinations.length}
            />
          }>
            {vaccinations.length === 0 ? (
              <EmptySlot label="لا توجد سجلات تحصينات" />
            ) : (
              vaccinations.map((r) => (
                <CommandItem
                  key={r.id}
                  value={`${r.sheepNumber} ${r.vaccineName} ${r.veterinarian}`}
                  onSelect={() => {
                    addSearch(r.sheepNumber);
                    handleNavigate('vaccinations');
                  }}
                  className="gap-3"
                >
                  <div className="flex size-8 items-center justify-center rounded-md bg-violet-50 dark:bg-violet-950/40 shrink-0">
                    <Syringe className="size-4 text-violet-600" />
                  </div>
                  <div className="min-w-0 flex-1 text-right">
                    <p className="font-medium text-sm truncate">#{r.sheepNumber}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {r.vaccineName || 'بدون تفاصيل'}
                      {r.vaccinationDate ? ` | ${formatShortDate(r.vaccinationDate)}` : ''}
                    </p>
                  </div>
                </CommandItem>
              ))
            )}
          </CommandGroup>

          <CommandSeparator />

          {/* ── Sheep Profiles Group ── */}
          <CommandGroup heading={
            <GroupHeading
              icon={<User className="size-3.5" />}
              label="سجل الأغنام"
              colorClass="text-teal-600"
              count={sheepProfiles.length}
            />
          }>
            {sheepProfiles.length === 0 ? (
              <EmptySlot label="لا توجد ملفات أغنام" />
            ) : (
              sheepProfiles.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`${p.number} ${p.name} ${p.section} ${p.gender === 'male' ? 'ذكر' : p.gender === 'female' ? 'أنثى' : ''}`}
                  onSelect={() => {
                    addSearch(p.number);
                    handleNavigate('profiles');
                  }}
                  className="gap-3"
                >
                  <div className="flex size-8 items-center justify-center rounded-md bg-teal-50 dark:bg-teal-950/40 shrink-0">
                    <User className="size-4 text-teal-600" />
                  </div>
                  <div className="min-w-0 flex-1 text-right">
                    <p className="font-medium text-sm truncate">#{p.number}{p.name ? ` — ${p.name}` : ''}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.gender === 'male' ? 'ذكر' : p.gender === 'female' ? 'أنثى' : 'غير معروف'}
                      {p.section ? ` | ${p.section}` : ''}
                    </p>
                  </div>
                </CommandItem>
              ))
            )}
          </CommandGroup>

          <CommandSeparator />

          {/* ── Financial Records Group ── */}
          <CommandGroup heading={
            <GroupHeading
              icon={<Wallet className="size-3.5" />}
              label="المالية"
              colorClass="text-orange-600"
              count={financialRecords.length}
            />
          }>
            {financialRecords.length === 0 ? (
              <EmptySlot label="لا توجد سجلات مالية" />
            ) : (
              financialRecords.map((r) => (
                <CommandItem
                  key={r.id}
                  value={`${r.description} ${r.category} ${r.notes}`}
                  onSelect={() => {
                    addSearch(r.category);
                    handleNavigate('financial');
                  }}
                  className="gap-3"
                >
                  <div className="flex size-8 items-center justify-center rounded-md bg-orange-50 dark:bg-orange-950/40 shrink-0">
                    <Wallet className="size-4 text-orange-600" />
                  </div>
                  <div className="min-w-0 flex-1 text-right">
                    <p className="font-medium text-sm truncate">{r.category}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {r.type === 'income' ? 'دخل' : 'مصروف'} — {r.amount.toLocaleString('ar-SA')} ر.س
                      {r.description ? ` | ${r.description}` : ''}
                    </p>
                  </div>
                </CommandItem>
              ))
            )}
          </CommandGroup>

          <CommandSeparator />

          {/* ── Weight Records Group ── */}
          <CommandGroup heading={
            <GroupHeading
              icon={<Scale className="size-3.5" />}
              label="الأوزان"
              colorClass="text-lime-600"
              count={weightRecords.length}
            />
          }>
            {weightRecords.length === 0 ? (
              <EmptySlot label="لا توجد سجلات أوزان" />
            ) : (
              weightRecords.map((r) => (
                <CommandItem
                  key={r.id}
                  value={`${r.sheepNumber} ${r.notes}`}
                  onSelect={() => {
                    addSearch(r.sheepNumber);
                    handleNavigate('weight');
                  }}
                  className="gap-3"
                >
                  <div className="flex size-8 items-center justify-center rounded-md bg-lime-50 dark:bg-lime-950/40 shrink-0">
                    <Scale className="size-4 text-lime-600" />
                  </div>
                  <div className="min-w-0 flex-1 text-right">
                    <p className="font-medium text-sm truncate">#{r.sheepNumber}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {r.weight} كجم
                      {r.date ? ` | ${formatShortDate(r.date)}` : ''}
                    </p>
                  </div>
                </CommandItem>
              ))
            )}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

// ─── Helper Components ────────────────────────────────────────────

function GroupHeading({
  icon,
  label,
  colorClass,
  count,
}: {
  icon: React.ReactNode;
  label: string;
  colorClass: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={colorClass}>{icon}</span>
      <span className="text-xs font-semibold">{label}</span>
      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
        {count}
      </Badge>
    </div>
  );
}

function EmptySlot({ label }: { label: string }) {
  return (
    <div className="py-2 px-2">
      <p className="text-xs text-muted-foreground/50 text-center">{label}</p>
    </div>
  );
}
