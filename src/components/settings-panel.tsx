'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  Download,
  Upload,
  Trash2,
  Shield,
  Bell,
  Calendar,
  Database,
  Info,
  Check,
  Globe,
  Coins,
} from 'lucide-react';

// ─── Types & Constants ───────────────────────────────────────────

interface AppSettings {
  currency: string;
  dateFormat: string;
  notifyBirths: boolean;
  notifyVaccinations: boolean;
  notifyExams: boolean;
  lastExportDate: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  currency: 'ر.س',
  dateFormat: 'YYYY/MM/DD',
  notifyBirths: true,
  notifyVaccinations: true,
  notifyExams: true,
  lastExportDate: '',
};

const SETTINGS_KEY = 'alhazira_settings';
const LAST_EXPORT_KEY = 'alhazira_last_export';

const CURRENCIES = [
  { value: 'ر.س', label: 'ريال سعودي' },
  { value: 'د.إ', label: 'درهم إماراتي' },
  { value: 'د.ك', label: 'دينار كويتي' },
  { value: 'ر.ع', label: 'ريال عُماني' },
  { value: 'ر.ق', label: 'ريال قطري' },
  { value: 'ر.ب', label: 'دينار بحريني' },
] as const;

const DATE_FORMATS = [
  { value: 'YYYY/MM/DD', label: 'YYYY/MM/DD' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
] as const;

const FEATURES = [
  'متابعة الحمل والفحوصات',
  'سجل الأمراض والعلاج',
  'إدارة المواليد',
  'مراقبة الأعلاف والمخزون',
  'جدول التحصينات والتطعيمات',
  'ملفات الأغنام الشخصية',
  'التتبع المالي والمصروفات',
] as const;

// ─── Settings Utilities ──────────────────────────────────────────

function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      currency: parsed.currency ?? DEFAULT_SETTINGS.currency,
      dateFormat: parsed.dateFormat ?? DEFAULT_SETTINGS.dateFormat,
      notifyBirths: parsed.notifyBirths ?? DEFAULT_SETTINGS.notifyBirths,
      notifyVaccinations:
        parsed.notifyVaccinations ?? DEFAULT_SETTINGS.notifyVaccinations,
      notifyExams: parsed.notifyExams ?? DEFAULT_SETTINGS.notifyExams,
      lastExportDate: parsed.lastExportDate ?? '',
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    console.error('Failed to save settings to localStorage');
  }
}

function getLocalStorageSize(): string {
  if (typeof window === 'undefined') return '0';
  try {
    let total = 0;
    for (const key of Object.keys(localStorage)) {
      total += (localStorage.getItem(key) || '').length;
    }
    return (total / 1024).toFixed(1);
  } catch {
    return '0';
  }
}

function getLastExportDate(): string {
  if (typeof window === 'undefined') return '';
  try {
    const raw = localStorage.getItem(LAST_EXPORT_KEY);
    return raw || '';
  } catch {
    return '';
  }
}

function formatExportDate(dateStr: string): string {
  if (!dateStr) return 'لم يتم التصدير بعد';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

// ─── Props ───────────────────────────────────────────────────────

interface SettingsPanelProps {
  onExportData: () => void;
  onImportData: () => void;
  onClearData: () => void;
}

// ─── Section Title Sub-component ─────────────────────────────────

function SectionTitle({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex items-center justify-center size-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────

export default function SettingsPanel({
  onExportData,
  onImportData,
  onClearData,
}: SettingsPanelProps) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [storageSize, setStorageSize] = useState<string>('0');

  // Load settings on mount — standard hydration pattern for client-only state
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(loadSettings());
    setStorageSize(getLocalStorageSize());
  }, []);

  // Save settings on change
  const updateSettings = (partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  };

  // Refresh storage size and last export date periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStorageSize(getLocalStorageSize());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const lastExport = useMemo(() => getLastExportDate(), [settings.lastExportDate]);

  return (
    <section className="space-y-4">
      {/* ── Section Header ── */}
      <div className="flex items-center gap-2">
        <div className="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
          <Settings className="size-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-lg font-bold text-foreground">الإعدادات</h2>
      </div>

      {/* ── Settings Grid ── */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* ═══ Section 1: General ═══ */}
        <Card className="overflow-hidden">
          <CardContent className="p-5">
            <SectionTitle
              icon={<Globe className="size-4" />}
              title="عام"
            />

            {/* Currency */}
            <div className="space-y-2 mb-5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Coins className="size-3.5 text-emerald-500 dark:text-emerald-400" />
                العملة
              </label>
              <Select
                value={settings.currency}
                onValueChange={(val) => updateSettings({ currency: val })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر العملة" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="font-medium">{c.value}</span>
                      <span className="text-muted-foreground text-xs mr-2">
                        {c.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Format */}
            <div className="space-y-2 mb-5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5 text-emerald-500 dark:text-emerald-400" />
                صيغة التاريخ
              </label>
              <Select
                value={settings.dateFormat}
                onValueChange={(val) => updateSettings({ dateFormat: val })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر صيغة التاريخ" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FORMATS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Language (read-only) */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Globe className="size-3.5 text-emerald-500 dark:text-emerald-400" />
                اللغة
              </label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-muted/50 text-sm text-foreground">
                العربية
                <Badge variant="secondary" className="text-[10px] h-5 mr-auto">
                  الافتراضي
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══ Section 2: Notifications ═══ */}
        <Card className="overflow-hidden">
          <CardContent className="p-5">
            <SectionTitle
              icon={<Bell className="size-4" />}
              title="الإشعارات"
            />

            <div className="space-y-4">
              {/* Birth Alerts Toggle */}
              <div className="flex items-center justify-between gap-3 py-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 size-8 rounded-lg bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
                    <Bell className="size-3.5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground leading-tight">
                      تنبيهات الولادة الوشيكة
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      إشعار عند اقتراب موعد الولادة
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.notifyBirths}
                  onCheckedChange={(val) =>
                    updateSettings({ notifyBirths: val })
                  }
                  className="data-[state=checked]:bg-emerald-600 dark:data-[state=checked]:bg-emerald-500 shrink-0"
                />
              </div>

              <Separator className="opacity-60" />

              {/* Vaccination Alerts Toggle */}
              <div className="flex items-center justify-between gap-3 py-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 size-8 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                    <Shield className="size-3.5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground leading-tight">
                      تنبيهات التحصينات المتأخرة
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      إشعار عند تأخر موعد التحصين
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.notifyVaccinations}
                  onCheckedChange={(val) =>
                    updateSettings({ notifyVaccinations: val })
                  }
                  className="data-[state=checked]:bg-emerald-600 dark:data-[state=checked]:bg-emerald-500 shrink-0"
                />
              </div>

              <Separator className="opacity-60" />

              {/* Exam Alerts Toggle */}
              <div className="flex items-center justify-between gap-3 py-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 size-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                    <Calendar className="size-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground leading-tight">
                      تنبيهات الفحص المتأخر
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      إشعار عند تأخر الفحص الثاني
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.notifyExams}
                  onCheckedChange={(val) =>
                    updateSettings({ notifyExams: val })
                  }
                  className="data-[state=checked]:bg-emerald-600 dark:data-[state=checked]:bg-emerald-500 shrink-0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══ Section 3: Data Management ═══ */}
        <Card className="overflow-hidden">
          <CardContent className="p-5">
            <SectionTitle
              icon={<Database className="size-4" />}
              title="البيانات"
            />

            <div className="space-y-3">
              {/* Export */}
              <Button
                onClick={onExportData}
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white shadow-sm"
              >
                <Download className="size-4" />
                تصدير البيانات
              </Button>

              {/* Import */}
              <Button
                onClick={onImportData}
                variant="outline"
                className="w-full gap-2 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              >
                <Upload className="size-4" />
                استيراد البيانات
              </Button>

              {/* Clear */}
              <Button
                onClick={onClearData}
                variant="outline"
                className="w-full gap-2 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <Trash2 className="size-4" />
                مسح جميع البيانات
              </Button>

              <Separator className="my-3" />

              {/* Data Size Info */}
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/50 border border-border/50">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Database className="size-3.5 text-emerald-500 dark:text-emerald-400" />
                  حجم البيانات
                </span>
                <Badge
                  variant="secondary"
                  className="text-[11px] font-mono tabular-nums h-5"
                >
                  {storageSize} KB
                </Badge>
              </div>

              {/* Last Export Info */}
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/50 border border-border/50">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-emerald-500 dark:text-emerald-400" />
                  آخر نسخة احتياطية
                </span>
                <span className="text-[11px] text-muted-foreground font-medium max-w-[180px] truncate text-left" dir="rtl">
                  {formatExportDate(lastExport)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══ Section 4: About ═══ */}
        <Card className="overflow-hidden bg-gradient-to-br from-emerald-50/80 via-background to-emerald-50/40 dark:from-emerald-950/20 dark:via-background dark:to-emerald-950/10 border-emerald-200/50 dark:border-emerald-800/30">
          <CardContent className="p-5">
            <SectionTitle
              icon={<Info className="size-4" />}
              title="حول التطبيق"
            />

            {/* App Identity */}
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-emerald-100/60 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/30">
              <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/50 shrink-0">
                <Shield className="size-5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground leading-tight">
                  الحظيرة — نظام إدارة حظيرة الأغنام
                </h4>
                <Badge
                  variant="secondary"
                  className="text-[10px] h-5 mt-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700"
                >
                  الإصدار 2.0
                </Badge>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              تطبيق شامل لإدارة حظيرة الأغنام يتضمن متابعة الحمل، تسجيل
              الأمراض، إدارة المواليد، مراقبة الأعلاف، جدول التحصينات، سجلات
              الأغنام، والتتبع المالي
            </p>

            {/* Feature List */}
            <div className="space-y-2 mb-4">
              {FEATURES.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 text-xs text-foreground/80"
                >
                  <div className="shrink-0 size-4 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                    <Check className="size-2.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <Separator className="my-3" />

            {/* Data Storage Notice */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30">
              <Shield className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                جميع البيانات مخزنة محلياً على جهازك ولا يتم إرسالها لأي خادم خارجي
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
