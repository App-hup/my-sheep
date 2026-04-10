'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  PregnancyRecord,
  BirthRecord,
  BirthGender,
} from '@/lib/types';
import {
  generateId,
  addMonthsToDate,
  formatShortDate,
  calculateAgeInMonths,
} from '@/lib/storage';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import EmptyState from '@/components/ui/empty-state';
import {
  Plus,
  Edit,
  Trash2,
  Baby,
  CalendarCheck,
  Search,
  Filter,
  Stethoscope,
  Clock,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────

interface PregnancyTrackerProps {
  records: PregnancyRecord[];
  onRecordsChange: (records: PregnancyRecord[]) => void;
  onBirthsGenerated: (births: BirthRecord[]) => void;
}

interface FormData {
  sheepNumber: string;
  status: 'monitored' | 'unmonitored';
  monitoringDate: string;
  firstExamDate: string;
  firstExamResult: 'yes' | 'no' | '';
  secondExamDate: string;
  secondExamResult: 'yes' | 'no' | '';
  pregnancyPeriod: number;
  expectedBirthDate: string;
  birthDate: string;
  maleCount: number;
  femaleCount: number;
}

const EMPTY_FORM: FormData = {
  sheepNumber: '',
  status: 'monitored',
  monitoringDate: '',
  firstExamDate: '',
  firstExamResult: '',
  secondExamDate: '',
  secondExamResult: '',
  pregnancyPeriod: 0,
  expectedBirthDate: '',
  birthDate: '',
  maleCount: 0,
  femaleCount: 0,
};

type FilterStatus = 'all' | 'monitored' | 'unmonitored' | 'confirmed' | 'delivered';

// ─── Helper: Pregnancy progress ──────────────────────────────────────

function getPregnancyProgress(startDate: string, expectedBirthDate: string): number {
  if (!startDate || !expectedBirthDate) return 0;
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(expectedBirthDate);
  const total = end.getTime() - start.getTime();
  if (total <= 0) return 100;
  const elapsed = now.getTime() - start.getTime();
  const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
  return Math.round(pct);
}

// ─── Helper: Days until expected birth ──────────────────────────────

function getDaysUntilBirth(expectedBirthDate: string): { days: number; status: 'upcoming' | 'imminent' | 'overdue' | 'delivered' } | null {
  if (!expectedBirthDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(expectedBirthDate);
  target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - now.getTime();
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (days > 7) return { days, status: 'upcoming' };
  if (days >= 0) return { days, status: 'imminent' };
  return { days: Math.abs(days), status: 'overdue' };
}

// ─── Component ───────────────────────────────────────────────────────

export default function PregnancyTracker({
  records,
  onRecordsChange,
  onBirthsGenerated,
}: PregnancyTrackerProps) {
  // State
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  // ─── Form updater helper ────────────────────────────────────────

  const updateField = <K extends keyof FormData>(
    key: K,
    value: FormData[K]
  ) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };

      // When monitoringDate changes, auto-calculate expected birth date (5 months)
      if (key === 'monitoringDate') {
        if (value) {
          next.pregnancyPeriod = 5;
          next.expectedBirthDate = addMonthsToDate(value, 5);
        } else {
          next.pregnancyPeriod = 0;
          next.expectedBirthDate = '';
        }
      }

      // When firstExamResult changes, manage second exam scheduling
      if (key === 'firstExamResult') {
        if (value === 'yes') {
          next.secondExamDate = '';
          next.secondExamResult = '';
        } else if (value === 'no' && next.firstExamDate) {
          next.secondExamDate = next.secondExamDate || addMonthsToDate(next.firstExamDate, 2);
        }
      }

      // When secondExamResult changes — just track status, date comes from monitoringDate
      // (expectedBirthDate is already calculated from monitoringDate)

      // When firstExamDate changes, suggest second exam date if needed
      if (key === 'firstExamDate' && value && next.firstExamResult === 'no') {
        next.secondExamDate = next.secondExamDate || addMonthsToDate(value, 2);
      }

      return next;
    });
  };

  // ─── Filtered & searched records ────────────────────────────────

  const filteredRecords = useMemo(() => {
    let result = [...records];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((r) =>
        r.sheepNumber.toLowerCase().includes(q)
      );
    }

    // Filter
    if (filterStatus === 'monitored') {
      result = result.filter((r) => r.status === 'monitored');
    } else if (filterStatus === 'unmonitored') {
      result = result.filter((r) => r.status === 'unmonitored');
    } else if (filterStatus === 'confirmed') {
      result = result.filter(
        (r) =>
          r.firstExamResult === 'yes' ||
          (r.firstExamResult === 'no' && r.secondExamResult === 'yes')
      );
    } else if (filterStatus === 'delivered') {
      result = result.filter((r) => r.birthDate);
    }

    // Sort by createdAt descending
    result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return result;
  }, [records, searchQuery, filterStatus]);

  // ─── Stats ──────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const confirmed = records.filter(
      (r) =>
        r.firstExamResult === 'yes' ||
        (r.firstExamResult === 'no' && r.secondExamResult === 'yes')
    ).length;
    const delivered = records.filter((r) => r.birthDate).length;
    const pending = records.filter(
      (r) =>
        !r.birthDate &&
        (r.firstExamResult === 'yes' ||
          (r.firstExamResult === 'no' && r.secondExamResult === 'yes'))
    ).length;
    return { total: records.length, confirmed, delivered, pending };
  }, [records]);

  // ─── CRUD Handlers ──────────────────────────────────────────────

  const openAddDialog = useCallback(() => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((record: PregnancyRecord) => {
    setForm({
      sheepNumber: record.sheepNumber,
      status: record.status,
      monitoringDate: record.monitoringDate,
      firstExamDate: record.firstExamDate,
      firstExamResult: record.firstExamResult,
      secondExamDate: record.secondExamDate,
      secondExamResult: record.secondExamResult,
      pregnancyPeriod: record.pregnancyPeriod,
      expectedBirthDate: record.expectedBirthDate,
      birthDate: record.birthDate,
      maleCount: record.maleCount,
      femaleCount: record.femaleCount,
    });
    setEditingId(record.id);
    setDialogOpen(true);
  }, []);

  const generateBirthRecords = (
    formData: FormData,
    pregnancyId: string
  ): BirthRecord[] => {
    const births: BirthRecord[] = [];
    const now = new Date().toISOString();

    for (let i = 0; i < formData.maleCount; i++) {
      births.push({
        id: generateId() + '_m' + i,
        number: `${formData.sheepNumber}-م${i + 1}`,
        gender: 'male' as BirthGender,
        birthDate: formData.birthDate,
        ageInMonths: calculateAgeInMonths(formData.birthDate),
        purpose: 'breeding',
        fromPregnancy: true,
        pregnancyId,
        createdAt: now,
      });
    }

    for (let i = 0; i < formData.femaleCount; i++) {
      births.push({
        id: generateId() + '_f' + i,
        number: `${formData.sheepNumber}-أ${i + 1}`,
        gender: 'female' as BirthGender,
        birthDate: formData.birthDate,
        ageInMonths: calculateAgeInMonths(formData.birthDate),
        purpose: 'breeding',
        fromPregnancy: true,
        pregnancyId,
        createdAt: now,
      });
    }

    return births;
  };

  const handleSubmit = useCallback(() => {
    if (!form.sheepNumber.trim()) return;
    if (!form.monitoringDate) return;

    const now = new Date().toISOString();

    if (editingId) {
      // Update
      const updated = records.map((r) => {
        if (r.id !== editingId) return r;
        const updatedRecord: PregnancyRecord = {
          ...r,
          ...form,
          updatedAt: now,
        };
        return updatedRecord;
      });
      onRecordsChange(updated);

      // If birth info was added, generate births
      if (form.birthDate) {
        const newBirths = generateBirthRecords(form, editingId);
        if (newBirths.length > 0) {
          onBirthsGenerated(newBirths);
        }
      }
    } else {
      // Create
      const newRecord: PregnancyRecord = {
        id: generateId(),
        ...form,
        createdAt: now,
        updatedAt: now,
      };
      onRecordsChange([...records, newRecord]);

      // If birth info was added, generate births
      if (form.birthDate) {
        const newBirths = generateBirthRecords(form, newRecord.id);
        if (newBirths.length > 0) {
          onBirthsGenerated(newBirths);
        }
      }
    }

    setDialogOpen(false);
    setForm(EMPTY_FORM);
    setEditingId(null);
  }, [form, editingId, records, onRecordsChange, onBirthsGenerated]);

  const handleDelete = useCallback(() => {
    if (!deleteId) return;
    onRecordsChange(records.filter((r) => r.id !== deleteId));
    setDeleteId(null);
  }, [deleteId, records, onRecordsChange]);

  // ─── Status badge renderer ──────────────────────────────────────

  const renderStatusBadge = (record: PregnancyRecord) => {
    const isConfirmed =
      record.firstExamResult === 'yes' ||
      (record.firstExamResult === 'no' && record.secondExamResult === 'yes');
    const isDelivered = !!record.birthDate;

    if (isDelivered) {
      return (
        <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30">
          <Baby className="size-3" />
          تمت الولادة
        </Badge>
      );
    }
    if (isConfirmed) {
      return (
        <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30">
          <CalendarCheck className="size-3" />
          حمل مؤكد
        </Badge>
      );
    }
    if (record.status === 'monitored') {
      return (
        <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/30">
          تحت المراقبة
        </Badge>
      );
    }
    return (
      <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900/30">
        غير مراقبة
      </Badge>
    );
  };

  // ─── Exam result label ──────────────────────────────────────────

  const examResultLabel = (val: 'yes' | 'no' | '') => {
    if (val === 'yes') return 'نعم';
    if (val === 'no') return 'لا';
    return '—';
  };

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Stats Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-emerald-100 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Stethoscope className="size-4 text-emerald-700 dark:text-emerald-300" />
              </div>
              <div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">إجمالي السجلات</p>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-100 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <CalendarCheck className="size-4 text-blue-700 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-xs text-blue-600 dark:text-blue-400">حمل مؤكد</p>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{stats.confirmed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-100 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Clock className="size-4 text-amber-700 dark:text-amber-300" />
              </div>
              <div>
                <p className="text-xs text-amber-600 dark:text-amber-400">بانتظار الولادة</p>
                <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Baby className="size-4 text-emerald-700 dark:text-emerald-300" />
              </div>
              <div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">تمت الولادة</p>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{stats.delivered}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              {/* Search */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="بحث برقم الخروف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-9"
                />
              </div>

              {/* Filter */}
              <Select
                value={filterStatus}
                onValueChange={(val) => setFilterStatus(val as FilterStatus)}
              >
                <SelectTrigger className="w-full sm:w-44">
                  <Filter className="size-4 ml-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="monitored">تحت المراقبة</SelectItem>
                  <SelectItem value="unmonitored">غير مراقبة</SelectItem>
                  <SelectItem value="confirmed">حمل مؤكد</SelectItem>
                  <SelectItem value="delivered">تمت الولادة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Add button */}
            <Button onClick={openAddDialog} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="size-4" />
              إضافة سجل جديد
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Data Table ───────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          {filteredRecords.length === 0 ? (
            /* Empty state */
            <EmptyState
              icon={<Baby />}
              title={searchQuery || filterStatus !== 'all' ? 'لا توجد نتائج' : 'لا توجد سجلات'}
              description={searchQuery || filterStatus !== 'all'
                ? 'لا توجد نتائج مطابقة للبحث أو التصفية'
                : 'ابدأ بإضافة سجل تتبع حمل جديد'}
              action={!searchQuery && filterStatus === 'all' ? {
                label: 'إضافة أول سجل',
                onClick: openAddDialog,
              } : undefined}
            />
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="text-right">رقم الخروف</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">تاريخ الرصد</TableHead>
                    <TableHead className="text-right">فحص أول</TableHead>
                    <TableHead className="text-right">فحص ثانٍ</TableHead>
                    <TableHead className="text-right min-w-[140px]">تقدم الحمل</TableHead>
                    <TableHead className="text-right">الولادة المتوقعة</TableHead>
                    <TableHead className="text-right">الولادة الفعلية</TableHead>
                    <TableHead className="text-right">المواليد</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => {
                    // Progress calculated from monitoringDate (تاريخ الرصد)
                    const progress = getPregnancyProgress(
                      record.monitoringDate,
                      record.expectedBirthDate
                    );

                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {record.sheepNumber}
                        </TableCell>
                        <TableCell>{renderStatusBadge(record)}</TableCell>
                        <TableCell>
                          {formatShortDate(record.monitoringDate) || '—'}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <span>{formatShortDate(record.firstExamDate) || '—'}</span>
                            <span className="text-muted-foreground mx-1">|</span>
                            <span
                              className={
                                record.firstExamResult === 'yes'
                                  ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                                  : record.firstExamResult === 'no'
                                    ? 'text-red-500 dark:text-red-400'
                                    : 'text-muted-foreground'
                              }
                            >
                              {examResultLabel(record.firstExamResult)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            {record.firstExamResult === 'no' ? (
                              <>
                                <span>{formatShortDate(record.secondExamDate) || '—'}</span>
                                <span className="text-muted-foreground mx-1">|</span>
                                <span
                                  className={
                                    record.secondExamResult === 'yes'
                                      ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                                      : record.secondExamResult === 'no'
                                        ? 'text-red-500 dark:text-red-400'
                                        : 'text-muted-foreground'
                                  }
                                >
                                  {examResultLabel(record.secondExamResult)}
                                </span>
                              </>
                            ) : (
                              <span className="text-muted-foreground">لا يحتاج</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {record.expectedBirthDate && !record.birthDate ? (
                            <div className="space-y-1">
                              <Progress
                                value={progress}
                                className="h-2 bg-emerald-100 dark:bg-emerald-900/30 [&>div]:bg-gradient-to-r [&>div]:from-emerald-400 [&>div]:to-emerald-600"
                              />
                              <p className="text-xs text-muted-foreground text-center">
                                {progress}%
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {record.expectedBirthDate ? (
                            <div className="space-y-1">
                              <span>{formatShortDate(record.expectedBirthDate)}</span>
                              {!record.birthDate && (() => {
                                const birthInfo = getDaysUntilBirth(record.expectedBirthDate);
                                if (!birthInfo) return null;
                                if (birthInfo.status === 'overdue') {
                                  return (
                                    <p className="text-xs font-medium text-red-600 dark:text-red-400">
                                      متأخر {birthInfo.days} يوم ⚠️
                                    </p>
                                  );
                                }
                                if (birthInfo.status === 'imminent') {
                                  return (
                                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                                      متبقي {birthInfo.days === 0 ? 'اليوم!' : `${birthInfo.days} يوم`} 🔥
                                    </p>
                                  );
                                }
                                return (
                                  <p className="text-xs text-muted-foreground">
                                    متبقي {birthInfo.days} يوم
                                  </p>
                                );
                              })()}
                            </div>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatShortDate(record.birthDate) || '—'}
                        </TableCell>
                        <TableCell>
                          {record.birthDate ? (
                            <div className="flex gap-1 text-xs">
                              <span className="rounded bg-blue-50 dark:bg-blue-950/30 px-1.5 py-0.5 text-blue-700 dark:text-blue-300">
                                ♂ {record.maleCount}
                              </span>
                              <span className="rounded bg-pink-50 dark:bg-pink-950/30 px-1.5 py-0.5 text-pink-700 dark:text-pink-300">
                                ♀ {record.femaleCount}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                              onClick={() => openEditDialog(record)}
                            >
                              <Edit className="size-4" />
                              <span className="sr-only">تعديل</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                              onClick={() => setDeleteId(record.id)}
                            >
                              <Trash2 className="size-4" />
                              <span className="sr-only">حذف</span>
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

      {/* ── Add / Edit Dialog ────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-emerald-700 dark:text-emerald-300">
              {editingId ? 'تعديل سجل متابعة الحمل' : 'إضافة سجل متابعة حمل جديد'}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? 'قم بتعديل بيانات سجل متابعة الحمل'
                : 'أدخل بيانات متابعة الحمل للخروف'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* ── Section 1: Basic Info ─────────────────────────── */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 border-b border-emerald-100 dark:border-emerald-800 pb-2">
                المعلومات الأساسية
              </h4>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Sheep Number */}
                <div className="space-y-2">
                  <Label htmlFor="sheepNumber">رقم الخروف *</Label>
                  <Input
                    id="sheepNumber"
                    placeholder="أدخل رقم الخروف"
                    value={form.sheepNumber}
                    onChange={(e) => updateField('sheepNumber', e.target.value)}
                  />
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label>الحالة</Label>
                  <RadioGroup
                    value={form.status}
                    onValueChange={(val) => updateField('status', val as 'monitored' | 'unmonitored')}
                    className="flex gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="monitored" id="status-monitored" />
                      <Label htmlFor="status-monitored" className="font-normal cursor-pointer">
                        تحت المراقبة
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="unmonitored" id="status-unmonitored" />
                      <Label htmlFor="status-unmonitored" className="font-normal cursor-pointer">
                        غير مراقبة
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              {/* Monitoring Date */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="monitoringDate">تاريخ الرصد *</Label>
                  <Input
                    id="monitoringDate"
                    type="date"
                    value={form.monitoringDate}
                    onChange={(e) => updateField('monitoringDate', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    يتم حساب وقت الولادة المتوقع من هذا التاريخ (5 أشهر)
                  </p>
                </div>
              </div>

              {/* Auto-calculated expected birth date from monitoring date */}
              {form.monitoringDate && form.expectedBirthDate && (
                <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        وقت الولادة المتوقع — فترة الحمل: 5 أشهر
                      </span>
                    </div>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      تاريخ الرصد:{' '}
                      <span className="font-medium">{formatShortDate(form.monitoringDate)}</span>
                      {' → '}
                      تاريخ الولادة المتوقع:{' '}
                      <span className="font-bold text-base">{formatShortDate(form.expectedBirthDate)}</span>
                    </p>
                    {(() => {
                      const info = getDaysUntilBirth(form.expectedBirthDate);
                      if (!info) return null;
                      return (
                        <p className="mt-1 text-xs font-medium">
                          {info.status === 'overdue' && (
                            <span className="text-red-600 dark:text-red-400">
                              متأخر {info.days} يوم ⚠️
                            </span>
                          )}
                          {info.status === 'imminent' && (
                            <span className="text-amber-600 dark:text-amber-400">
                              متبقي {info.days === 0 ? 'اليوم!' : `${info.days} يوم`} 🔥
                            </span>
                          )}
                          {info.status === 'upcoming' && (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              متبقي {info.days} يوم
                            </span>
                          )}
                        </p>
                      );
                    })()}
                    <div className="mt-2 space-y-1">
                      <Progress
                        value={getPregnancyProgress(form.monitoringDate, form.expectedBirthDate)}
                        className="h-3 bg-emerald-100 dark:bg-emerald-900/30 [&>div]:bg-gradient-to-r [&>div]:from-emerald-400 [&>div]:to-emerald-600"
                      />
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 text-center">
                        تقدم الحمل: {getPregnancyProgress(form.monitoringDate, form.expectedBirthDate)}%
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* ── Section 2: First Exam ─────────────────────────── */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 border-b border-emerald-100 dark:border-emerald-800 pb-2">
                الفحص الأول
              </h4>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstExamDate">تاريخ الفحص الأول</Label>
                  <Input
                    id="firstExamDate"
                    type="date"
                    value={form.firstExamDate}
                    onChange={(e) => updateField('firstExamDate', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firstExamResult">نتيجة الفحص الأول</Label>
                  <Select
                    value={form.firstExamResult}
                    onValueChange={(val) =>
                      updateField('firstExamResult', val as 'yes' | 'no' | '')
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="اختر النتيجة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">نعم (إيجابي)</SelectItem>
                      <SelectItem value="no">لا (سلبي)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Status info when first exam = yes */}
              {form.firstExamResult === 'yes' && (
                <Card className="border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/20">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="size-4 text-sky-600 dark:text-sky-400" />
                      <span className="text-sm font-medium text-sky-700 dark:text-sky-300">
                        الفحص الأول إيجابي — الحمل مؤكد ✓
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* ── Section 3: Second Exam ────────────────────────── */}
            {form.firstExamResult === 'no' && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 border-b border-emerald-100 dark:border-emerald-800 pb-2">
                  الفحص الثاني (بعد شهرين من الفحص الأول)
                </h4>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="secondExamDate">تاريخ الفحص الثاني</Label>
                    <Input
                      id="secondExamDate"
                      type="date"
                      value={form.secondExamDate}
                      onChange={(e) => updateField('secondExamDate', e.target.value)}
                    />
                    {form.firstExamDate && (
                      <p className="text-xs text-muted-foreground">
                        المقترح: {formatShortDate(addMonthsToDate(form.firstExamDate, 2))}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondExamResult">نتيجة الفحص الثاني</Label>
                    <Select
                      value={form.secondExamResult}
                      onValueChange={(val) =>
                        updateField('secondExamResult', val as 'yes' | 'no' | '')
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="اختر النتيجة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">نعم (إيجابي)</SelectItem>
                        <SelectItem value="no">لا (سلبي)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Status info when second exam = yes */}
                {form.secondExamResult === 'yes' && (
                  <Card className="border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/20">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="size-4 text-sky-600 dark:text-sky-400" />
                        <span className="text-sm font-medium text-sky-700 dark:text-sky-300">
                          الفحص الثاني إيجابي — الحمل مؤكد ✓
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {form.secondExamResult === 'no' && (
                  <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
                    <CardContent className="p-4">
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        الفحص الثاني سلبي — الخروف غير حامل.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* ── Section 4: Birth Info ─────────────────────────── */}
            {form.expectedBirthDate && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 border-b border-emerald-100 dark:border-emerald-800 pb-2">
                  معلومات الولادة
                </h4>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">تاريخ الولادة الفعلي</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={form.birthDate}
                      onChange={(e) => updateField('birthDate', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="maleCount">عدد الذكور</Label>
                      <Input
                        id="maleCount"
                        type="number"
                        min={0}
                        value={form.maleCount}
                        onChange={(e) => updateField('maleCount', Math.max(0, parseInt(e.target.value) || 0))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="femaleCount">عدد الإناث</Label>
                      <Input
                        id="femaleCount"
                        type="number"
                        min={0}
                        value={form.femaleCount}
                        onChange={(e) =>
                          updateField('femaleCount', Math.max(0, parseInt(e.target.value) || 0))
                        }
                      />
                    </div>
                  </div>
                </div>

                {form.birthDate && (form.maleCount > 0 || form.femaleCount > 0) && (
                  <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Baby className="size-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                          سيتم إنشاء سجلات مواليد تلقائياً
                        </span>
                      </div>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        {form.maleCount > 0 && `${form.maleCount} ذكر${form.maleCount > 1 ? '' : ''}`}
                        {form.maleCount > 0 && form.femaleCount > 0 && ' و '}
                        {form.femaleCount > 0 && `${form.femaleCount} أنثى${form.femaleCount > 1 ? '' : ''}`}
                        {' — الغرض: تربية'}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.sheepNumber.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {editingId ? 'حفظ التعديلات' : 'إضافة السجل'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ─────────────────────────────────── */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف سجل متابعة الحمل هذا؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
