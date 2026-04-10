'use client';

import { useState, useMemo, useCallback } from 'react';
import type { WeightRecord, BodyCondition } from '@/lib/types';
import { BODY_CONDITION_LABELS } from '@/lib/types';
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
  Scale,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Search,
  Plus,
  Pencil,
  Eye,
  Trash2,
  Filter,
  X,
} from 'lucide-react';

// ============================================================
// Constants
// ============================================================

const BODY_CONDITION_OPTIONS: { value: BodyCondition; label: string }[] = [
  { value: 'excellent', label: 'ممتاز' },
  { value: 'good', label: 'جيد' },
  { value: 'fair', label: 'مقبول' },
  { value: 'poor', label: 'ضعيف' },
];

const BODY_CONDITION_COLORS: Record<BodyCondition, { bar: string; bg: string; text: string; border: string; hoverBg: string }> = {
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

const CONDITION_FILTER_OPTIONS: { value: BodyCondition | 'all'; label: string }[] = [
  { value: 'all', label: 'الكل' },
  ...BODY_CONDITION_OPTIONS,
];

// ============================================================
// Props
// ============================================================

interface WeightTrackerProps {
  records: WeightRecord[];
  onRecordsChange: (records: WeightRecord[]) => void;
}

// ============================================================
// Form
// ============================================================

interface FormData {
  sheepNumber: string;
  weight: number;
  date: string;
  bodyCondition: BodyCondition;
  notes: string;
}

const EMPTY_FORM: FormData = {
  sheepNumber: '',
  weight: 0,
  date: new Date().toISOString().split('T')[0],
  bodyCondition: 'good',
  notes: '',
};

type ConditionFilter = BodyCondition | 'all';
type SortField = 'date' | 'weight' | 'sheepNumber';
type SortDirection = 'asc' | 'desc';

// ============================================================
// Helpers
// ============================================================

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function formatWeight(kg: number): string {
  return `${kg.toLocaleString('ar-SA')} كجم`;
}

// ============================================================
// Component
// ============================================================

export default function WeightTracker({ records, onRecordsChange }: WeightTrackerProps) {
  // ----- State -----
  const [searchQuery, setSearchQuery] = useState('');
  const [conditionFilter, setConditionFilter] = useState<ConditionFilter>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<WeightRecord | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<WeightRecord | null>(null);
  const [detailTarget, setDetailTarget] = useState<WeightRecord | null>(null);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // ----- Derived Data -----
  const filteredRecords = useMemo(() => {
    let result = [...records];

    // Condition filter
    if (conditionFilter !== 'all') {
      result = result.filter((r) => r.bodyCondition === conditionFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.sheepNumber.toLowerCase().includes(q) ||
          r.notes.toLowerCase().includes(q) ||
          BODY_CONDITION_LABELS[r.bodyCondition].includes(q),
      );
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'date':
          cmp = new Date(b.date).getTime() - new Date(a.date).getTime();
          break;
        case 'weight':
          cmp = b.weight - a.weight;
          break;
        case 'sheepNumber':
          cmp = a.sheepNumber.localeCompare(b.sheepNumber, 'ar');
          break;
      }
      return sortDirection === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [records, searchQuery, conditionFilter, sortField, sortDirection]);

  const stats = useMemo(() => {
    const totalRecords = records.length;
    const avgWeight = totalRecords > 0
      ? records.reduce((sum, r) => sum + r.weight, 0) / totalRecords
      : 0;
    const highestWeight = totalRecords > 0
      ? Math.max(...records.map((r) => r.weight))
      : 0;
    const lowestWeight = totalRecords > 0
      ? Math.min(...records.map((r) => r.weight))
      : 0;

    return { totalRecords, avgWeight, highestWeight, lowestWeight };
  }, [records]);

  // Last 6 entries for trend chart (sorted by date descending, take last 6 reversed)
  const trendData = useMemo(() => {
    const sorted = [...records].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    return sorted.slice(-6);
  }, [records]);

  const maxTrendWeight = useMemo(() => {
    return Math.max(1, ...trendData.map((r) => r.weight));
  }, [trendData]);

  // ----- Handlers -----
  const openAddDialog = useCallback(() => {
    setEditingRecord(null);
    setFormData({ ...EMPTY_FORM, date: getTodayString() });
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((record: WeightRecord) => {
    setEditingRecord(record);
    setFormData({
      sheepNumber: record.sheepNumber,
      weight: record.weight,
      date: record.date,
      bodyCondition: record.bodyCondition,
      notes: record.notes,
    });
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!formData.sheepNumber.trim() || formData.weight <= 0) return;

    const now = new Date().toISOString();

    if (editingRecord) {
      const updated = records.map((r) =>
        r.id === editingRecord.id
          ? {
              ...r,
              sheepNumber: formData.sheepNumber.trim(),
              weight: formData.weight,
              date: formData.date,
              bodyCondition: formData.bodyCondition,
              notes: formData.notes,
              updatedAt: now,
            }
          : r,
      );
      onRecordsChange(updated);
    } else {
      const newRecord: WeightRecord = {
        id: generateId(),
        sheepNumber: formData.sheepNumber.trim(),
        weight: formData.weight,
        date: formData.date,
        bodyCondition: formData.bodyCondition,
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

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDirection('desc');
      }
    },
    [sortField],
  );

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
        <Card className="border-lime-200 dark:border-lime-800 bg-lime-50/50 dark:bg-lime-950/20 animate-card-enter hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-lime-100 dark:bg-lime-900/30">
                <Scale className="size-5 text-lime-600 dark:text-lime-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-lime-600 dark:text-lime-400">إجمالي السجلات</p>
                <p className="text-lg font-bold text-lime-700 dark:text-lime-300 tabular truncate">
                  {stats.totalRecords}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Weight */}
        <Card className="border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/20 animate-card-enter hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/30">
                <TrendingUp className="size-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-sky-600 dark:text-sky-400">متوسط الوزن</p>
                <p className="text-lg font-bold text-sky-700 dark:text-sky-300 tabular truncate">
                  {stats.totalRecords > 0 ? formatWeight(Math.round(stats.avgWeight * 10) / 10) : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Highest Weight */}
        <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 animate-card-enter hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <ArrowUp className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-emerald-600 dark:text-emerald-400">أعلى وزن</p>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 tabular truncate">
                  {stats.totalRecords > 0 ? formatWeight(stats.highestWeight) : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lowest Weight */}
        <Card className="border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 animate-card-enter hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/30">
                <ArrowDown className="size-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-rose-600 dark:text-rose-400">أقل وزن</p>
                <p className="text-lg font-bold text-rose-700 dark:text-rose-300 tabular truncate">
                  {stats.totalRecords > 0 ? formatWeight(stats.lowestWeight) : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ====== Weight Trend Chart (CSS only, horizontal bars) ====== */}
      {records.length > 0 && (
        <Card className="glass-card animate-card-enter">
          <CardHeader className="border-b border-lime-100 dark:border-lime-800 bg-lime-50/50 dark:bg-lime-950/20 px-6 py-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-5 text-lime-600 dark:text-lime-400" />
              <CardTitle className="text-lg text-lime-700 dark:text-lime-300">
                اتجاه الأوزان (آخر {trendData.length} قياسات)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {trendData.map((entry, idx) => {
                const colors = BODY_CONDITION_COLORS[entry.bodyCondition];
                const barWidth = Math.max(8, (entry.weight / maxTrendWeight) * 100);
                return (
                  <div key={entry.id} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-medium text-foreground truncate max-w-[80px]">
                          #{entry.sheepNumber}
                        </span>
                        <span className="text-[10px] text-muted-foreground tabular">
                          {formatShortDate(entry.date)}
                        </span>
                      </div>
                      <span className={`text-xs font-bold tabular ${colors.text}`}>
                        {entry.weight} كجم
                      </span>
                    </div>
                    <div className="relative h-7 rounded-lg bg-muted/50 dark:bg-muted/30 overflow-hidden">
                      <div
                        className={`absolute inset-y-0 right-0 rounded-lg bg-gradient-to-l ${colors.bar} transition-all duration-700 ease-out`}
                        style={{ width: `${barWidth}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-end px-3">
                        <span className="text-xs font-semibold text-foreground drop-shadow-sm tabular">
                          {entry.weight} كجم
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
                {BODY_CONDITION_OPTIONS.map((opt) => {
                  const c = BODY_CONDITION_COLORS[opt.value];
                  return (
                    <div key={opt.value} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className={`size-3 rounded ${c.bg} ${c.border} border`} />
                      <span>{opt.label}</span>
                    </div>
                  );
                })}
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
                <Scale className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
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

              {/* Body Condition Filter Pills */}
              <div className="flex items-center gap-1 rounded-lg border border-lime-200 dark:border-lime-800 p-0.5">
                {CONDITION_FILTER_OPTIONS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setConditionFilter(f.value)}
                    className={`
                      rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150
                      ${conditionFilter === f.value
                        ? 'bg-lime-600 text-white shadow-sm'
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
            <Button onClick={openAddDialog} className="bg-lime-600 hover:bg-lime-700 text-white">
              <Plus className="size-4" />
              تسجيل وزن جديد
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ====== Data Table ====== */}
      <Card className="glass-card animate-card-enter">
        <CardHeader className="border-b border-lime-100 dark:border-lime-800 bg-lime-50/50 dark:bg-lime-950/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="size-5 text-lime-600 dark:text-lime-400" />
              <CardTitle className="text-lg text-lime-700 dark:text-lime-300">
                سجلات الأوزان
              </CardTitle>
            </div>
            <Badge
              variant="outline"
              className="text-xs bg-lime-50 dark:bg-lime-950/30 text-lime-600 dark:text-lime-400 border-lime-200 dark:border-lime-700"
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
                icon={<Scale />}
                title="لا توجد سجلات أوزان"
                description="ابدأ بتسجيل أوزان الأغنام لمتابعة نموها"
                action={{
                  label: 'تسجيل أول وزن',
                  onClick: openAddDialog,
                }}
              />
            ) : (
              <EmptyState
                icon={<Search />}
                title="لا توجد نتائج مطابقة"
                description="جرب تغيير كلمات البحث أو فلتر الحالة الجسدية"
                action={{
                  label: 'مسح الفلاتر',
                  onClick: () => {
                    setSearchQuery('');
                    setConditionFilter('all');
                  },
                }}
              />
            )
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-lime-50 dark:bg-muted">
                  <TableRow className="border-lime-200 dark:border-lime-800 hover:bg-lime-50 dark:hover:bg-muted">
                    <TableHead className="text-right text-lime-700 dark:text-lime-300 font-semibold">
                      رقم الأغنام
                    </TableHead>
                    <SortHeader
                      label="الوزن"
                      field="weight"
                      currentField={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    <SortHeader
                      label="التاريخ"
                      field="date"
                      currentField={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    <TableHead className="text-right text-lime-700 dark:text-lime-300 font-semibold">
                      الحالة الجسدية
                    </TableHead>
                    <TableHead className="text-right text-lime-700 dark:text-lime-300 font-semibold hidden md:table-cell">
                      ملاحظات
                    </TableHead>
                    <TableHead className="text-center text-lime-700 dark:text-lime-300 font-semibold">
                      الإجراءات
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => {
                    const colors = BODY_CONDITION_COLORS[record.bodyCondition];
                    return (
                      <TableRow
                        key={record.id}
                        className="border-lime-100 dark:border-lime-800/50 transition-colors hover:bg-lime-50/60 dark:hover:bg-lime-950/10"
                      >
                        <TableCell className="text-sm text-foreground font-medium whitespace-nowrap">
                          #{record.sheepNumber}
                        </TableCell>
                        <TableCell className={`font-bold tabular whitespace-nowrap ${colors.text}`}>
                          {record.weight} كجم
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground tabular whitespace-nowrap">
                          {formatShortDate(record.date)}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${colors.bg} ${colors.text} ${colors.border} ${colors.hoverBg} border`}>
                            {BODY_CONDITION_LABELS[record.bodyCondition]}
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
                              className="size-8 text-lime-600 dark:text-lime-400 hover:bg-lime-100 dark:hover:bg-lime-900/30 hover:text-lime-700"
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
            <DialogTitle className="flex items-center gap-2 text-lime-700 dark:text-lime-300">
              <Scale className="size-5" />
              {editingRecord ? 'تعديل سجل الوزن' : 'تسجيل وزن جديد'}
            </DialogTitle>
            <DialogDescription>
              {editingRecord
                ? 'قم بتعديل بيانات القياس ثم اضغط حفظ'
                : 'أدخل بيانات القياس الجديد'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Sheep Number + Weight */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="wt-sheep" className="text-lime-700 dark:text-lime-300 font-medium">
                  رقم الأغنام *
                </Label>
                <Input
                  id="wt-sheep"
                  placeholder="مثال: 001"
                  value={formData.sheepNumber}
                  onChange={(e) => updateField('sheepNumber', e.target.value)}
                  className="border-lime-200 dark:border-lime-800 focus-visible:ring-lime-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wt-weight" className="text-lime-700 dark:text-lime-300 font-medium">
                  الوزن (كجم) *
                </Label>
                <div className="relative">
                  <Input
                    id="wt-weight"
                    type="number"
                    min={0}
                    step={0.1}
                    placeholder="0.0"
                    value={formData.weight || ''}
                    onChange={(e) => updateField('weight', Math.max(0, parseFloat(e.target.value) || 0))}
                    className="border-lime-200 dark:border-lime-800 focus-visible:ring-lime-400 tabular text-left pl-14"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                    كجم
                  </span>
                </div>
              </div>
            </div>

            {/* Date + Body Condition */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="wt-date" className="text-lime-700 dark:text-lime-300 font-medium">
                  التاريخ *
                </Label>
                <Input
                  id="wt-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => updateField('date', e.target.value)}
                  className="border-lime-200 dark:border-lime-800 focus-visible:ring-lime-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wt-condition" className="text-lime-700 dark:text-lime-300 font-medium">
                  الحالة الجسدية
                </Label>
                <Select
                  value={formData.bodyCondition}
                  onValueChange={(val) => updateField('bodyCondition', val as BodyCondition)}
                >
                  <SelectTrigger className="w-full border-lime-200 dark:border-lime-800 focus-visible:ring-lime-400">
                    <SelectValue placeholder="اختر الحالة الجسدية" />
                  </SelectTrigger>
                  <SelectContent>
                    {BODY_CONDITION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator className="bg-lime-100 dark:bg-lime-800" />

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="wt-notes" className="text-lime-700 dark:text-lime-300 font-medium">
                ملاحظات
              </Label>
              <Textarea
                id="wt-notes"
                placeholder="ملاحظات إضافية (اختياري)..."
                rows={3}
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                className="border-lime-200 dark:border-lime-800 focus-visible:ring-lime-400 resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-lime-200 dark:border-lime-700 text-lime-700 dark:text-lime-300 hover:bg-lime-50 dark:hover:bg-lime-950/30"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.sheepNumber.trim() || formData.weight <= 0 || !formData.date}
              className="bg-lime-600 hover:bg-lime-700 text-white"
            >
              <Plus className="mr-2 size-4" />
              {editingRecord ? 'حفظ التعديلات' : 'تسجيل الوزن'}
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
              هل أنت متأكد من حذف سجل وزن الأغنام رقم{' '}
              <span className="font-bold text-red-600">
                #{deleteTarget?.sheepNumber}
              </span>
              {' '}البالغ{' '}
              <span className="font-bold text-red-600">
                {deleteTarget ? `${deleteTarget.weight} كجم` : ''}
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
            <DialogTitle className="flex items-center gap-2 text-lime-700 dark:text-lime-300">
              <Scale className="size-5" />
              تفاصيل سجل الوزن
            </DialogTitle>
            <DialogDescription>
              {detailTarget
                ? `سجل وزن الأغنام رقم #${detailTarget.sheepNumber}`
                : ''}
            </DialogDescription>
          </DialogHeader>

          {detailTarget && (() => {
            const colors = BODY_CONDITION_COLORS[detailTarget.bodyCondition];
            return (
              <div className="space-y-5">
                {/* Large Weight Display */}
                <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-lime-50 to-emerald-50 dark:from-lime-950/30 dark:to-emerald-950/20 border border-lime-200 dark:border-lime-800 p-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-lime-700 dark:text-lime-300 tabular">
                      {detailTarget.weight}
                    </p>
                    <p className="text-sm text-lime-600 dark:text-lime-400 mt-1">كجم</p>
                  </div>
                </div>

                {/* Body Condition Badge */}
                <div className="flex justify-center">
                  <Badge className={`${colors.bg} ${colors.text} ${colors.border} ${colors.hoverBg} border px-4 py-1.5 text-sm`}>
                    {BODY_CONDITION_LABELS[detailTarget.bodyCondition]}
                  </Badge>
                </div>

                <Separator className="bg-lime-100 dark:bg-lime-800" />

                {/* Details Grid */}
                <div className="space-y-3">
                  <DetailRow
                    icon={<Scale className="size-3.5 text-lime-500" />}
                    label="رقم الأغنام"
                    value={`#${detailTarget.sheepNumber}`}
                  />
                  <DetailRow
                    icon={<Scale className="size-3.5 text-lime-500" />}
                    label="الوزن"
                    value={`${detailTarget.weight} كجم`}
                  />
                  <DetailRow
                    icon={<ArrowUp className="size-3.5 text-lime-500" />}
                    label="التاريخ"
                    value={formatDateArabic(detailTarget.date)}
                  />
                  <DetailRow
                    icon={<Filter className="size-3.5 text-lime-500" />}
                    label="الحالة الجسدية"
                    value={BODY_CONDITION_LABELS[detailTarget.bodyCondition]}
                  />
                  {detailTarget.notes && (
                    <DetailRow
                      icon={<Pencil className="size-3.5 text-lime-500" />}
                      label="ملاحظات"
                      value={detailTarget.notes}
                      multiline
                    />
                  )}
                </div>

                <Separator className="bg-lime-100 dark:bg-lime-800" />

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 border-lime-200 dark:border-lime-700 text-lime-700 dark:text-lime-300 hover:bg-lime-50 dark:hover:bg-lime-950/30"
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

function SortHeader({
  label,
  field,
  currentField,
  direction,
  onSort,
}: {
  label: string;
  field: SortField;
  currentField: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
}) {
  const isActive = currentField === field;
  return (
    <TableHead
      className="text-right text-lime-700 dark:text-lime-300 font-semibold cursor-pointer select-none hover:text-lime-800 dark:hover:text-lime-200 transition-colors"
      onClick={() => onSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        <span className="text-[10px] opacity-60">
          {isActive ? (direction === 'asc' ? '▲' : '▼') : '⇅'}
        </span>
      </span>
    </TableHead>
  );
}

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
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-lime-50 dark:bg-lime-950/20">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs font-medium text-lime-600 dark:text-lime-400">{label}</p>
        {multiline ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{value}</p>
        ) : (
          <p className="text-sm font-medium text-foreground">{value}</p>
        )}
      </div>
    </div>
  );
}
