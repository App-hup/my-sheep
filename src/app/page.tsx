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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Baby,
  HeartPulse,
  Package,
  Sprout,
  Syringe,
  Fence,
  Sun,
  Moon,
  Settings,
  User,
  Wallet,
  CalendarDays,
  Scale,
  Droplets,
  Bell,
} from 'lucide-react';
import { useTheme } from 'next-themes';

import PregnancyTracker from '@/components/pregnancy-tracker';
import DiseasesManager from '@/components/diseases-manager';
import BirthsManager from '@/components/births-manager';
import FeedManager from '@/components/feed-manager';
import GlobalSearch from '@/components/global-search';
import CalendarTimeline from '@/components/calendar-timeline';
import SettingsPanel from '@/components/settings-panel';
import VaccinationTracker from '@/components/vaccination-tracker';
import SheepProfiles from '@/components/sheep-profiles';
import FinancialTracker from '@/components/financial-tracker';
import WeightTracker from '@/components/weight-tracker';
import MilkProduction from '@/components/milk-production';
import AlertsPanel from '@/components/alerts-panel';
import { addActivity } from '@/lib/activity-log';

// ─── Tab Configuration ───────────────────────────────────────────

const TABS = [
  { value: 'pregnancy', label: 'الحمل', icon: Baby, key: 'pregnancies' },
  { value: 'diseases', label: 'الأمراض', icon: HeartPulse, key: 'diseases' },
  { value: 'births', label: 'المواليد', icon: Sprout, key: 'births' },
  { value: 'feed', label: 'الأعلاف', icon: Package, key: 'feedSections' },
  { value: 'vaccinations', label: 'التحصينات', icon: Syringe, key: 'vaccinations' },
  { value: 'profiles', label: 'الأغنام', icon: User, key: 'sheepProfiles' },
  { value: 'financial', label: 'المالية', icon: Wallet, key: 'financialRecords' },
  { value: 'weight', label: 'الأوزان', icon: Scale, key: 'weightRecords' },
  { value: 'milk', label: 'الألبان', icon: Droplets, key: 'milkRecords' },
  { value: 'calendar', label: 'التقويم', icon: CalendarDays, key: null },
] as const;

type TabValue = (typeof TABS)[number]['value'];

// ─── Custom hook for localStorage state ──────────────────────────

function useLocalState(): [AppState, React.Dispatch<React.SetStateAction<AppState>>, boolean] {
  const [state, setState] = useState<AppState>(DEFAULT_APP_STATE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(loadState());
    setMounted(true);
  }, []);

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
  const [state, setState, mounted] = useLocalState();
  const { setTheme, resolvedTheme } = useTheme();
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<AppState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Handlers ──────────────────────────────────────────────────

  const handlePregnanciesChange = useCallback((records: PregnancyRecord[]) => {
    setState((prev) => {
      const prevIds = new Set(prev.pregnancies.map((r) => r.id));
      const newIds = new Set(records.map((r) => r.id));
      const added = records.filter((r) => !prevIds.has(r.id));
      const removed = prev.pregnancies.filter((r) => !newIds.has(r.id));
      if (added.length > 0) addActivity({ type: 'pregnancy', action: 'create', description: `إضافة سجل حمل جديد` });
      if (removed.length > 0) addActivity({ type: 'pregnancy', action: 'delete', description: `حذف سجل حمل` });
      if (added.length === 0 && removed.length === 0 && records.length > 0) addActivity({ type: 'pregnancy', action: 'update', description: `تعديل سجل حمل` });
      return { ...prev, pregnancies: records };
    });
  }, [setState]);

  const handleDiseasesChange = useCallback((records: DiseaseRecord[]) => {
    setState((prev) => {
      const prevIds = new Set(prev.diseases.map((r) => r.id));
      const newIds = new Set(records.map((r) => r.id));
      const added = records.filter((r) => !prevIds.has(r.id));
      const removed = prev.diseases.filter((r) => !newIds.has(r.id));
      if (added.length > 0) addActivity({ type: 'disease', action: 'create', description: `إضافة سجل مرض جديد` });
      if (removed.length > 0) addActivity({ type: 'disease', action: 'delete', description: `حذف سجل مرض` });
      if (added.length === 0 && removed.length === 0 && records.length > 0) addActivity({ type: 'disease', action: 'update', description: `تعديل سجل مرض` });
      return { ...prev, diseases: records };
    });
  }, [setState]);

  const handleBirthsChange = useCallback((records: BirthRecord[]) => {
    setState((prev) => {
      const prevIds = new Set(prev.births.map((r) => r.id));
      const newIds = new Set(records.map((r) => r.id));
      const added = records.filter((r) => !prevIds.has(r.id));
      const removed = prev.births.filter((r) => !newIds.has(r.id));
      if (added.length > 0) addActivity({ type: 'birth', action: 'create', description: `إضافة سجل ميلاد جديد` });
      if (removed.length > 0) addActivity({ type: 'birth', action: 'delete', description: `حذف سجل ميلاد` });
      return { ...prev, births: records };
    });
  }, [setState]);

  const handleFeedSectionsChange = useCallback((sections: FeedSection[]) => {
    setState((prev) => {
      const prevIds = new Set(prev.feedSections.map((s) => s.id));
      const newIds = new Set(sections.map((s) => s.id));
      const added = sections.filter((s) => !prevIds.has(s.id));
      const removed = prev.feedSections.filter((s) => !newIds.has(s.id));
      if (added.length > 0) addActivity({ type: 'feed', action: 'create', description: `إضافة قسم أعلاف جديد` });
      if (removed.length > 0) addActivity({ type: 'feed', action: 'delete', description: `حذف قسم أعلاف` });
      if (added.length === 0 && removed.length === 0 && sections.length > 0) addActivity({ type: 'feed', action: 'update', description: `تعديل قسم أعلاف` });
      return { ...prev, feedSections: sections };
    });
  }, [setState]);

  const handleSheepProfilesChange = useCallback((profiles: SheepProfile[]) => {
    setState((prev) => {
      const prevIds = new Set(prev.sheepProfiles.map((r) => r.id));
      const newIds = new Set(profiles.map((r) => r.id));
      const added = profiles.filter((r) => !prevIds.has(r.id));
      const removed = prev.sheepProfiles.filter((r) => !newIds.has(r.id));
      if (added.length > 0) addActivity({ type: 'data', action: 'create', description: `إضافة ملف أغنام جديد` });
      if (removed.length > 0) addActivity({ type: 'data', action: 'delete', description: `حذف ملف أغنام` });
      if (added.length === 0 && removed.length === 0 && profiles.length > 0) addActivity({ type: 'data', action: 'update', description: `تعديل ملف أغنام` });
      return { ...prev, sheepProfiles: profiles };
    });
  }, [setState]);

  const handleVaccinationsChange = useCallback((records: VaccinationRecord[]) => {
    setState((prev) => {
      const prevIds = new Set(prev.vaccinations.map((r) => r.id));
      const newIds = new Set(records.map((r) => r.id));
      const added = records.filter((r) => !prevIds.has(r.id));
      const removed = prev.vaccinations.filter((r) => !newIds.has(r.id));
      if (added.length > 0) addActivity({ type: 'vaccination', action: 'create', description: `إضافة سجل تحصين جديد` });
      if (removed.length > 0) addActivity({ type: 'vaccination', action: 'delete', description: `حذف سجل تحصين` });
      if (added.length === 0 && removed.length === 0 && records.length > 0) addActivity({ type: 'vaccination', action: 'update', description: `تعديل سجل تحصين` });
      return { ...prev, vaccinations: records };
    });
  }, [setState]);

  const handleFinancialRecordsChange = useCallback((records: FinancialRecord[]) => {
    setState((prev) => {
      const prevIds = new Set(prev.financialRecords.map((r) => r.id));
      const newIds = new Set(records.map((r) => r.id));
      const added = records.filter((r) => !prevIds.has(r.id));
      const removed = prev.financialRecords.filter((r) => !newIds.has(r.id));
      if (added.length > 0) addActivity({ type: 'data', action: 'create', description: `إضافة سجل مالي` });
      if (removed.length > 0) addActivity({ type: 'data', action: 'delete', description: `حذف سجل مالي` });
      if (added.length === 0 && removed.length === 0 && records.length > 0) addActivity({ type: 'data', action: 'update', description: `تعديل سجل مالي` });
      return { ...prev, financialRecords: records };
    });
  }, [setState]);

  const handleMilkRecordsChange = useCallback((records: MilkRecord[]) => {
    setState((prev) => {
      const prevIds = new Set(prev.milkRecords.map((r) => r.id));
      const newIds = new Set(records.map((r) => r.id));
      const added = records.filter((r) => !prevIds.has(r.id));
      const removed = prev.milkRecords.filter((r) => !newIds.has(r.id));
      if (added.length > 0) addActivity({ type: 'data', action: 'create', description: `تسجيل إنتاج ألبان` });
      if (removed.length > 0) addActivity({ type: 'data', action: 'delete', description: `حذف سجل إنتاج ألبان` });
      if (added.length === 0 && removed.length === 0 && records.length > 0) addActivity({ type: 'data', action: 'update', description: `تعديل سجل إنتاج ألبان` });
      return { ...prev, milkRecords: records };
    });
  }, [setState]);

  const handleWeightRecordsChange = useCallback((records: WeightRecord[]) => {
    setState((prev) => {
      const prevIds = new Set(prev.weightRecords.map((r) => r.id));
      const newIds = new Set(records.map((r) => r.id));
      const added = records.filter((r) => !prevIds.has(r.id));
      const removed = prev.weightRecords.filter((r) => !newIds.has(r.id));
      if (added.length > 0) addActivity({ type: 'data', action: 'create', description: `تسجيل وزن جديد` });
      if (removed.length > 0) addActivity({ type: 'data', action: 'delete', description: `حذف سجل وزن` });
      if (added.length === 0 && removed.length === 0 && records.length > 0) addActivity({ type: 'data', action: 'update', description: `تعديل سجل وزن` });
      return { ...prev, weightRecords: records };
    });
  }, [setState]);

  const handleBirthsGenerated = useCallback((newBirths: BirthRecord[]) => {
    setState((prev) => {
      addActivity({ type: 'birth', action: 'create', description: `تسجيل ولادة من سجل حمل` });
      return { ...prev, births: [...prev.births, ...newBirths] };
    });
  }, [setState]);

  // ─── Data Export / Import / Clear ──────────────────────────────

  const exportData = useCallback(() => {
    const data = localStorage.getItem('alhazira_data');
    if (!data) { toast.error('لا توجد بيانات للتصدير'); return; }
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alhazira-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('تم تصدير البيانات بنجاح');
    addActivity({ type: 'data', action: 'export', description: 'تصدير نسخة احتياطية' });
  }, []);

  const handleImportFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!data.pregnancies || !data.diseases || !data.births || !data.feedSections || !data.vaccinations || !data.sheepProfiles || !data.financialRecords || !data.weightRecords || !data.milkRecords) {
          toast.error('ملف غير صالح'); return;
        }
        setPendingImportData(data);
        setImportDialogOpen(true);
      } catch { toast.error('خطأ في قراءة الملف'); }
    };
    reader.readAsText(file);
  }, []);

  const confirmImport = useCallback(() => {
    if (pendingImportData) {
      setState(pendingImportData);
      toast.success('تم استيراد البيانات بنجاح');
      addActivity({ type: 'data', action: 'import', description: 'استيراد بيانات' });
      setPendingImportData(null);
      setImportDialogOpen(false);
    }
  }, [pendingImportData, setState]);

  const clearAllData = useCallback(() => {
    setState(DEFAULT_APP_STATE);
    toast.success('تم مسح جميع البيانات');
    addActivity({ type: 'data', action: 'clear', description: 'مسح جميع البيانات' });
    setClearDialogOpen(false);
  }, [setState]);

  // ─── Loading state ──────────────────────────────────────────────

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Fence className="size-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">الحظيرة</p>
        </div>
      </div>
    );
  }

  // ─── Tab badge count helper ─────────────────────────────────────

  const getTabCount = (tab: (typeof TABS)[number]): number => {
    if (!tab.key) return 0;
    return (state as Record<string, unknown[]>)[tab.key]?.length ?? 0;
  };

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                <Fence className="size-4 text-white" />
              </div>
              <h1 className="text-lg font-bold text-foreground">الحظيرة</h1>
            </div>

            {/* Right: Search + Actions */}
            <div className="flex items-center gap-1">
              <GlobalSearch
                pregnancies={state.pregnancies}
                diseases={state.diseases}
                births={state.births}
                feedSections={state.feedSections}
                vaccinations={state.vaccinations}
                sheepProfiles={state.sheepProfiles}
                weightRecords={state.weightRecords}
                financialRecords={state.financialRecords}
                onNavigateToTab={(tab) => setActiveTab(tab as TabValue)}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                aria-label="تبديل المظهر"
                className="text-muted-foreground hover:text-foreground"
              >
                {resolvedTheme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSettingsOpen(true)}
                aria-label="الإعدادات"
                className="text-muted-foreground hover:text-foreground"
              >
                <Settings className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-5">
        {/* ── Minimal Alert Bar ── */}
        <MinimalAlerts
          pregnancies={state.pregnancies}
          diseases={state.diseases}
          vaccinations={state.vaccinations}
          onNavigateToTab={(tab) => setActiveTab(tab)}
        />

        {/* ── Tabs ── */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          {/* Tab Bar */}
          <div className="mb-5 overflow-x-auto -mx-4 px-4 scrollbar-hide">
            <TabsList className="h-auto bg-muted/40 p-0.5 rounded-lg inline-flex w-auto min-w-full gap-0.5">
              {TABS.map((tab) => {
                const count = getTabCount(tab);
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap"
                  >
                    <tab.icon className="size-3.5" />
                    <span>{tab.label}</span>
                    {count > 0 && (
                      <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-1.5 py-0 min-w-[18px] text-center leading-4">
                        {count}
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* Tab Content */}
          <TabsContent value="pregnancy" className="mt-0">
            <PregnancyTracker
              records={state.pregnancies}
              onRecordsChange={handlePregnanciesChange}
              onBirthsGenerated={handleBirthsGenerated}
            />
          </TabsContent>

          <TabsContent value="diseases" className="mt-0">
            <DiseasesManager
              records={state.diseases}
              onRecordsChange={handleDiseasesChange}
            />
          </TabsContent>

          <TabsContent value="births" className="mt-0">
            <BirthsManager
              records={state.births}
              onRecordsChange={handleBirthsChange}
            />
          </TabsContent>

          <TabsContent value="feed" className="mt-0">
            <FeedManager
              sections={state.feedSections}
              onSectionsChange={handleFeedSectionsChange}
            />
          </TabsContent>

          <TabsContent value="vaccinations" className="mt-0">
            <VaccinationTracker
              records={state.vaccinations}
              onRecordsChange={handleVaccinationsChange}
            />
          </TabsContent>

          <TabsContent value="profiles" className="mt-0">
            <SheepProfiles
              profiles={state.sheepProfiles}
              onProfilesChange={handleSheepProfilesChange}
              pregnancies={state.pregnancies}
              diseases={state.diseases}
              births={state.births}
              vaccinations={state.vaccinations}
              feedSections={state.feedSections}
            />
          </TabsContent>

          <TabsContent value="financial" className="mt-0">
            <FinancialTracker
              records={state.financialRecords}
              onRecordsChange={handleFinancialRecordsChange}
            />
          </TabsContent>

          <TabsContent value="weight" className="mt-0">
            <WeightTracker
              records={state.weightRecords}
              onRecordsChange={handleWeightRecordsChange}
            />
          </TabsContent>

          <TabsContent value="milk" className="mt-0">
            <MilkProduction
              records={state.milkRecords}
              onRecordsChange={handleMilkRecordsChange}
            />
          </TabsContent>

          <TabsContent value="calendar" className="mt-0">
            <CalendarTimeline
              pregnancies={state.pregnancies}
              diseases={state.diseases}
              births={state.births}
              vaccinations={state.vaccinations}
              financialRecords={state.financialRecords}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
          <p className="text-center text-xs text-muted-foreground">
            الحظيرة — نظام إدارة حظيرة الأغنام
          </p>
        </div>
      </footer>

      {/* ═══ SETTINGS SHEET ═══ */}
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>الإعدادات</SheetTitle>
          </SheetHeader>
          <div className="px-6 pb-6">
            <SettingsPanel
              onExportData={exportData}
              onImportData={() => fileInputRef.current?.click()}
              onClearData={() => { setClearDialogOpen(true); setSettingsOpen(false); }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* ═══ DIALOGS ═══ */}
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

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>مسح جميع البيانات</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={clearAllData} className="bg-destructive text-white hover:bg-destructive/90">
              حذف الكل
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>استيراد البيانات</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم استبدال جميع البيانات الحالية بالبيانات المستوردة. هل تريد المتابعة؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport}>
              استيراد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Minimal Alerts Bar ─────────────────────────────────────────

function MinimalAlerts({
  pregnancies,
  diseases,
  vaccinations,
  onNavigateToTab,
}: {
  pregnancies: PregnancyRecord[];
  diseases: DiseaseRecord[];
  vaccinations: VaccinationRecord[];
  onNavigateToTab: (tab: string) => void;
}) {
  const alerts: { label: string; tab: string; urgency: 'urgent' | 'warning' }[] = [];

  // Imminent births (<=7 days)
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  pregnancies.forEach((r) => {
    if (!r.expectedBirthDate || r.birthDate) return;
    const due = new Date(r.expectedBirthDate);
    due.setHours(0, 0, 0, 0);
    const days = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 7 && days >= 0) {
      alerts.push({ label: `ولادة وشيكة: ${r.sheepNumber} (${days === 0 ? 'اليوم' : `${days} يوم`})`, tab: 'pregnancy', urgency: 'urgent' });
    }
  });

  // Overdue vaccinations
  vaccinations.forEach((r) => {
    if (!r.nextDueDate) return;
    const due = new Date(r.nextDueDate);
    due.setHours(0, 0, 0, 0);
    if (due < now) {
      alerts.push({ label: `تحصين متأخر: ${r.sheepNumber}`, tab: 'vaccinations', urgency: 'warning' });
    }
  });

  // Pending disease follow-ups
  diseases.forEach((r) => {
    if (r.suggestedTreatment && !r.followUp) {
      alerts.push({ label: `متابعة مطلوبة: ${r.sheepNumber}`, tab: 'diseases', urgency: 'warning' });
    }
  });

  if (alerts.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {alerts.slice(0, 4).map((alert, i) => (
        <button
          key={i}
          onClick={() => onNavigateToTab(alert.tab)}
          className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1.5 transition-colors cursor-pointer ${
            alert.urgency === 'urgent'
              ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-800'
              : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/30 border border-amber-200 dark:border-amber-800'
          }`}
        >
          <Bell className="size-3" />
          {alert.label}
        </button>
      ))}
      {alerts.length > 4 && (
        <span className="text-xs text-muted-foreground py-1.5">
          +{alerts.length - 4} تنبيهات أخرى
        </span>
      )}
    </div>
  );
}
