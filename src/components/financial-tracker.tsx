'use client';

import { useState, useMemo, useCallback } from 'react';
import type { FinancialRecord } from '@/lib/types';
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
  Wallet,
  Receipt,
  TrendingUp,
  TrendingDown,
  Calendar,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  X,
  ArrowUpCircle,
  ArrowDownCircle,
  Filter,
} from 'lucide-react';

// ============================================================
// Constants
// ============================================================

const EXPENSE_CATEGORIES = [
  { value: 'feed', label: 'أعلاف' },
  { value: 'medicine', label: 'أدوية' },
  { value: 'vet', label: 'طبيب بيطري' },
  { value: 'maintenance', label: 'صيانة' },
  { value: 'transport', label: 'نقل' },
  { value: 'labor', label: 'عمالة' },
  { value: 'other_expense', label: 'أخرى' },
];

const INCOME_CATEGORIES = [
  { value: 'sheep_sale', label: 'بيع أغنام' },
  { value: 'wool', label: 'بيع صوف' },
  { value: 'milk', label: 'بيع حليب' },
  { value: 'slaughter', label: 'ذبح' },
  { value: 'other_income', label: 'أخرى' },
];

const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

// ============================================================
// Props
// ============================================================

interface FinancialTrackerProps {
  records: FinancialRecord[];
  onRecordsChange: (records: FinancialRecord[]) => void;
}

// ============================================================
// Form
// ============================================================

interface FormData {
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  description: string;
  notes: string;
}

const EMPTY_FORM: FormData = {
  type: 'income',
  category: '',
  amount: 0,
  date: new Date().toISOString().split('T')[0],
  description: '',
  notes: '',
};

type TypeFilter = 'all' | 'income' | 'expense';
type SortField = 'date' | 'amount' | 'type' | 'category';
type SortDirection = 'asc' | 'desc';

// ============================================================
// Helpers
// ============================================================

function getCategoryLabel(categoryKey: string): string {
  const cat = ALL_CATEGORIES.find((c) => c.value === categoryKey);
  return cat ? cat.label : categoryKey;
}

function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('ar-SA')} ر.س`;
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

// ============================================================
// Component
// ============================================================

export default function FinancialTracker({ records, onRecordsChange }: FinancialTrackerProps) {
  // ----- State -----
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<FinancialRecord | null>(null);
  const [detailTarget, setDetailTarget] = useState<FinancialRecord | null>(null);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // ----- Derived Data -----
  const filteredRecords = useMemo(() => {
    let result = [...records];

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((r) => r.type === typeFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.description.toLowerCase().includes(q) ||
          getCategoryLabel(r.category).toLowerCase().includes(q) ||
          String(r.amount).includes(q) ||
          r.notes.toLowerCase().includes(q),
      );
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'date':
          cmp = new Date(b.date).getTime() - new Date(a.date).getTime();
          break;
        case 'amount':
          cmp = b.amount - a.amount;
          break;
        case 'type':
          cmp = a.type.localeCompare(b.type);
          break;
        case 'category':
          cmp = getCategoryLabel(a.category).localeCompare(getCategoryLabel(b.category), 'ar');
          break;
      }
      return sortDirection === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [records, searchQuery, typeFilter, sortField, sortDirection]);

  const stats = useMemo(() => {
    const totalIncome = records
      .filter((r) => r.type === 'income')
      .reduce((sum, r) => sum + r.amount, 0);

    const totalExpenses = records
      .filter((r) => r.type === 'expense')
      .reduce((sum, r) => sum + r.amount, 0);

    const netBalance = totalIncome - totalExpenses;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const thisMonthTotal = records
      .filter((r) => {
        const d = new Date(r.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, r) => r.type === 'income' ? sum + r.amount : sum - r.amount, 0);

    return { totalIncome, totalExpenses, netBalance, thisMonthTotal };
  }, [records]);

  // Monthly data for chart (last 6 months)
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; income: number; expenses: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = d.getMonth();
      const year = d.getFullYear();
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;

      const monthRecords = records.filter((r) => {
        const rd = new Date(r.date);
        return rd.getMonth() === month && rd.getFullYear() === year;
      });

      const income = monthRecords
        .filter((r) => r.type === 'income')
        .reduce((sum, r) => sum + r.amount, 0);

      const expenses = monthRecords
        .filter((r) => r.type === 'expense')
        .reduce((sum, r) => sum + r.amount, 0);

      months.push({
        key,
        label: ARABIC_MONTHS[month],
        income,
        expenses,
      });
    }

    return months;
  }, [records]);

  const maxMonthlyAmount = useMemo(() => {
    return Math.max(
      1,
      ...monthlyData.map((m) => Math.max(m.income, m.expenses)),
    );
  }, [monthlyData]);

  // ----- Handlers -----
  const openAddDialog = useCallback(() => {
    setEditingRecord(null);
    setFormData({ ...EMPTY_FORM, date: getTodayString() });
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((record: FinancialRecord) => {
    setEditingRecord(record);
    setFormData({
      type: record.type,
      category: record.category,
      amount: record.amount,
      date: record.date,
      description: record.description,
      notes: record.notes,
    });
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!formData.category || formData.amount <= 0) return;

    const now = new Date().toISOString();

    if (editingRecord) {
      const updated = records.map((r) =>
        r.id === editingRecord.id
          ? {
              ...r,
              ...formData,
              updatedAt: now,
            }
          : r,
      );
      onRecordsChange(updated);
    } else {
      const newRecord: FinancialRecord = {
        id: generateId(),
        ...formData,
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
      setFormData((prev) => {
        const next = { ...prev, [field]: value };
        // Reset category when type changes
        if (field === 'type') {
          next.category = '';
        }
        return next;
      });
    },
    [],
  );

  // Current categories based on selected type
  const currentCategories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="space-y-6">
      {/* ====== Stats Cards ====== */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total Income */}
        <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 animate-card-enter hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Wallet className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-emerald-600 dark:text-emerald-400">إجمالي الدخل</p>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 tabular truncate">
                  {formatCurrency(stats.totalIncome)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card className="border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 animate-card-enter hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/30">
                <Receipt className="size-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-rose-600 dark:text-rose-400">إجمالي المصروفات</p>
                <p className="text-lg font-bold text-rose-700 dark:text-rose-300 tabular truncate">
                  {formatCurrency(stats.totalExpenses)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Balance */}
        <Card
          className={`animate-card-enter hover-lift ${
            stats.netBalance >= 0
              ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20'
              : 'border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20'
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                  stats.netBalance >= 0
                    ? 'bg-emerald-100 dark:bg-emerald-900/30'
                    : 'bg-rose-100 dark:bg-rose-900/30'
                }`}
              >
                {stats.netBalance >= 0 ? (
                  <TrendingUp className="size-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <TrendingDown className="size-5 text-rose-600 dark:text-rose-400" />
                )}
              </div>
              <div className="min-w-0">
                <p
                  className={`text-xs ${
                    stats.netBalance >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  الرصيد الصافي
                </p>
                <p
                  className={`text-lg font-bold tabular truncate ${
                    stats.netBalance >= 0
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {formatCurrency(Math.abs(stats.netBalance))}
                  {stats.netBalance < 0 && (
                    <span className="text-xs font-normal mr-1">(عجز)</span>
                  )}
                  {stats.netBalance > 0 && (
                    <span className="text-xs font-normal mr-1">(فائض)</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* This Month Total */}
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 animate-card-enter hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Calendar className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-amber-600 dark:text-amber-400">هذا الشهر</p>
                <p
                  className={`text-lg font-bold tabular truncate ${
                    stats.thisMonthTotal >= 0
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {stats.thisMonthTotal >= 0 ? '+' : ''}
                  {formatCurrency(stats.thisMonthTotal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ====== Monthly Summary Chart (CSS only) ====== */}
      {records.length > 0 && (
        <Card className="glass-card animate-card-enter">
          <CardHeader className="border-b border-emerald-100 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 px-6 py-4">
            <div className="flex items-center gap-2">
              <Wallet className="size-5 text-emerald-600 dark:text-emerald-400" />
              <CardTitle className="text-lg text-emerald-700 dark:text-emerald-300">
                ملخص الأشهر الأخيرة
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {monthlyData.map((month) => (
                <div key={month.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground min-w-[60px]">
                      {month.label}
                    </span>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground tabular">
                      <span className="flex items-center gap-1">
                        <ArrowUpCircle className="size-3 text-emerald-500" />
                        {formatCurrency(month.income)}
                      </span>
                      <span className="flex items-center gap-1">
                        <ArrowDownCircle className="size-3 text-rose-500" />
                        {formatCurrency(month.expenses)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 items-end">
                    {/* Income bar */}
                    <div className="flex-1 flex justify-end">
                      <div
                        className="h-6 rounded-l-md bg-gradient-to-l from-emerald-400 to-emerald-500 dark:from-emerald-500 dark:to-emerald-600 transition-all duration-500 ease-out min-w-[2px]"
                        style={{
                          width: month.income > 0
                            ? `${Math.max(4, (month.income / maxMonthlyAmount) * 100)}%`
                            : '2px',
                        }}
                      />
                    </div>
                    {/* Expenses bar */}
                    <div className="flex-1 flex justify-end">
                      <div
                        className="h-6 rounded-l-md bg-gradient-to-l from-rose-400 to-rose-500 dark:from-rose-500 dark:to-rose-600 transition-all duration-500 ease-out min-w-[2px]"
                        style={{
                          width: month.expenses > 0
                            ? `${Math.max(4, (month.expenses / maxMonthlyAmount) * 100)}%`
                            : '2px',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {/* Legend */}
              <div className="flex items-center justify-center gap-6 pt-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="size-3 rounded bg-gradient-to-l from-emerald-400 to-emerald-500 dark:from-emerald-500 dark:to-emerald-600" />
                  <span>دخل</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="size-3 rounded bg-gradient-to-l from-rose-400 to-rose-500 dark:from-rose-500 dark:to-rose-600" />
                  <span>مصروفات</span>
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
                  placeholder="بحث بالوصف أو الفئة أو المبلغ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-9"
                />
              </div>

              {/* Type Filter Pills */}
              <div className="flex items-center gap-1 rounded-lg border border-emerald-200 dark:border-emerald-800 p-0.5">
                {([
                  { value: 'all' as TypeFilter, label: 'الكل' },
                  { value: 'income' as TypeFilter, label: 'دخل' },
                  { value: 'expense' as TypeFilter, label: 'مصروفات' },
                ]).map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setTypeFilter(f.value)}
                    className={`
                      rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150
                      ${typeFilter === f.value
                        ? 'bg-emerald-600 text-white shadow-sm'
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
            <Button onClick={openAddDialog} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="size-4" />
              إضافة سجل مالي
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ====== Data Table ====== */}
      <Card className="glass-card animate-card-enter">
        <CardHeader className="border-b border-emerald-100 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="size-5 text-emerald-600 dark:text-emerald-400" />
              <CardTitle className="text-lg text-emerald-700 dark:text-emerald-300">
                السجلات المالية
              </CardTitle>
            </div>
            <Badge
              variant="outline"
              className="text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700"
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
                icon={<Wallet />}
                title="لا توجد سجلات مالية"
                description="ابدأ بتسجيل الدخل والمصروفات"
                action={{
                  label: 'إضافة أول سجل',
                  onClick: openAddDialog,
                }}
              />
            ) : (
              <EmptyState
                icon={<Search />}
                title="لا توجد نتائج مطابقة"
                description="جرب تغيير كلمات البحث أو فلتر النوع للعثور على السجل المطلوب"
                action={{
                  label: 'مسح الفلاتر',
                  onClick: () => {
                    setSearchQuery('');
                    setTypeFilter('all');
                  },
                }}
              />
            )
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-emerald-50 dark:bg-muted">
                  <TableRow className="border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-muted">
                    <SortHeader
                      label="التاريخ"
                      field="date"
                      currentField={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    <TableHead className="text-right text-emerald-700 dark:text-emerald-300 font-semibold">
                      النوع
                    </TableHead>
                    <SortHeader
                      label="الفئة"
                      field="category"
                      currentField={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    <SortHeader
                      label="المبلغ"
                      field="amount"
                      currentField={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    <TableHead className="text-right text-emerald-700 dark:text-emerald-300 font-semibold hidden md:table-cell">
                      الوصف
                    </TableHead>
                    <TableHead className="text-center text-emerald-700 dark:text-emerald-300 font-semibold">
                      الإجراءات
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow
                      key={record.id}
                      className="border-emerald-100 dark:border-emerald-800/50 transition-colors hover:bg-emerald-50/60 dark:hover:bg-emerald-950/10"
                    >
                      <TableCell className="text-xs text-muted-foreground tabular whitespace-nowrap">
                        {formatShortDate(record.date)}
                      </TableCell>
                      <TableCell>
                        {record.type === 'income' ? (
                          <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30">
                            <ArrowUpCircle className="size-3" />
                            دخل
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900/30">
                            <ArrowDownCircle className="size-3" />
                            مصروف
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-foreground">
                        {getCategoryLabel(record.category)}
                      </TableCell>
                      <TableCell
                        className={`font-semibold tabular whitespace-nowrap ${
                          record.type === 'income'
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : 'text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {record.type === 'income' ? '+' : '-'}
                        {formatCurrency(record.amount)}
                      </TableCell>
                      <TableCell className="hidden max-w-[200px] text-sm text-muted-foreground md:table-cell">
                        <span className="line-clamp-1" title={record.description}>
                          {record.description || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-700"
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
                            <Edit className="size-4" />
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
                  ))}
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
            <DialogTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <Wallet className="size-5" />
              {editingRecord ? 'تعديل سجل مالي' : 'إضافة سجل مالي جديد'}
            </DialogTitle>
            <DialogDescription>
              {editingRecord
                ? 'قم بتعديل بيانات السجل المالي ثم اضغط حفظ'
                : 'أدخل بيانات المعاملة المالية الجديدة'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Type Selector */}
            <div className="space-y-2">
              <Label className="text-emerald-700 dark:text-emerald-300 font-medium">
                نوع المعاملة *
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateField('type', 'income')}
                  className={`
                    flex items-center justify-center gap-2 rounded-lg border-2 p-3 transition-all duration-200
                    ${formData.type === 'income'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 shadow-sm'
                      : 'border-muted hover:border-emerald-300 dark:hover:border-emerald-700 text-muted-foreground'
                    }
                  `}
                >
                  <ArrowUpCircle className={`size-5 ${formData.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
                  <span className="font-medium">دخل</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateField('type', 'expense')}
                  className={`
                    flex items-center justify-center gap-2 rounded-lg border-2 p-3 transition-all duration-200
                    ${formData.type === 'expense'
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 shadow-sm'
                      : 'border-muted hover:border-rose-300 dark:hover:border-rose-700 text-muted-foreground'
                    }
                  `}
                >
                  <ArrowDownCircle className={`size-5 ${formData.type === 'expense' ? 'text-rose-600 dark:text-rose-400' : ''}`} />
                  <span className="font-medium">مصروف</span>
                </button>
              </div>
            </div>

            {/* Category + Amount */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fin-category" className="text-emerald-700 dark:text-emerald-300 font-medium">
                  الفئة *
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => updateField('category', val)}
                >
                  <SelectTrigger className="w-full border-emerald-200 dark:border-emerald-800 focus-visible:ring-emerald-400">
                    <SelectValue placeholder={formData.type === 'income' ? 'اختر فئة الدخل' : 'اختر فئة المصروف'} />
                  </SelectTrigger>
                  <SelectContent>
                    {currentCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fin-amount" className="text-emerald-700 dark:text-emerald-300 font-medium">
                  المبلغ (ر.س) *
                </Label>
                <div className="relative">
                  <Input
                    id="fin-amount"
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    value={formData.amount || ''}
                    onChange={(e) => updateField('amount', Math.max(0, parseFloat(e.target.value) || 0))}
                    className="border-emerald-200 dark:border-emerald-800 focus-visible:ring-emerald-400 tabular text-left pl-12"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                    ر.س
                  </span>
                </div>
              </div>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="fin-date" className="text-emerald-700 dark:text-emerald-300 font-medium">
                التاريخ
              </Label>
              <Input
                id="fin-date"
                type="date"
                value={formData.date}
                onChange={(e) => updateField('date', e.target.value)}
                className="border-emerald-200 dark:border-emerald-800 focus-visible:ring-emerald-400"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="fin-description" className="text-emerald-700 dark:text-emerald-300 font-medium">
                الوصف
              </Label>
              <Input
                id="fin-description"
                placeholder="وصف مختصر للمعاملة..."
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                className="border-emerald-200 dark:border-emerald-800 focus-visible:ring-emerald-400"
              />
            </div>

            <Separator className="bg-emerald-100 dark:bg-emerald-800" />

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="fin-notes" className="text-emerald-700 dark:text-emerald-300 font-medium">
                ملاحظات
              </Label>
              <Textarea
                id="fin-notes"
                placeholder="ملاحظات إضافية (اختياري)..."
                rows={3}
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                className="border-emerald-200 dark:border-emerald-800 focus-visible:ring-emerald-400 resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.category || formData.amount <= 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="mr-2 size-4" />
              {editingRecord ? 'حفظ التعديلات' : 'إضافة السجل'}
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
              هل أنت متأكد من حذف سجل{' '}
              <span className="font-bold text-red-600">
                {deleteTarget?.type === 'income' ? 'الدخل' : 'المصروف'}
              </span>
              {' '}بمبلغ{' '}
              <span className="font-bold text-red-600">
                {deleteTarget ? formatCurrency(deleteTarget.amount) : ''}
              </span>
              {' '}({deleteTarget ? getCategoryLabel(deleteTarget.category) : ''})؟ لا يمكن التراجع عن هذا الإجراء.
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
            <DialogTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <Wallet className="size-5" />
              تفاصيل السجل المالي
            </DialogTitle>
            <DialogDescription>
              {detailTarget
                ? detailTarget.type === 'income'
                  ? 'سجل دخل'
                  : 'سجل مصروف'
                : ''}
            </DialogDescription>
          </DialogHeader>

          {detailTarget && (
            <div className="space-y-4">
              {/* Type & Category Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">النوع</p>
                  {detailTarget.type === 'income' ? (
                    <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700">
                      <ArrowUpCircle className="size-3" />
                      دخل
                    </Badge>
                  ) : (
                    <Badge className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700">
                      <ArrowDownCircle className="size-3" />
                      مصروف
                    </Badge>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">الفئة</p>
                  <p className="text-sm text-foreground font-medium">
                    {getCategoryLabel(detailTarget.category)}
                  </p>
                </div>
              </div>

              <Separator className="bg-emerald-100 dark:bg-emerald-800" />

              {/* Amount */}
              <div className="rounded-lg p-4 bg-muted/50">
                <p className="text-xs font-medium text-muted-foreground mb-1">المبلغ</p>
                <p
                  className={`text-2xl font-bold tabular ${
                    detailTarget.type === 'income'
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {detailTarget.type === 'income' ? '+' : '-'}
                  {formatCurrency(detailTarget.amount)}
                </p>
              </div>

              <Separator className="bg-emerald-100 dark:bg-emerald-800" />

              {/* Details */}
              <DetailRow
                icon={<Calendar className="size-4 text-emerald-500" />}
                label="التاريخ"
                value={formatDateArabic(detailTarget.date)}
              />
              <DetailRow
                icon={<Receipt className="size-4 text-emerald-500" />}
                label="الوصف"
                value={detailTarget.description}
                multiline
              />
              {detailTarget.notes && (
                <>
                  <Separator className="bg-emerald-100 dark:bg-emerald-800" />
                  <DetailRow
                    icon={<Wallet className="size-4 text-emerald-500" />}
                    label="ملاحظات"
                    value={detailTarget.notes}
                    multiline
                  />
                </>
              )}

              <Separator className="bg-emerald-100 dark:bg-emerald-800" />

              {/* Timestamps */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>تاريخ التسجيل: {formatShortDate(detailTarget.createdAt)}</span>
                {detailTarget.updatedAt !== detailTarget.createdAt && (
                  <span>آخر تعديل: {formatShortDate(detailTarget.updatedAt)}</span>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              className="border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              onClick={() => setDetailTarget(null)}
            >
              إغلاق
            </Button>
            {detailTarget && (
              <>
                <Button
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => {
                    openEditDialog(detailTarget);
                    setDetailTarget(null);
                  }}
                >
                  <Edit className="mr-2 size-4" />
                  تعديل
                </Button>
                <Button
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  onClick={() => {
                    setDeleteTarget(detailTarget);
                    setDetailTarget(null);
                  }}
                >
                  <Trash2 className="mr-2 size-4" />
                  حذف
                </Button>
              </>
            )}
          </DialogFooter>
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
      className="text-right text-emerald-700 dark:text-emerald-300 font-semibold cursor-pointer select-none hover:text-emerald-800 dark:hover:text-emerald-200 transition-colors"
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
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-emerald-50 dark:bg-emerald-950/20">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">{label}</p>
        {multiline ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {value || '—'}
          </p>
        ) : (
          <p className="text-sm text-foreground">{value || '—'}</p>
        )}
      </div>
    </div>
  );
}
