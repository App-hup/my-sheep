'use client';

import { useState, useMemo, useCallback } from 'react';
import type { MilkRecord, MilkQuality } from '@/lib/types';
import { MILK_QUALITY_LABELS } from '@/lib/types';
import { generateId, formatDateArabic, formatShortDate } from '@/lib/storage';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import EmptyState from '@/components/ui/empty-state';
import {
  Fingerprint,
  Beaker,
  TrendingUp,
  Calendar,
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
  Filter,
} from 'lucide-react';

// ============================================================
// Constants
// ============================================================

const MILK_QUALITY_OPTIONS: { value: MilkQuality; label: string }[] = [
  { value: 'excellent', label: 'ممتاز' },
  { value: 'good', label: 'جيد' },
  { value: 'fair', label: 'مقبول' },
  { value: 'poor', label: 'ضعيف' },
];

const MILK_QUALITY_COLORS: Record<MilkQuality, { bar: string; bg: string; text: string; border: string; hoverBg: string }> = {
  excellent: {
    bar: 'from-emerald-400 to-emerald-500 dark:from-emerald-500 dark:to-emerald-600',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-700',
    hoverBg: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/30',
  },
  good: {
    bar: 'from-sky-400 to-sky-500 dark:from-sky-500 dark:to-sky-600',
    bg: 'bg-sky-100 dark:bg-sky-900/30',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-700',
    hoverBg: 'hover:bg-sky-100 dark:hover:bg-sky-900/30',
  },
  fair: {
    bar: 'from-amber-400 to-amber-500 dark:from-amber-500 dark:to-amber-600',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-700',
    hoverBg: 'hover:bg-amber-100 dark:hover:bg-amber-900/30',
  },
  poor: {
    bar: 'from-rose-400 to-rose-500 dark:from-rose-500 dark:to-rose-600',
    bg: 'bg-rose-100 dark:bg-rose-900/30',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-700',
    hoverBg: 'hover:bg-rose-100 dark:hover:bg-rose-900/30',
  },
};

const QUALITY_FILTER_OPTIONS: { value: MilkQuality | 'all'; label: string }[] = [
  { value: 'all', label: 'الكل' },
  ...MILK_QUALITY_OPTIONS,
];

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

// ============================================================
// Props
// ============================================================

interface MilkProductionProps {
  records: MilkRecord[];
  onRecordsChange: (records: MilkRecord[]) => void;
}

// ============================================================
// Form
// ============================================================

interface FormData {
  sheepNumber: string;
  date: string;
  morningAmount: number;
  eveningAmount: number;
  quality: MilkQuality;
  notes: string;
}

const EMPTY_FORM: FormData = {
  sheepNumber: '',
  date: new Date().toISOString().split('T')[0],
  morningAmount: 0,
  eveningAmount: 0,
  quality: 'good',
  notes: '',
};

type QualityFilter = MilkQuality | 'all';

// ============================================================
// Helpers
// ============================================================

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function formatLiters(liters: number): string {
  return `${liters.toLocaleString('ar-SA', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} لتر`;
}

function getMonthlyData(records: MilkRecord[]) {
  const now = new Date();
  const months: { key: string; label: string; year: number; month: number; total: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push({
      key,
      label: ARABIC_MONTHS[d.getMonth()],
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      total: 0,
    });
  }

  for (const r of records) {
    const d = new Date(r.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const m = months.find((x) => x.key === key);
    if (m) {
      m.total += r.totalAmount;
    }
  }

  return months;
}

function getBarGradient(total: number, maxTotal: number): string {
  const ratio = maxTotal > 0 ? total / maxTotal : 0;
  if (ratio >= 0.66) return 'from-emerald-400 to-emerald-500 dark:from-emerald-500 dark:to-emerald-600';
  if (ratio >= 0.33) return 'from-sky-400 to-sky-500 dark:from-sky-500 dark:to-sky-600';
  return 'from-amber-400 to-amber-500 dark:from-amber-500 dark:to-amber-600';
}

// ============================================================
// Component
// ============================================================

export default function MilkProduction({ records, onRecordsChange }: MilkProductionProps) {
  // ----- State -----
  const [searchQuery, setSearchQuery] = useState('');
  const [qualityFilter, setQualityFilter] = useState<QualityFilter>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MilkRecord | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<MilkRecord | null>(null);
  const [detailTarget, setDetailTarget] = useState<MilkRecord | null>(null);

  // ----- Computed total for form -----
  const formTotal = useMemo(() => {
    return (formData.morningAmount || 0) + (formData.eveningAmount || 0);
  }, [formData.morningAmount, formData.eveningAmount]);

  // ----- Derived Data -----
  const filteredRecords = useMemo(() => {
    let result = [...records];

    // Quality filter
    if (qualityFilter !== 'all') {
      result = result.filter((r) => r.quality === qualityFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.sheepNumber.toLowerCase().includes(q) ||
          r.notes.toLowerCase().includes(q),
      );
    }

    // Sort by date descending
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return result;
  }, [records, searchQuery, qualityFilter]);

  const stats = useMemo(() => {
    const totalRecords = records.length;
    const avgDaily = totalRecords > 0
      ? records.reduce((sum, r) => sum + r.totalAmount, 0) / totalRecords
      : 0;
    const highestProduction = totalRecords > 0
      ? Math.max(...records.map((r) => r.totalAmount))
      : 0;

    // This month production
    const now = new Date();
    const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonthTotal = records
      .filter((r) => {
        const d = new Date(r.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return key === thisMonthKey;
      })
      .reduce((sum, r) => sum + r.totalAmount, 0);

    return { totalRecords, avgDaily, highestProduction, thisMonthTotal };
  }, [records]);

  // Monthly chart data
  const monthlyData = useMemo(() => getMonthlyData(records), [records]);
  const maxMonthlyTotal = useMemo(
    () => Math.max(1, ...monthlyData.map((m) => m.total)),
    [monthlyData],
  );

  // ----- Handlers -----
  const openAddDialog = useCallback(() => {
    setEditingRecord(null);
    setFormData({ ...EMPTY_FORM, date: getTodayString() });
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((record: MilkRecord) => {
    setEditingRecord(record);
    setFormData({
      sheepNumber: record.sheepNumber,
      date: record.date,
      morningAmount: record.morningAmount,
      eveningAmount: record.eveningAmount,
      quality: record.quality,
      notes: record.notes,
    });
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!formData.sheepNumber.trim() || !formData.date) return;

    const now = new Date().toISOString();
    const totalAmount = (formData.morningAmount || 0) + (formData.eveningAmount || 0);

    if (editingRecord) {
      const updated = records.map((r) =>
        r.id === editingRecord.id
          ? {
              ...r,
              sheepNumber: formData.sheepNumber.trim(),
              date: formData.date,
              morningAmount: formData.morningAmount || 0,
              eveningAmount: formData.eveningAmount || 0,
              totalAmount,
              quality: formData.quality,
              notes: formData.notes,
              updatedAt: now,
            }
          : r,
      );
      onRecordsChange(updated);
    } else {
      const newRecord: MilkRecord = {
        id: generateId(),
        sheepNumber: formData.sheepNumber.trim(),
        date: formData.date,
        morningAmount: formData.morningAmount || 0,
        eveningAmount: formData.eveningAmount || 0,
        totalAmount,
        quality: formData.quality,
        notes: formData.notes,
        createdAt: now,
        updatedAt: now,
      };
      onRecordsChange([newRecord, ...records]);
    }

    setDialogOpen(false);
    setEditingRecord(null);
    setFormData(EMPTY_FORM);
  }, [formData, editingRecord, records, onRecordsChange]);

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    onRecordsChange(records.filter((r) => r.id !== deleteTarget.id));
    setDeleteTarget(null);
  }, [deleteTarget, records, onRecordsChange]);

  const updateField = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="space-y-6">
      {/* ====== Stats Cards ====== */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 stagger-blur">
        {/* Total Records */}
        <Card className="border-pink-200 dark:border-pink-800 bg-pink-50/50 dark:bg-pink-950/20 animate-card-enter hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-900/30">
                <Fingerprint className="size-5 text-pink-600 dark:text-pink-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-pink-600 dark:text-pink-400">إجمالي السجلات</p>
                <p className="text-lg font-bold text-pink-700 dark:text-pink-300 tabular truncate">
                  {stats.totalRecords}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Daily */}
        <Card className="border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/20 animate-card-enter hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/30">
                <Beaker className="size-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-sky-600 dark:text-sky-400">متوسط الإنتاج اليومي</p>
                <p className="text-lg font-bold text-sky-700 dark:text-sky-300 tabular truncate">
                  {stats.totalRecords > 0 ? formatLiters(Math.round(stats.avgDaily * 10) / 10) : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Highest Production */}
        <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 animate-card-enter hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <TrendingUp className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-emerald-600 dark:text-emerald-400">أعلى إنتاج يومي</p>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 tabular truncate">
                  {stats.totalRecords > 0 ? formatLiters(stats.highestProduction) : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* This Month */}
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 animate-card-enter hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Calendar className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-amber-600 dark:text-amber-400">إنتاج هذا الشهر</p>
                <p className="text-lg font-bold text-amber-700 dark:text-amber-300 tabular truncate">
                  {stats.thisMonthTotal > 0 ? formatLiters(stats.thisMonthTotal) : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ====== Monthly Production Chart (CSS only) ====== */}
      {records.length > 0 && (
        <Card className="glass-card animate-card-enter">
          <CardHeader className="border-b border-pink-100 dark:border-pink-800 bg-pink-50/50 dark:bg-pink-950/20 px-6 py-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-5 text-pink-600 dark:text-pink-400" />
              <CardTitle className="text-lg text-pink-700 dark:text-pink-300">
                الإنتاج الشهري (آخر 6 أشهر)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {monthlyData.map((month) => {
                const barWidth = Math.max(6, (month.total / maxMonthlyTotal) * 100);
                const gradient = getBarGradient(month.total, maxMonthlyTotal);
                return (
                  <div key={month.key} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-medium text-foreground truncate">
                          {month.label} {month.year}
                        </span>
                      </div>
                      <span className="text-xs font-bold tabular text-foreground">
                        {month.total > 0 ? formatLiters(month.total) : '—'}
                      </span>
                    </div>
                    <div className="relative h-7 rounded-lg bg-muted/50 dark:bg-muted/30 overflow-hidden">
                      {month.total > 0 ? (
                        <div
                          className={`absolute inset-y-0 right-0 rounded-lg bg-gradient-to-l ${gradient} transition-all duration-700 ease-out`}
                          style={{ width: `${barWidth}%` }}
                        />
                      ) : null}
                      <div className="absolute inset-0 flex items-center justify-end px-3">
                        <span className="text-xs font-semibold text-foreground/80 drop-shadow-sm tabular">
                          {month.total > 0 ? `${month.total.toLocaleString('ar-SA')} لتر` : 'لا يوجد إنتاج'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="size-3 rounded bg-gradient-to-l from-emerald-400 to-emerald-500 dark:from-emerald-500 dark:to-emerald-600" />
                  <span>مرتفع</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="size-3 rounded bg-gradient-to-l from-sky-400 to-sky-500 dark:from-sky-500 dark:to-sky-600" />
                  <span>متوسط</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="size-3 rounded bg-gradient-to-l from-amber-400 to-amber-500 dark:from-amber-500 dark:to-amber-600" />
                  <span>منخفض</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ====== Search + Filter + Add Button ====== */}
      <Card className="glass-card animate-card-enter">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              {/* Search */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="بحث برقم الأغنام أو الملاحظات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-9"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Quality Filter Pills */}
              <div className="flex items-center gap-1 rounded-lg border border-pink-200 dark:border-pink-800 p-0.5 overflow-x-auto">
                {QUALITY_FILTER_OPTIONS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setQualityFilter(f.value)}
                    className={`
                      rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150 whitespace-nowrap
                      ${qualityFilter === f.value
                        ? 'bg-pink-600 text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }
                    `}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Add button */}
            <Button onClick={openAddDialog} className="bg-pink-600 hover:bg-pink-700 text-white shrink-0">
              <Plus className="size-4" />
              تسجيل إنتاج جديد
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ====== Data Table ====== */}
      <Card className="glass-card animate-card-enter">
        <CardHeader className="border-b border-pink-100 dark:border-pink-800 bg-pink-50/50 dark:bg-pink-950/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Beaker className="size-5 text-pink-600 dark:text-pink-400" />
              <CardTitle className="text-lg text-pink-700 dark:text-pink-300">
                سجلات إنتاج الألبان
              </CardTitle>
            </div>
            <Badge
              variant="outline"
              className="text-xs bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-700"
            >
              <Filter className="size-3 ml-1" />
              {filteredRecords.length} {filteredRecords.length === 1 ? 'سجل' : 'سجلات'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredRecords.length === 0 ? (
            records.length === 0 ? (
              <EmptyState
                icon={<Beaker />}
                title="لا توجد سجلات إنتاج ألبان"
                description="ابدأ بتسجيل الإنتاج اليومي للأغنام لمتابعة أدائها"
                action={{
                  label: 'تسجيل أول إنتاج',
                  onClick: openAddDialog,
                }}
              />
            ) : (
              <EmptyState
                icon={<Search />}
                title="لا توجد نتائج مطابقة"
                description="جرب تغيير كلمات البحث أو فلتر الجودة"
                action={{
                  label: 'مسح الفلاتر',
                  onClick: () => {
                    setSearchQuery('');
                    setQualityFilter('all');
                  },
                }}
              />
            )
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-pink-50 dark:bg-muted">
                  <TableRow className="border-pink-200 dark:border-pink-800 hover:bg-pink-50 dark:hover:bg-muted">
                    <TableHead className="text-right text-pink-700 dark:text-pink-300 font-semibold">
                      رقم الأغنام
                    </TableHead>
                    <TableHead className="text-right text-pink-700 dark:text-pink-300 font-semibold">
                      صباحي
                    </TableHead>
                    <TableHead className="text-right text-pink-700 dark:text-pink-300 font-semibold">
                      مسائي
                    </TableHead>
                    <TableHead className="text-right text-pink-700 dark:text-pink-300 font-semibold">
                      الإجمالي
                    </TableHead>
                    <TableHead className="text-right text-pink-700 dark:text-pink-300 font-semibold">
                      التاريخ
                    </TableHead>
                    <TableHead className="text-right text-pink-700 dark:text-pink-300 font-semibold">
                      الجودة
                    </TableHead>
                    <TableHead className="text-right text-pink-700 dark:text-pink-300 font-semibold hidden md:table-cell">
                      ملاحظات
                    </TableHead>
                    <TableHead className="text-center text-pink-700 dark:text-pink-300 font-semibold">
                      الإجراءات
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => {
                    const colors = MILK_QUALITY_COLORS[record.quality];
                    return (
                      <TableRow
                        key={record.id}
                        className="border-pink-100 dark:border-pink-800/50 transition-colors hover:bg-pink-50/60 dark:hover:bg-pink-950/10"
                      >
                        <TableCell className="text-sm text-foreground font-medium whitespace-nowrap">
                          #{record.sheepNumber}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground tabular whitespace-nowrap">
                          {record.morningAmount.toLocaleString('ar-SA')} لتر
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground tabular whitespace-nowrap">
                          {record.eveningAmount.toLocaleString('ar-SA')} لتر
                        </TableCell>
                        <TableCell className={`font-bold tabular whitespace-nowrap ${colors.text}`}>
                          {record.totalAmount.toLocaleString('ar-SA')} لتر
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground tabular whitespace-nowrap">
                          {formatShortDate(record.date)}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${colors.bg} ${colors.text} ${colors.border} ${colors.hoverBg} border`}>
                            {MILK_QUALITY_LABELS[record.quality]}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden max-w-[200px] text-sm text-muted-foreground md:table-cell">
                          <span className="line-clamp-1" title={record.notes}>
                            {record.notes || '—'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/30 hover:text-pink-700"
                              onClick={() => setDetailTarget(record)}
                              title="عرض التفاصيل"
                            >
                              <Eye className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-700"
                              onClick={() => openEditDialog(record)}
                              title="تعديل"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600"
                              onClick={() => setDeleteTarget(record)}
                              title="حذف"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ====== Add / Edit Dialog ====== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-pink-700 dark:text-pink-300">
              <Beaker className="size-5" />
              {editingRecord ? 'تعديل سجل الإنتاج' : 'تسجيل إنتاج جديد'}
            </DialogTitle>
            <DialogDescription>
              {editingRecord
                ? 'قم بتعديل بيانات الإنتاج ثم اضغط حفظ'
                : 'أدخل بيانات الإنتاج الجديد'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Sheep Number + Date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="milk-sheep" className="text-pink-700 dark:text-pink-300 font-medium">
                  رقم الأغنام *
                </Label>
                <Input
                  id="milk-sheep"
                  placeholder="مثال: 001"
                  value={formData.sheepNumber}
                  onChange={(e) => updateField('sheepNumber', e.target.value)}
                  className="border-pink-200 dark:border-pink-800 focus-visible:ring-pink-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="milk-date" className="text-pink-700 dark:text-pink-300 font-medium">
                  التاريخ *
                </Label>
                <Input
                  id="milk-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => updateField('date', e.target.value)}
                  className="border-pink-200 dark:border-pink-800 focus-visible:ring-pink-400"
                />
              </div>
            </div>

            {/* Morning + Evening amounts */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="milk-morning" className="text-pink-700 dark:text-pink-300 font-medium">
                  الكمية الصباحية
                </Label>
                <div className="relative">
                  <Input
                    id="milk-morning"
                    type="number"
                    min={0}
                    step={0.1}
                    placeholder="0.0"
                    value={formData.morningAmount || ''}
                    onChange={(e) => updateField('morningAmount', Math.max(0, parseFloat(e.target.value) || 0))}
                    className="border-pink-200 dark:border-pink-800 focus-visible:ring-pink-400 tabular text-left pl-14"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                    لتر
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="milk-evening" className="text-pink-700 dark:text-pink-300 font-medium">
                  الكمية المسائية
                </Label>
                <div className="relative">
                  <Input
                    id="milk-evening"
                    type="number"
                    min={0}
                    step={0.1}
                    placeholder="0.0"
                    value={formData.eveningAmount || ''}
                    onChange={(e) => updateField('eveningAmount', Math.max(0, parseFloat(e.target.value) || 0))}
                    className="border-pink-200 dark:border-pink-800 focus-visible:ring-pink-400 tabular text-left pl-14"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                    لتر
                  </span>
                </div>
              </div>
            </div>

            {/* Auto-calculated total */}
            <div className="rounded-lg bg-gradient-to-l from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/20 border border-pink-200 dark:border-pink-800 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-pink-600 dark:text-pink-400">
                  الإجمالي (صباحي + مسائي)
                </span>
                <span className="text-xl font-bold text-pink-700 dark:text-pink-300 tabular">
                  {formTotal.toLocaleString('ar-SA', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} لتر
                </span>
              </div>
            </div>

            {/* Quality */}
            <div className="space-y-2">
              <Label htmlFor="milk-quality" className="text-pink-700 dark:text-pink-300 font-medium">
                جودة الحليب
              </Label>
              <Select
                value={formData.quality}
                onValueChange={(val) => updateField('quality', val as MilkQuality)}
              >
                <SelectTrigger className="w-full border-pink-200 dark:border-pink-800 focus-visible:ring-pink-400">
                  <SelectValue placeholder="اختر الجودة" />
                </SelectTrigger>
                <SelectContent>
                  {MILK_QUALITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator className="bg-pink-100 dark:bg-pink-800" />

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="milk-notes" className="text-pink-700 dark:text-pink-300 font-medium">
                ملاحظات
              </Label>
              <Textarea
                id="milk-notes"
                placeholder="ملاحظات إضافية (اختياري)..."
                rows={3}
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                className="border-pink-200 dark:border-pink-800 focus-visible:ring-pink-400 resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-pink-200 dark:border-pink-700 text-pink-700 dark:text-pink-300 hover:bg-pink-50 dark:hover:bg-pink-950/30"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.sheepNumber.trim() || !formData.date}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              <Plus className="mr-2 size-4" />
              {editingRecord ? 'حفظ التعديلات' : 'تسجيل الإنتاج'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====== Delete Confirmation Dialog ====== */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="border-red-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-700">
              <Trash2 className="size-5" />
              تأكيد الحذف
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف سجل إنتاج الأغنام رقم{' '}
              <span className="font-bold text-red-600">
                #{deleteTarget?.sheepNumber}
              </span>
              {' '}البالغ{' '}
              <span className="font-bold text-red-600">
                {deleteTarget ? `${deleteTarget.totalAmount} لتر` : ''}
              </span>
              ؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-red-200 text-red-700 hover:bg-red-50">
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-400"
            >
              نعم، احذف السجل
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ====== Detail View Dialog ====== */}
      <Dialog
        open={!!detailTarget}
        onOpenChange={(open) => {
          if (!open) setDetailTarget(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-pink-700 dark:text-pink-300">
              <Beaker className="size-5" />
              تفاصيل سجل الإنتاج
            </DialogTitle>
            <DialogDescription>
              {detailTarget
                ? `سجل إنتاج الأغنام رقم #${detailTarget.sheepNumber}`
                : ''}
            </DialogDescription>
          </DialogHeader>

          {detailTarget && (() => {
            const colors = MILK_QUALITY_COLORS[detailTarget.quality];
            return (
              <div className="space-y-5">
                {/* Large Total Display */}
                <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/20 border border-pink-200 dark:border-pink-800 p-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-pink-700 dark:text-pink-300 tabular">
                      {detailTarget.totalAmount.toLocaleString('ar-SA', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-pink-600 dark:text-pink-400 mt-1">لتر</p>
                  </div>
                </div>

                {/* Morning/Evening Breakdown */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-pink-50/50 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-800 p-4 text-center">
                    <p className="text-xs text-pink-600 dark:text-pink-400 mb-1">صباحي</p>
                    <p className="text-lg font-bold text-pink-700 dark:text-pink-300 tabular">
                      {detailTarget.morningAmount.toLocaleString('ar-SA')} لتر
                    </p>
                  </div>
                  <div className="rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-800 p-4 text-center">
                    <p className="text-xs text-rose-600 dark:text-rose-400 mb-1">مسائي</p>
                    <p className="text-lg font-bold text-rose-700 dark:text-rose-300 tabular">
                      {detailTarget.eveningAmount.toLocaleString('ar-SA')} لتر
                    </p>
                  </div>
                </div>

                {/* Quality Badge */}
                <div className="flex justify-center">
                  <Badge className={`${colors.bg} ${colors.text} ${colors.border} ${colors.hoverBg} border px-4 py-1.5 text-sm`}>
                    {MILK_QUALITY_LABELS[detailTarget.quality]}
                  </Badge>
                </div>

                <Separator className="bg-pink-100 dark:bg-pink-800" />

                {/* Details Grid */}
                <div className="space-y-3">
                  <DetailRow
                    icon={<Fingerprint className="size-3.5 text-pink-500" />}
                    label="رقم الأغنام"
                    value={`#${detailTarget.sheepNumber}`}
                  />
                  <DetailRow
                    icon={<Calendar className="size-3.5 text-pink-500" />}
                    label="التاريخ"
                    value={formatDateArabic(detailTarget.date)}
                  />
                  <DetailRow
                    icon={<Beaker className="size-3.5 text-pink-500" />}
                    label="الجودة"
                    value={MILK_QUALITY_LABELS[detailTarget.quality]}
                  />
                  {detailTarget.notes && (
                    <DetailRow
                      icon={<Pencil className="size-3.5 text-pink-500" />}
                      label="ملاحظات"
                      value={detailTarget.notes}
                      multiline
                    />
                  )}
                </div>

                <Separator className="bg-pink-100 dark:bg-pink-800" />

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 border-pink-200 dark:border-pink-700 text-pink-700 dark:text-pink-300 hover:bg-pink-50 dark:hover:bg-pink-950/30"
                    onClick={() => {
                      openEditDialog(detailTarget);
                      setDetailTarget(null);
                    }}
                  >
                    <Pencil className="size-4" />
                    تعديل
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                    onClick={() => {
                      setDeleteTarget(detailTarget);
                      setDetailTarget(null);
                    }}
                  >
                    <Trash2 className="size-4" />
                    حذف
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function DetailRow({
  icon,
  label,
  value,
  multiline = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-pink-50 dark:bg-pink-950/20">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs font-medium text-pink-600 dark:text-pink-400">{label}</p>
        {multiline ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{value}</p>
        ) : (
          <p className="text-sm font-medium text-foreground">{value}</p>
        )}
      </div>
    </div>
  );
}
