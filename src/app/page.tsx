'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  AppState,
  PregnancyRecord,
  DiseaseRecord,
  BirthRecord,
  FeedSection,
  VaccinationRecord,
  SheepProfile,
  FinancialRecord,
  WeightRecord,
  MilkRecord,
} from '@/lib/types';
import { loadState, saveState } from '@/lib/storage';
import { DEFAULT_APP_STATE } from '@/lib/types';
import { toast } from 'sonner';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Baby,
  HeartPulse,
  Package,
  Sprout,
  Syringe,
  Menu,
  X,
  Fence,
  Sun,
  Moon,
  Download,
  Upload,
  Trash2,
  Printer,
  User,
  Wallet,
  Plus,
  Settings,
  Shield,
  MousePointerClick,
  CalendarDays,
  Scale,
  Droplets,
} from 'lucide-react';
import { useTheme } from 'next-themes';

import StatisticsPanel from '@/components/statistics-panel';
import PregnancyTracker from '@/components/pregnancy-tracker';
import DiseasesManager from '@/components/diseases-manager';
import BirthsManager from '@/components/births-manager';
import FeedManager from '@/components/feed-manager';
import GlobalSearch from '@/components/global-search';
import AlertsPanel from '@/components/alerts-panel';
import ActivityTimeline from '@/components/activity-timeline';
import VaccinationTracker from '@/components/vaccination-tracker';
import SheepProfiles from '@/components/sheep-profiles';
import FinancialTracker from '@/components/financial-tracker';
import WelcomePanel from '@/components/welcome-panel';
import CalendarTimeline from '@/components/calendar-timeline';
import SettingsPanel from '@/components/settings-panel';
import WeightTracker from '@/components/weight-tracker';
import MilkProduction from '@/components/milk-production';
import EnhancedFooter from '@/components/enhanced-footer';
import MobileBottomNav from '@/components/mobile-bottom-nav';
import QuickNotes from '@/components/quick-notes';
import ProductionReport from '@/components/production-report';
import { addActivity } from '@/lib/activity-log';

// ─── Tab Configuration ───────────────────────────────────────────

const TABS = [
  { value: 'pregnancy', label: 'متابعة الحمل', icon: Baby, color: 'emerald' },
  { value: 'diseases', label: 'الأمراض', icon: HeartPulse, color: 'rose' },
  { value: 'births', label: 'المواليد', icon: Sprout, color: 'sky' },
  { value: 'feed', label: 'الأعلاف', icon: Package, color: 'amber' },
  { value: 'vaccinations', label: 'التحصينات', icon: Syringe, color: 'violet' },
  { value: 'profiles', label: 'سجل الأغنام', icon: User, color: 'teal' },
  { value: 'financial', label: 'المالية', icon: Wallet, color: 'orange' },
  { value: 'weight', label: 'الأوزان', icon: Scale, color: 'lime' },
  { value: 'milk', label: 'إنتاج الألبان', icon: Droplets, color: 'pink' },
] as const;

type TabValue = (typeof TABS)[number]['value'];

// ─── Custom hook for localStorage state ──────────────────────────

function useLocalState(): [AppState, React.Dispatch<React.SetStateAction<AppState>>, boolean] {
  const [state, setState] = useState<AppState>(DEFAULT_APP_STATE);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount — standard hydration pattern for client-only state
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(loadState());
    setMounted(true);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (mounted) {
      saveState(state);
    }
  }, [state, mounted]);

  return [state, setState, mounted];
}

// ─── Main Component ──────────────────────────────────────────────

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabValue>('pregnancy');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [state, setState, mounted] = useLocalState();
  const { setTheme, resolvedTheme } = useTheme();
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<AppState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  // ─── Handlers ──────────────────────────────────────────────────

  const handlePregnanciesChange = useCallback((records: PregnancyRecord[]) => {
    setState((prev) => {
      const prevIds = new Set(prev.pregnancies.map((r) => r.id));
      const newIds = new Set(records.map((r) => r.id));
      const added = records.filter((r) => !prevIds.has(r.id));
      const removed = prev.pregnancies.filter((r) => !newIds.has(r.id));
      if (added.length > 0) {
        addActivity({ type: 'pregnancy', action: 'create', description: `إضافة سجل حمل جديد`, details: added.map((r) => r.sheepNumber).join('، ') });
      }
      if (removed.length > 0) {
        addActivity({ type: 'pregnancy', action: 'delete', description: `حذف سجل حمل`, details: removed.map((r) => r.sheepNumber).join('، ') });
      }
      if (added.length === 0 && removed.length === 0 && records.length > 0) {
        addActivity({ type: 'pregnancy', action: 'update', description: `تعديل سجل حمل` });
      }
      return { ...prev, pregnancies: records };
    });
  }, [setState]);

  const handleDiseasesChange = useCallback((records: DiseaseRecord[]) => {
    setState((prev) => {
      const prevIds = new Set(prev.diseases.map((r) => r.id));
      const newIds = new Set(records.map((r) => r.id));
      const added = records.filter((r) => !prevIds.has(r.id));
      const removed = prev.diseases.filter((r) => !newIds.has(r.id));
      if (added.length > 0) {
        addActivity({ type: 'disease', action: 'create', description: `إضافة سجل مرض جديد`, details: added.map((r) => r.sheepNumber).join('، ') });
      }
      if (removed.length > 0) {
        addActivity({ type: 'disease', action: 'delete', description: `حذف سجل مرض`, details: removed.map((r) => r.sheepNumber).join('، ') });
      }
      if (added.length === 0 && removed.length === 0 && records.length > 0) {
        addActivity({ type: 'disease', action: 'update', description: `تعديل سجل مرض` });
      }
      return { ...prev, diseases: records };
    });
  }, [setState]);

  const handleBirthsChange = useCallback((records: BirthRecord[]) => {
    setState((prev) => {
      const prevIds = new Set(prev.births.map((r) => r.id));
      const newIds = new Set(records.map((r) => r.id));
      const added = records.filter((r) => !prevIds.has(r.id));
      const removed = prev.births.filter((r) => !newIds.has(r.id));
      if (added.length > 0) {
        addActivity({ type: 'birth', action: 'create', description: `إضافة سجل ميلاد جديد`, details: `${added.length} ولادة` });
      }
      if (removed.length > 0) {
        addActivity({ type: 'birth', action: 'delete', description: `حذف سجل ميلاد`, details: `${removed.length} سجل` });
      }
      return { ...prev, births: records };
    });
  }, [setState]);

  const handleFeedSectionsChange = useCallback((sections: FeedSection[]) => {
    setState((prev) => {
      const prevIds = new Set(prev.feedSections.map((s) => s.id));
      const newIds = new Set(sections.map((s) => s.id));
      const added = sections.filter((s) => !prevIds.has(s.id));
      const removed = prev.feedSections.filter((s) => !newIds.has(s.id));
      if (added.length > 0) {
        addActivity({ type: 'feed', action: 'create', description: `إضافة قسم أعلاف جديد`, details: added.map((s) => s.name).join('، ') });
      }
      if (removed.length > 0) {
        addActivity({ type: 'feed', action: 'delete', description: `حذف قسم أعلاف`, details: removed.map((s) => s.name).join('، ') });
      }
      if (added.length === 0 && removed.length === 0 && sections.length > 0) {
        addActivity({ type: 'feed', action: 'update', description: `تعديل قسم أعلاف` });
      }
      return { ...prev, feedSections: sections };
    });
  }, [setState]);

  const handleSheepProfilesChange = useCallback((profiles: SheepProfile[]) => {
    setState((prev) => {
      const prevIds = new Set(prev.sheepProfiles.map((r) => r.id));
      const newIds = new Set(profiles.map((r) => r.id));
      const added = profiles.filter((r) => !prevIds.has(r.id));
      const removed = prev.sheepProfiles.filter((r) => !newIds.has(r.id));
      if (added.length > 0) {
        addActivity({ type: 'data', action: 'create', description: `إضافة ملف أغنام جديد`, details: added.map((r) => r.number).join('، ') });
      }
      if (removed.length > 0) {
        addActivity({ type: 'data', action: 'delete', description: `حذف ملف أغنام`, details: removed.map((r) => r.number).join('، ') });
      }
      if (added.length === 0 && removed.length === 0 && profiles.length > 0) {
        addActivity({ type: 'data', action: 'update', description: `تعديل ملف أغنام` });
      }
      return { ...prev, sheepProfiles: profiles };
    });
  }, [setState]);

  const handleVaccinationsChange = useCallback((records: VaccinationRecord[]) => {
    setState((prev) => {
      const prevIds = new Set(prev.vaccinations.map((r) => r.id));
      const newIds = new Set(records.map((r) => r.id));
      const added = records.filter((r) => !prevIds.has(r.id));
      const removed = prev.vaccinations.filter((r) => !newIds.has(r.id));
      if (added.length > 0) {
        addActivity({ type: 'vaccination', action: 'create', description: `إضافة سجل تحصين جديد`, details: added.map((r) => r.vaccineName).join('، ') });
      }
      if (removed.length > 0) {
        addActivity({ type: 'vaccination', action: 'delete', description: `حذف سجل تحصين`, details: removed.map((r) => r.vaccineName).join('، ') });
      }
      if (added.length === 0 && removed.length === 0 && records.length > 0) {
        addActivity({ type: 'vaccination', action: 'update', description: `تعديل سجل تحصين` });
      }
      return { ...prev, vaccinations: records };
    });
  }, [setState]);

  const handleFinancialRecordsChange = useCallback((records: FinancialRecord[]) => {
    setState((prev) => {
      const prevIds = new Set(prev.financialRecords.map((r) => r.id));
      const newIds = new Set(records.map((r) => r.id));
      const added = records.filter((r) => !prevIds.has(r.id));
      const removed = prev.financialRecords.filter((r) => !newIds.has(r.id));
      if (added.length > 0) {
        addActivity({ type: 'data', action: 'create', description: `إضافة سجل مالي`, details: added.map((r) => `${r.type === 'income' ? 'دخل' : 'مصروف'}: ${r.amount.toLocaleString('ar-SA')} ر.س`).join('، ') });
      }
      if (removed.length > 0) {
        addActivity({ type: 'data', action: 'delete', description: `حذف سجل مالي`, details: `${removed.length} سجل` });
      }
      if (added.length === 0 && removed.length === 0 && records.length > 0) {
        addActivity({ type: 'data', action: 'update', description: `تعديل سجل مالي` });
      }
      return { ...prev, financialRecords: records };
    });
  }, [setState]);

  const handleMilkRecordsChange = useCallback((records: MilkRecord[]) => {
    setState((prev) => {
      const prevIds = new Set(prev.milkRecords.map((r) => r.id));
      const newIds = new Set(records.map((r) => r.id));
      const added = records.filter((r) => !prevIds.has(r.id));
      const removed = prev.milkRecords.filter((r) => !newIds.has(r.id));
      if (added.length > 0) {
        addActivity({ type: 'data', action: 'create', description: `تسجيل إنتاج ألبان`, details: added.map((r) => `${r.sheepNumber}: ${r.totalAmount} لتر`).join('، ') });
      }
      if (removed.length > 0) {
        addActivity({ type: 'data', action: 'delete', description: `حذف سجل إنتاج ألبان`, details: `${removed.length} سجل` });
      }
      if (added.length === 0 && removed.length === 0 && records.length > 0) {
        addActivity({ type: 'data', action: 'update', description: `تعديل سجل إنتاج ألبان` });
      }
      return { ...prev, milkRecords: records };
    });
  }, [setState]);

  const handleWeightRecordsChange = useCallback((records: WeightRecord[]) => {
    setState((prev) => {
      const prevIds = new Set(prev.weightRecords.map((r) => r.id));
      const newIds = new Set(records.map((r) => r.id));
      const added = records.filter((r) => !prevIds.has(r.id));
      const removed = prev.weightRecords.filter((r) => !newIds.has(r.id));
      if (added.length > 0) {
        addActivity({ type: 'data', action: 'create', description: `تسجيل وزن جديد`, details: added.map((r) => `${r.sheepNumber}: ${r.weight} كجم`).join('، ') });
      }
      if (removed.length > 0) {
        addActivity({ type: 'data', action: 'delete', description: `حذف سجل وزن`, details: `${removed.length} سجل` });
      }
      if (added.length === 0 && removed.length === 0 && records.length > 0) {
        addActivity({ type: 'data', action: 'update', description: `تعديل سجل وزن` });
      }
      return { ...prev, weightRecords: records };
    });
  }, [setState]);

  const handleBirthsGenerated = useCallback((newBirths: BirthRecord[]) => {
    setState((prev) => {
      addActivity({ type: 'birth', action: 'create', description: `تسجيل ولادة من سجل حمل`, details: `${newBirths.length} ولادة` });
      return {
        ...prev,
        births: [...prev.births, ...newBirths],
      };
    });
  }, [setState]);

  // ─── Data Export / Import / Clear ──────────────────────────────

  const exportData = useCallback(() => {
    const data = localStorage.getItem('alhazira_data');
    if (!data) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alhazira-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('تم تصدير البيانات بنجاح');
    addActivity({ type: 'data', action: 'export', description: 'تصدير نسخة احتياطية من البيانات' });
  }, []);

  const handleImportFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!data.pregnancies || !data.diseases || !data.births || !data.feedSections || !data.vaccinations || !data.sheepProfiles || !data.financialRecords || !data.weightRecords || !data.milkRecords) {
          toast.error('ملف غير صالح: هيكل البيانات غير صحيح');
          return;
        }
        setPendingImportData(data);
        setImportDialogOpen(true);
      } catch {
        toast.error('خطأ في قراءة الملف: تأكد من أنه ملف JSON صالح');
      }
    };
    reader.readAsText(file);
  }, []);

  const confirmImport = useCallback(() => {
    if (pendingImportData) {
      setState(pendingImportData);
      toast.success('تم استيراد البيانات بنجاح');
      addActivity({ type: 'data', action: 'import', description: 'استيراد بيانات من نسخة احتياطية' });
      setPendingImportData(null);
      setImportDialogOpen(false);
      setMobileMenuOpen(false);
    }
  }, [pendingImportData, setState]);

  const clearAllData = useCallback(() => {
    setState(DEFAULT_APP_STATE);
    toast.success('تم مسح جميع البيانات');
    addActivity({ type: 'data', action: 'clear', description: 'مسح جميع البيانات' });
    setClearDialogOpen(false);
    setMobileMenuOpen(false);
  }, [setState]);

  // ─── Dashboard Stats ───────────────────────────────────────────

  const totalSheep = state.feedSections.reduce((sum, s) => sum + s.count, 0);
  const confirmedPregnancies = state.pregnancies.filter(
    (r) =>
      (r.firstExamResult === 'yes' && r.expectedBirthDate) ||
      (r.firstExamResult === 'no' && r.secondExamResult === 'yes' && r.expectedBirthDate),
  ).length;
  const totalBirths = state.births.length;
  const activeDiseases = state.diseases.filter(
    (r) => r.suggestedTreatment && !r.followUp,
  ).length;
  const overdueVaccinations = state.vaccinations.filter((r) => {
    if (!r.nextDueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(r.nextDueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  }).length;

  // ─── Color helper ──────────────────────────────────────────────

  const getTabColorClasses = (color: string, active: boolean) => {
    if (!active) return 'text-muted-foreground hover:text-foreground';
    const map: Record<string, string> = {
      emerald: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-700',
      rose: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-700',
      sky: 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-700',
      amber: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-700',
      violet: 'text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-700',
      teal: 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-700',
      orange: 'text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-700',
      lime: 'text-lime-700 dark:text-lime-300 bg-lime-50 dark:bg-lime-950/30 border-lime-200 dark:border-lime-700',
      pink: 'text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-700',
    };
    return map[color] || 'text-foreground bg-muted border-border';
  };

  // Don't render until client-side hydration is complete
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="size-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Fence className="size-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">الحظيرة</p>
          <div className="h-1 w-32 bg-emerald-200 dark:bg-emerald-800 rounded-full overflow-hidden skeleton-shimmer">
            <div className="h-full w-1/2 bg-emerald-500 rounded-full animate-[loading_1.5s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background gradient-mesh-enhanced noise-overlay">
      {/* ═══ Decorative Top Accent Bar ═══ */}
      <div className="h-1 bg-gradient-to-l from-emerald-500 via-teal-400 to-emerald-600" />
      {/* ═══════════════════════════════════════════════════════════
          HEADER
          ═══════════════════════════════════════════════════════════ */}
      <header className="no-print sticky top-0 z-50 border-b glass-header accent-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo + Title */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700 opacity-60 blur-[3px] animate-pulse" />
                <div className="relative size-10 rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-200 animate-breathe">
                  <Fence className="size-5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gradient-animated">
                  الحظيرة
                </h1>
                <p className="text-[10px] text-muted-foreground -mt-0.5 hidden sm:block">
                  نظام إدارة حظيرة الأغنام
                </p>
              </div>
            </div>

            {/* Desktop Quick Stats + Data Actions */}
            <div className="hidden lg:flex items-center gap-3">
              <QuickStat
                icon={<Baby className="size-3.5" />}
                label="حوامل مؤكدة"
                value={confirmedPregnancies}
                color="emerald"
              />
              <QuickStat
                icon={<Sprout className="size-3.5" />}
                label="المواليد"
                value={totalBirths}
                color="sky"
              />
              <QuickStat
                icon={<HeartPulse className="size-3.5" />}
                label="أمراض نشطة"
                value={activeDiseases}
                color="rose"
              />
              <QuickStat
                icon={<Fence className="size-3.5" />}
                label="إجمالي الأغنام"
                value={totalSheep}
                color="amber"
              />
              <QuickStat
                icon={<Syringe className="size-3.5" />}
                label="تحصينات متأخرة"
                value={overdueVaccinations}
                color="violet"
              />

              <Separator orientation="vertical" className="h-6" />

              <Button
                variant="ghost"
                size="icon"
                onClick={exportData}
                className="text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                title="تصدير البيانات"
              >
                <Download className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                title="استيراد البيانات"
              >
                <Upload className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setClearDialogOpen(true)}
                className="text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                title="مسح البيانات"
              >
                <Trash2 className="size-4" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.print()}
                className="text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                title="طباعة التقرير"
              >
                <Printer className="size-4" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSettingsOpen(true)}
                className="text-muted-foreground hover:text-foreground hover:bg-muted"
                title="الإعدادات"
              >
                <Settings className="size-4" />
              </Button>
            </div>

            {/* Global Search */}
            <div className="no-print">
              <GlobalSearch
                pregnancies={state.pregnancies}
                diseases={state.diseases}
                births={state.births}
                feedSections={state.feedSections}
                vaccinations={state.vaccinations}
                sheepProfiles={state.sheepProfiles}
                weightRecords={state.weightRecords}
                financialRecords={state.financialRecords}
                onNavigateToTab={(tab) => {
                  setActiveTab(tab);
                  setMobileMenuOpen(false);
                }}
              />
            </div>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="تبديل المظهر"
              className="no-print text-muted-foreground hover:text-foreground"
            >
              {resolvedTheme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="no-print lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="القائمة"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Quick Stats + Data Actions (collapsible) */}
        {mobileMenuOpen && (
          <div className="no-print border-t bg-muted/30 px-4 py-3 lg:hidden">
            <div className="grid grid-cols-2 gap-2">
              <QuickStat
                icon={<Baby className="size-3.5" />}
                label="حوامل مؤكدة"
                value={confirmedPregnancies}
                color="emerald"
              />
              <QuickStat
                icon={<Sprout className="size-3.5" />}
                label="المواليد"
                value={totalBirths}
                color="sky"
              />
              <QuickStat
                icon={<HeartPulse className="size-3.5" />}
                label="أمراض نشطة"
                value={activeDiseases}
                color="rose"
              />
              <QuickStat
                icon={<Fence className="size-3.5" />}
                label="إجمالي الأغنام"
                value={totalSheep}
                color="amber"
              />
              <QuickStat
                icon={<Syringe className="size-3.5" />}
                label="تحصينات متأخرة"
                value={overdueVaccinations}
                color="violet"
              />
            </div>

            <Separator className="my-3" />

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportData}
                className="flex-1 gap-2 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              >
                <Download className="size-4" />
                تصدير
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 gap-2 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              >
                <Upload className="size-4" />
                استيراد
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setClearDialogOpen(true)}
                className="flex-1 gap-2 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <Trash2 className="size-4" />
                مسح البيانات
              </Button>
            </div>

            <Separator className="my-3" />

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="flex-1 gap-2 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              >
                <Printer className="size-4" />
                طباعة التقرير
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* ═══════════════════════════════════════════════════════════
          MAIN CONTENT
          ═══════════════════════════════════════════════════════════ */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 pb-24 lg:pb-6">
        {/* ── Dashboard Overview Cards ─────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 stagger-blur">
          <DashboardCard
            icon={<Baby className="size-5 text-emerald-600 dark:text-emerald-400" />}
            label="متابعة الحمل"
            value={state.pregnancies.length}
            sub={`${confirmedPregnancies} حمل مؤكد`}
            color="emerald"
            onClick={() => setActiveTab('pregnancy')}
          />
          <DashboardCard
            icon={<HeartPulse className="size-5 text-rose-600 dark:text-rose-400" />}
            label="الأمراض"
            value={state.diseases.length}
            sub={`${activeDiseases} حالة نشطة`}
            color="rose"
            onClick={() => setActiveTab('diseases')}
          />
          <DashboardCard
            icon={<Sprout className="size-5 text-sky-600 dark:text-sky-400" />}
            label="المواليد"
            value={totalBirths}
            sub={`${state.births.filter(b => b.gender === 'male').length} ذكور / ${state.births.filter(b => b.gender === 'female').length} إناث`}
            color="sky"
            onClick={() => setActiveTab('births')}
          />
          <DashboardCard
            icon={<Package className="size-5 text-amber-600 dark:text-amber-400" />}
            label="الأعلاف"
            value={state.feedSections.length}
            sub={`${totalSheep} رأس إجمالي`}
            color="amber"
            onClick={() => setActiveTab('feed')}
          />
        </div>

        {/* ── Second Dashboard Row (Vaccinations, Profiles, Financial, Weight, Milk) ── */}
        <div className="hidden md:grid grid-cols-5 gap-3 mb-6 stagger-blur">
          <DashboardCard
            icon={<Syringe className="size-5 text-violet-600 dark:text-violet-400" />}
            label="التحصينات"
            value={state.vaccinations.length}
            sub={`${overdueVaccinations} تحصين متأخر`}
            color="violet"
            onClick={() => setActiveTab('vaccinations')}
          />
          <DashboardCard
            icon={<User className="size-5 text-teal-600 dark:text-teal-400" />}
            label="سجل الأغنام"
            value={state.sheepProfiles.length}
            sub={`${totalSheep} رأس مسجل`}
            color="teal"
            onClick={() => setActiveTab('profiles')}
          />
          <DashboardCard
            icon={<Wallet className="size-5 text-orange-600 dark:text-orange-400" />}
            label="المالية"
            value={`${state.financialRecords.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0).toLocaleString('ar-SA')} ر.س`}
            sub={`${state.financialRecords.length} سجل`}
            color="orange"
            onClick={() => setActiveTab('financial')}
          />
          <DashboardCard
            icon={<Scale className="size-5 text-lime-600 dark:text-lime-400" />}
            label="الأوزان"
            value={state.weightRecords.length > 0 ? `${state.weightRecords.reduce((s, r) => s + r.weight, 0) / state.weightRecords.length} كجم` : '—'}
            sub={`${state.weightRecords.length} سجل`}
            color="lime"
            onClick={() => setActiveTab('weight')}
          />
          <DashboardCard
            icon={<Droplets className="size-5 text-pink-600 dark:text-pink-400" />}
            label="إنتاج الألبان"
            value={state.milkRecords.length > 0 ? `${state.milkRecords.reduce((s, r) => s + r.totalAmount, 0).toFixed(1)} لتر` : '—'}
            sub={`${state.milkRecords.length} سجل`}
            color="pink"
            onClick={() => setActiveTab('milk')}
          />
        </div>

        {/* ── Welcome / Onboarding Panel ──────────────────── */}
        <WelcomePanel
          totalRecords={state.pregnancies.length + state.diseases.length + state.births.length + state.feedSections.length + state.vaccinations.length}
          onNavigateToTab={(tab) => setActiveTab(tab as TabValue)}
        />

        {/* ── Alerts & Notifications ────────────────────────── */}
        <div className="mb-6">
          <AlertsPanel
            pregnancies={state.pregnancies}
            diseases={state.diseases}
            vaccinations={state.vaccinations}
            weightRecords={state.weightRecords}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        </div>

        {/* ── Activity Timeline ────────────────────────────── */}
        <div className="mb-6">
          <ActivityTimeline />
        </div>

        {/* ── Calendar Timeline ────────────────────────────── */}
        <div className="mb-6">
          <CalendarTimeline
            pregnancies={state.pregnancies}
            diseases={state.diseases}
            births={state.births}
            vaccinations={state.vaccinations}
            financialRecords={state.financialRecords}
          />
        </div>

        {/* ── Statistics Overview ────────────────────────────── */}
        <div className="mb-6">
          <StatisticsPanel
            pregnancies={state.pregnancies}
            diseases={state.diseases}
            births={state.births}
            feedSections={state.feedSections}
            vaccinations={state.vaccinations}
            sheepProfiles={state.sheepProfiles}
            weightRecords={state.weightRecords}
            financialRecords={state.financialRecords}
          />
        </div>

        {/* ── Tabs ─────────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={(v) => {
          setActiveTab(v as TabValue);
          setMobileMenuOpen(false);
        }}>
          {/* Desktop Tabs */}
          <TabsList className="no-print hidden sm:inline-flex h-auto bg-muted/50 p-1 rounded-xl mb-6">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.value;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={`
                    flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium
                    transition-all duration-200 data-[state=active]:shadow-sm
                    ${getTabColorClasses(tab.color, isActive)}
                  `}
                >
                  <tab.icon className="size-4" />
                  {tab.label}
                  {tab.value === 'pregnancy' && state.pregnancies.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ms-1">
                      {state.pregnancies.length}
                    </Badge>
                  )}
                  {tab.value === 'diseases' && state.diseases.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ms-1">
                      {state.diseases.length}
                    </Badge>
                  )}
                  {tab.value === 'births' && state.births.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ms-1">
                      {state.births.length}
                    </Badge>
                  )}
                  {tab.value === 'feed' && state.feedSections.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ms-1">
                      {state.feedSections.length}
                    </Badge>
                  )}
                  {tab.value === 'vaccinations' && state.vaccinations.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ms-1">
                      {state.vaccinations.length}
                    </Badge>
                  )}
                  {tab.value === 'profiles' && state.sheepProfiles.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ms-1">
                      {state.sheepProfiles.length}
                    </Badge>
                  )}
                  {tab.value === 'financial' && state.financialRecords.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ms-1">
                      {state.financialRecords.length}
                    </Badge>
                  )}
                  {tab.value === 'weight' && state.weightRecords.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ms-1">
                      {state.weightRecords.length}
                    </Badge>
                  )}
                  {tab.value === 'milk' && state.milkRecords.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ms-1">
                      {state.milkRecords.length}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Mobile Tabs (Scrollable horizontal) */}
          <div className="no-print sm:hidden mb-6 overflow-x-auto -mx-4 px-4">
            <div className="flex gap-2 pb-2">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={`
                      flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium
                      whitespace-nowrap border transition-all duration-200 shrink-0
                      ${getTabColorClasses(tab.color, isActive)}
                    `}
                  >
                    <tab.icon className="size-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <TabsContent value="pregnancy" className="mt-0 animate-fade-in-up">
            <PregnancyTracker
              records={state.pregnancies}
              onRecordsChange={handlePregnanciesChange}
              onBirthsGenerated={handleBirthsGenerated}
            />
          </TabsContent>

          <TabsContent value="diseases" className="mt-0 animate-fade-in-up">
            <DiseasesManager
              records={state.diseases}
              onRecordsChange={handleDiseasesChange}
            />
          </TabsContent>

          <TabsContent value="births" className="mt-0 animate-fade-in-up">
            <BirthsManager
              records={state.births}
              onRecordsChange={handleBirthsChange}
            />
          </TabsContent>

          <TabsContent value="feed" className="mt-0 animate-fade-in-up">
            <FeedManager
              sections={state.feedSections}
              onSectionsChange={handleFeedSectionsChange}
            />
          </TabsContent>

          <TabsContent value="vaccinations" className="mt-0 animate-fade-in-up">
            <VaccinationTracker
              records={state.vaccinations}
              onRecordsChange={handleVaccinationsChange}
            />
          </TabsContent>

          <TabsContent value="profiles" className="mt-0 animate-fade-in-up">
            <SheepProfiles
              profiles={state.sheepProfiles}
              onProfilesChange={handleSheepProfilesChange}
              pregnancies={state.pregnancies}
              diseases={state.diseases}
              births={state.births}
              feedSections={state.feedSections}
              vaccinations={state.vaccinations}
            />
          </TabsContent>

          <TabsContent value="financial" className="mt-0 animate-fade-in-up">
            <FinancialTracker
              records={state.financialRecords}
              onRecordsChange={handleFinancialRecordsChange}
            />
          </TabsContent>

          <TabsContent value="weight" className="mt-0 animate-fade-in-up">
            <WeightTracker
              records={state.weightRecords}
              onRecordsChange={handleWeightRecordsChange}
            />
          </TabsContent>

          <TabsContent value="milk" className="mt-0 animate-fade-in-up">
            <MilkProduction
              records={state.milkRecords}
              onRecordsChange={handleMilkRecordsChange}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* ═══════════════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════════════ */}

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImportFile(file);
          e.target.value = '';
        }}
      />

      {/* Clear Data Confirmation Dialog */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>مسح جميع البيانات</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من مسح جميع البيانات؟ سيتم حذف سجلات الحمل والأمراض والمواليد والأعلاف والتحصينات وملفات الأغنام والسجلات المالية وسجلات الأوزان بالكامل. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={clearAllData}
              className="bg-rose-600 hover:bg-rose-700"
            >
              نعم، مسح الكل
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Data Confirmation Dialog */}
      <AlertDialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>استيراد البيانات</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم استبدال جميع البيانات الحالية بالبيانات المستوردة. هل تريد المتابعة؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmImport}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              نعم، استيراد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══════════════════════════════════════════════════════════
          SETTINGS SHEET
          ═══════════════════════════════════════════════════════════ */}
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto scrollbar-enhanced">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Settings className="size-5 text-emerald-600 dark:text-emerald-400" />
              الإعدادات
            </SheetTitle>
            <SheetDescription>تخصيص إعدادات التطبيق وإدارة البيانات</SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <SettingsPanel
              onExportData={() => { exportData(); setSettingsOpen(false); }}
              onImportData={() => { fileInputRef.current?.click(); setSettingsOpen(false); }}
              onClearData={() => { setSettingsOpen(false); setClearDialogOpen(true); }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* ═══════════════════════════════════════════════════════════
          FLOATING ACTION BUTTON (FAB)
          ═══════════════════════════════════════════════════════════ */}
      <div className="no-print fixed bottom-6 left-6 z-40 animate-fab-bounce">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              className="size-14 rounded-full bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:via-emerald-500 hover:to-teal-500 text-white shadow-lg hover:scale-110 transition-all duration-200 fab-shadow border-glow hover:shadow-xl"
              size="icon"
              aria-label="إضافة سريعة"
            >
              <Plus className="size-6" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" align="end" className="w-56 p-2">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground px-2 py-1">إضافة سريعة</p>
              <button
                onClick={() => { setActiveTab('pregnancy'); }}
                className="flex items-center gap-3 w-full rounded-lg px-2 py-2 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors text-right"
              >
                <div className="size-7 rounded-md bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                  <Baby className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span>إضافة حمل جديد</span>
              </button>
              <button
                onClick={() => { setActiveTab('diseases'); }}
                className="flex items-center gap-3 w-full rounded-lg px-2 py-2 text-sm hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-right"
              >
                <div className="size-7 rounded-md bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center shrink-0">
                  <HeartPulse className="size-3.5 text-rose-600 dark:text-rose-400" />
                </div>
                <span>تسجيل مرض جديد</span>
              </button>
              <button
                onClick={() => { setActiveTab('births'); }}
                className="flex items-center gap-3 w-full rounded-lg px-2 py-2 text-sm hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-colors text-right"
              >
                <div className="size-7 rounded-md bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center shrink-0">
                  <Sprout className="size-3.5 text-sky-600 dark:text-sky-400" />
                </div>
                <span>تسجيل ميلاد جديد</span>
              </button>
              <button
                onClick={() => { setActiveTab('feed'); }}
                className="flex items-center gap-3 w-full rounded-lg px-2 py-2 text-sm hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors text-right"
              >
                <div className="size-7 rounded-md bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                  <Package className="size-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <span>إضافة قسم أعلاف</span>
              </button>
              <button
                onClick={() => { setActiveTab('vaccinations'); }}
                className="flex items-center gap-3 w-full rounded-lg px-2 py-2 text-sm hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors text-right"
              >
                <div className="size-7 rounded-md bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
                  <Syringe className="size-3.5 text-violet-600 dark:text-violet-400" />
                </div>
                <span>إضافة تحصين</span>
              </button>
              <button
                onClick={() => { setActiveTab('profiles'); }}
                className="flex items-center gap-3 w-full rounded-lg px-2 py-2 text-sm hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors text-right"
              >
                <div className="size-7 rounded-md bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0">
                  <User className="size-3.5 text-teal-600 dark:text-teal-400" />
                </div>
                <span>إضافة ملف أغنام</span>
              </button>
              <button
                onClick={() => { setActiveTab('financial'); }}
                className="flex items-center gap-3 w-full rounded-lg px-2 py-2 text-sm hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors text-right"
              >
                <div className="size-7 rounded-md bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0">
                  <Wallet className="size-3.5 text-orange-600 dark:text-orange-400" />
                </div>
                <span>إضافة سجل مالي</span>
              </button>
              <button
                onClick={() => { setActiveTab('milk'); }}
                className="flex items-center gap-3 w-full rounded-lg px-2 py-2 text-sm hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-colors text-right"
              >
                <div className="size-7 rounded-md bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center shrink-0">
                  <Droplets className="size-3.5 text-pink-600 dark:text-pink-400" />
                </div>
                <span>تسجيل إنتاج ألبان</span>
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* ═══ Quick Notes Section ═══ */}
      <div className="mb-6">
        <QuickNotes />
      </div>

      {/* ═══ Production Report ═══ */}
      <div className="mb-6">
        <ProductionReport
          pregnancies={state.pregnancies}
          diseases={state.diseases}
          births={state.births}
          feedSections={state.feedSections}
          vaccinations={state.vaccinations}
          financialRecords={state.financialRecords}
          sheepProfiles={state.sheepProfiles}
          weightRecords={state.weightRecords}
        />
      </div>

      {/* ═══ Enhanced Footer ═══ */}
      <EnhancedFooter
        onNavigateToTab={(tab) => setActiveTab(tab as TabValue)}
        totalPregnancies={state.pregnancies.length}
        totalBirths={state.births.length}
        totalDiseases={state.diseases.length}
        totalVaccinations={state.vaccinations.length}
      />

      {/* ═══ Mobile Bottom Navigation ═══ */}
      <MobileBottomNav
        activeTab={activeTab}
        onNavigateToTab={(tab) => setActiveTab(tab as TabValue)}
        onExport={exportData}
        onImport={() => fileInputRef.current?.click()}
        onSettings={() => setSettingsOpen(true)}
        className="pb-safe lg:hidden"
      />
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────

function QuickStat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  const bgMap: Record<string, string> = {
    emerald: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-800',
    rose: 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-800',
    sky: 'bg-sky-50 dark:bg-sky-950/20 border-sky-100 dark:border-sky-800',
    amber: 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-800',
    violet: 'bg-violet-50 dark:bg-violet-950/20 border-violet-100 dark:border-violet-800',
    teal: 'bg-teal-50 dark:bg-teal-950/20 border-teal-100 dark:border-teal-800',
    orange: 'bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-800',
  };
  const iconMap: Record<string, string> = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    rose: 'text-rose-600 dark:text-rose-400',
    sky: 'text-sky-600 dark:text-sky-400',
    amber: 'text-amber-600 dark:text-amber-400',
    violet: 'text-violet-600 dark:text-violet-400',
    teal: 'text-teal-600 dark:text-teal-400',
    orange: 'text-orange-600 dark:text-orange-400',
  };
  const valueMap: Record<string, string> = {
    emerald: 'text-emerald-700 dark:text-emerald-300',
    rose: 'text-rose-700 dark:text-rose-300',
    sky: 'text-sky-700 dark:text-sky-300',
    amber: 'text-amber-700 dark:text-amber-300',
    violet: 'text-violet-700 dark:text-violet-300',
    teal: 'text-teal-700 dark:text-teal-300',
    orange: 'text-orange-700 dark:text-orange-300',
  };

  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 ${bgMap[color] || ''}`}>
      <span className={iconMap[color]}>{icon}</span>
      <div className="flex items-baseline gap-1">
        <span className={`text-sm font-bold tabular-nums animate-count-up number-glow ${valueMap[color]}`}>{value}</span>
        <span className="text-[10px] text-muted-foreground hidden xl:inline">{label}</span>
      </div>
    </div>
  );
}

function DashboardCard({
  icon,
  label,
  value,
  sub,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub: string;
  color: string;
  onClick: () => void;
}) {
  const bgMap: Record<string, string> = {
    emerald: 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30',
    rose: 'bg-rose-50/80 dark:bg-rose-950/20 border-rose-100 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/30',
    sky: 'bg-sky-50/80 dark:bg-sky-950/20 border-sky-100 dark:border-sky-800 hover:bg-sky-50 dark:hover:bg-sky-950/30',
    amber: 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-100 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/30',
    violet: 'bg-violet-50/80 dark:bg-violet-950/20 border-violet-100 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-950/30',
    teal: 'bg-teal-50/80 dark:bg-teal-950/20 border-teal-100 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950/30',
    orange: 'bg-orange-50/80 dark:bg-orange-950/20 border-orange-100 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-950/30',
    lime: 'bg-lime-50/80 dark:bg-lime-950/20 border-lime-100 dark:border-lime-800 hover:bg-lime-50 dark:hover:bg-lime-950/30',
  };
  const gradientMap: Record<string, string> = {
    emerald: 'stat-card-gradient-emerald',
    rose: 'stat-card-gradient-rose',
    sky: 'stat-card-gradient-sky',
    amber: 'stat-card-gradient-amber',
    violet: 'stat-card-gradient-violet',
    teal: 'stat-card-gradient-teal',
    orange: 'stat-card-gradient-orange',
    lime: 'stat-card-gradient-lime',
  };
  const iconBgMap: Record<string, string> = {
    emerald: 'bg-gradient-to-br from-emerald-100 to-emerald-200/60 dark:from-emerald-900/40 dark:to-emerald-800/30',
    rose: 'bg-gradient-to-br from-rose-100 to-rose-200/60 dark:from-rose-900/40 dark:to-rose-800/30',
    sky: 'bg-gradient-to-br from-sky-100 to-sky-200/60 dark:from-sky-900/40 dark:to-sky-800/30',
    amber: 'bg-gradient-to-br from-amber-100 to-amber-200/60 dark:from-amber-900/40 dark:to-amber-800/30',
    violet: 'bg-gradient-to-br from-violet-100 to-violet-200/60 dark:from-violet-900/40 dark:to-violet-800/30',
    teal: 'bg-gradient-to-br from-teal-100 to-teal-200/60 dark:from-teal-900/40 dark:to-teal-800/30',
    orange: 'bg-gradient-to-br from-orange-100 to-orange-200/60 dark:from-orange-900/40 dark:to-orange-800/30',
    lime: 'bg-gradient-to-br from-lime-100 to-lime-200/60 dark:from-lime-900/40 dark:to-lime-800/30',
  };

  return (
    <Card
      className={`cursor-pointer card-depth card-border-transition glass-card-enhanced hover-lift-enhanced animate-slide-up-fade shine-hover glow-border-emerald card-shimmer-hover ${bgMap[color]} ${gradientMap[color] || ''} animate-gradient-shift`}
      onClick={onClick}
    >
      <CardContent className="p-4 relative overflow-hidden">
        {/* Decorative dot pattern in top-right corner */}
        <div className="absolute -top-4 -left-4 size-16 rounded-full opacity-[0.03] dark:opacity-[0.04] pattern-dots" />
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 rounded-lg p-2 ${iconBgMap[color] || ''}`}>{icon}</div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
            <p className={`text-2xl font-bold tabular-nums mt-0.5 ${typeof value === 'number' ? '' : 'text-lg'}`}>{value}</p>
            <p className="text-[10px] text-muted-foreground mt-1 truncate">{sub}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
