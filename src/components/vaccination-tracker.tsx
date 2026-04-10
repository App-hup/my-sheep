'use client';

import { useState, useMemo, useCallback } from 'react';
import type { VaccinationRecord } from '@/lib/types';
import { generateId, formatShortDate } from '@/lib/storage';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import EmptyState from '@/components/ui/empty-state';
import {
  Plus,
  Edit,
  Trash2,
  Syringe,
  Search,
  FileText,
  Activity,
  CalendarCheck,
  AlertTriangle,
  UserCheck,
  ClipboardList,
  Clock,
  Eye,
} from 'lucide-react';

// ============================================================
// Props
// ============================================================

interface VaccinationTrackerProps {
  records: VaccinationRecord[];
  onRecordsChange: (records: VaccinationRecord[]) => void;
}

// ============================================================
// Initial / Empty Form
// ============================================================

interface FormData {
  sheepNumber: string;
  vaccineName: string;
  vaccinationDate: string;
  nextDueDate: string;
  doseNumber: number;
  veterinarian: string;
  notes: string;
}

const EMPTY_FORM: FormData = {
  sheepNumber: '',
  vaccineName: '',
  vaccinationDate: '',
  nextDueDate: '',
  doseNumber: 1,
  veterinarian: '',
  notes: '',
};

// ============================================================
// Helpers
// ============================================================

function truncate(str: string, max: number): string {
  if (!str) return '—';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

function computeStatus(nextDueDate: string, vaccinationDate: string): VaccinationRecord['status'] {
  if (!nextDueDate) {
    return vaccinationDate ? 'completed' : 'scheduled';
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(nextDueDate);
  due.setHours(0, 0, 0, 0);
  const diff = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return 'overdue';
  if (diff <= 7) return 'scheduled';
  return 'completed';
}

function getStatusBadge(status: VaccinationRecord['status']): {
  label: string;
  className: string;
} {
  switch (status) {
    case 'completed':
      return {
        label: 'مكتمل',
        className: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
      };
    case 'scheduled':
      return {
        label: 'مجدول',
        className: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-700',
      };
    case 'overdue':
      return {
        label: 'متأخر',
        className: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700',
      };
  }
}

type StatusFilter = 'all' | 'completed' | 'scheduled' | 'overdue';

// ============================================================
// Component
// ============================================================

export default function VaccinationTracker({ records, onRecordsChange }: VaccinationTrackerProps) {
  // ----- State -----
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<VaccinationRecord | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<VaccinationRecord | null>(null);
  const [detailTarget, setDetailTarget] = useState<VaccinationRecord | null>(null);

  // ----- Derived Data -----
  // Auto-compute status for all records
  const recordsWithStatus = useMemo(() => {
    return records.map((r) => ({
      ...r,
      status: computeStatus(r.nextDueDate, r.vaccinationDate),
    }));
  }, [records]);

  const filteredRecords = useMemo(() => {
    let result = recordsWithStatus;

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.sheepNumber.toLowerCase().includes(q) ||
          r.vaccineName.toLowerCase().includes(q) ||
          r.veterinarian.toLowerCase().includes(q) ||
          r.notes.toLowerCase().includes(q),
      );
    }

    return result;
  }, [recordsWithStatus, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const total = recordsWithStatus.length;
    const completed = recordsWithStatus.filter((r) => r.status === 'completed').length;
    const scheduled = recordsWithStatus.filter((r) => r.status === 'scheduled').length;
    const overdue = recordsWithStatus.filter((r) => r.status === 'overdue').length;
    return { total, completed, scheduled, overdue };
  }, [recordsWithStatus]);

  // ----- Handlers -----
  const openAddDialog = useCallback(() => {
    setEditingRecord(null);
    setFormData(EMPTY_FORM);
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((record: VaccinationRecord) => {
    setEditingRecord(record);
    setFormData({
      sheepNumber: record.sheepNumber,
      vaccineName: record.vaccineName,
      vaccinationDate: record.vaccinationDate,
      nextDueDate: record.nextDueDate,
      doseNumber: record.doseNumber,
      veterinarian: record.veterinarian,
      notes: record.notes,
    });
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!formData.sheepNumber.trim() || !formData.vaccineName.trim()) return;

    const now = new Date().toISOString();
    const computedStatus = computeStatus(formData.nextDueDate, formData.vaccinationDate);

    if (editingRecord) {
      // Update
      const updated = records.map((r) =>
        r.id === editingRecord.id
          ? {
              ...r,
              ...formData,
              status: computedStatus,
              updatedAt: now,
            }
          : r,
      );
      onRecordsChange(updated);
    } else {
      // Create
      const newRecord: VaccinationRecord = {
        id: generateId(),
        ...formData,
        status: computedStatus,
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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/20">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
              <Syringe className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-sm text-violet-600 dark:text-violet-400">إجمالي التحصينات</p>
              <p className="text-xl font-bold text-violet-700 dark:text-violet-300">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <CalendarCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">مكتمل</p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{stats.completed}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/20">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/30">
              <Clock className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <p className="text-sm text-sky-600 dark:text-sky-400">مجدول</p>
              <p className="text-xl font-bold text-sky-700 dark:text-sky-300">{stats.scheduled}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/30">
              <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-sm text-rose-600 dark:text-rose-400">متأخر</p>
              <p className="text-xl font-bold text-rose-700 dark:text-rose-300">{stats.overdue}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ====== Search + Filter + Add Button ====== */}
      <Card className="border-violet-200 dark:border-violet-800">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Syringe className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ابحث برقم الأغنام أو اسم اللقاح..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-violet-200 dark:border-violet-800 pr-9 focus-visible:ring-violet-400"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 rounded-lg border border-violet-200 dark:border-violet-800 p-0.5">
                {([
                  { value: 'all' as StatusFilter, label: 'الكل' },
                  { value: 'completed' as StatusFilter, label: 'مكتمل' },
                  { value: 'scheduled' as StatusFilter, label: 'مجدول' },
                  { value: 'overdue' as StatusFilter, label: 'متأخر' },
                ]).map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setStatusFilter(f.value)}
                    className={`
                      rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-150
                      ${statusFilter === f.value
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }
                    `}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <Button
                onClick={openAddDialog}
                className="bg-violet-600 hover:bg-violet-700 shrink-0 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                إضافة تحصين
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ====== Data Table ====== */}
      <Card className="border-violet-200 dark:border-violet-800">
        <CardHeader className="border-b border-violet-100 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20 px-6 py-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <CardTitle className="text-lg text-violet-700 dark:text-violet-300">
              سجل التحصينات
            </CardTitle>
          </div>
          <CardDescription className="text-violet-500 dark:text-violet-400">
            عرض جميع سجلات التحصينات ({filteredRecords.length}{' '}
            {filteredRecords.length === 1 ? 'سجل' : 'سجلات'})
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {filteredRecords.length === 0 ? (
            /* ----- Empty State ----- */
            records.length === 0 ? (
              <EmptyState
                icon={<Syringe />}
                title="لا توجد تحصينات مسجلة"
                description="ابدأ بإضافة أول سجل تحصين لتتبع جدول تطعيمات قطيعك"
                action={{
                  label: 'إضافة أول تحصين',
                  onClick: openAddDialog,
                }}
              />
            ) : (
              <EmptyState
                icon={<Search />}
                title="لا توجد نتائج مطابقة"
                description="جرب تغيير كلمات البحث أو فلتر الحالة للعثور على السجل المطلوب"
                action={{
                  label: 'مسح البحث',
                  onClick: () => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  },
                }}
              />
            )
          ) : (
            /* ----- Table ----- */
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-violet-50 dark:bg-muted">
                  <TableRow className="border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-muted">
                    <TableHead className="text-right text-violet-700 dark:text-violet-300 font-semibold">
                      رقم الأغنام
                    </TableHead>
                    <TableHead className="text-right text-violet-700 dark:text-violet-300 font-semibold">
                      اللقاح
                    </TableHead>
                    <TableHead className="text-right text-violet-700 dark:text-violet-300 font-semibold hidden md:table-cell">
                      تاريخ التحصين
                    </TableHead>
                    <TableHead className="text-right text-violet-700 dark:text-violet-300 font-semibold hidden md:table-cell">
                      الموعد القادم
                    </TableHead>
                    <TableHead className="text-center text-violet-700 dark:text-violet-300 font-semibold hidden lg:table-cell">
                      الجرعة
                    </TableHead>
                    <TableHead className="text-right text-violet-700 dark:text-violet-300 font-semibold hidden lg:table-cell">
                      الطبيب
                    </TableHead>
                    <TableHead className="text-right text-violet-700 dark:text-violet-300 font-semibold">
                      الحالة
                    </TableHead>
                    <TableHead className="text-center text-violet-700 dark:text-violet-300 font-semibold">
                      الإجراءات
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => {
                    const badge = getStatusBadge(record.status);
                    return (
                      <TableRow
                        key={record.id}
                        className="border-violet-100 dark:border-violet-800 transition-colors hover:bg-violet-50/60 dark:hover:bg-violet-950/10"
                      >
                        <TableCell className="font-medium text-violet-800 dark:text-violet-200">
                          {record.sheepNumber || '—'}
                        </TableCell>
                        <TableCell
                          className="max-w-[160px] text-muted-foreground"
                          title={record.vaccineName}
                        >
                          {truncate(record.vaccineName, 25)}
                        </TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground md:table-cell tabular-nums">
                          {record.vaccinationDate ? (
                            <span className="flex items-center gap-1">
                              <CalendarCheck className="h-3 w-3 text-violet-400" />
                              {formatShortDate(record.vaccinationDate)}
                            </span>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground md:table-cell tabular-nums">
                          {record.nextDueDate ? (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {formatShortDate(record.nextDueDate)}
                            </span>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="hidden text-center lg:table-cell">
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-5 bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-700"
                          >
                            {record.doseNumber}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className="hidden max-w-[120px] text-xs text-muted-foreground lg:table-cell"
                          title={record.veterinarian}
                        >
                          {truncate(record.veterinarian, 15)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={badge.className}
                          >
                            {badge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-700"
                              onClick={() => setDetailTarget(record)}
                              title="عرض التفاصيل"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-700"
                              onClick={() => openEditDialog(record)}
                              title="تعديل"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600"
                              onClick={() => setDeleteTarget(record)}
                              title="حذف"
                            >
                              <Trash2 className="h-4 w-4" />
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
            <DialogTitle className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
              <Syringe className="h-5 w-5" />
              {editingRecord ? 'تعديل سجل تحصين' : 'إضافة سجل تحصين جديد'}
            </DialogTitle>
            <DialogDescription>
              {editingRecord
                ? 'قم بتعديل بيانات سجل التحصين ثم اضغط حفظ'
                : 'أدخل بيانات التحصين الجديد ثم اضغط حفظ'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Sheep Number + Vaccine Name */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vac-sheepNumber" className="text-violet-700 dark:text-violet-300 font-medium">
                  رقم الأغنام
                </Label>
                <Input
                  id="vac-sheepNumber"
                  placeholder="مثال: 1024"
                  value={formData.sheepNumber}
                  onChange={(e) => updateField('sheepNumber', e.target.value)}
                  className="border-violet-200 dark:border-violet-800 focus-visible:ring-violet-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vac-vaccineName" className="text-violet-700 dark:text-violet-300 font-medium">
                  اسم اللقاح
                </Label>
                <Input
                  id="vac-vaccineName"
                  placeholder="مثال: لقاح الجدري"
                  value={formData.vaccineName}
                  onChange={(e) => updateField('vaccineName', e.target.value)}
                  className="border-violet-200 dark:border-violet-800 focus-visible:ring-violet-400"
                />
              </div>
            </div>

            {/* Vaccination Date + Next Due Date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vac-vaccinationDate" className="text-violet-700 dark:text-violet-300 font-medium">
                  تاريخ التحصين
                </Label>
                <Input
                  id="vac-vaccinationDate"
                  type="date"
                  value={formData.vaccinationDate}
                  onChange={(e) => updateField('vaccinationDate', e.target.value)}
                  className="border-violet-200 dark:border-violet-800 focus-visible:ring-violet-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vac-nextDueDate" className="text-violet-700 dark:text-violet-300 font-medium">
                  الموعد القادم
                </Label>
                <Input
                  id="vac-nextDueDate"
                  type="date"
                  value={formData.nextDueDate}
                  onChange={(e) => updateField('nextDueDate', e.target.value)}
                  className="border-violet-200 dark:border-violet-800 focus-visible:ring-violet-400"
                />
              </div>
            </div>

            {/* Dose Number + Veterinarian */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vac-doseNumber" className="text-violet-700 dark:text-violet-300 font-medium">
                  رقم الجرعة
                </Label>
                <Input
                  id="vac-doseNumber"
                  type="number"
                  min={1}
                  value={formData.doseNumber}
                  onChange={(e) => updateField('doseNumber', Math.max(1, parseInt(e.target.value) || 1))}
                  className="border-violet-200 dark:border-violet-800 focus-visible:ring-violet-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vac-veterinarian" className="text-violet-700 dark:text-violet-300 font-medium">
                  الطبيب البيطري
                </Label>
                <Input
                  id="vac-veterinarian"
                  placeholder="اسم الطبيب"
                  value={formData.veterinarian}
                  onChange={(e) => updateField('veterinarian', e.target.value)}
                  className="border-violet-200 dark:border-violet-800 focus-visible:ring-violet-400"
                />
              </div>
            </div>

            <Separator className="bg-violet-100 dark:bg-violet-800" />

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="vac-notes" className="text-violet-700 dark:text-violet-300 font-medium">
                ملاحظات
              </Label>
              <Textarea
                id="vac-notes"
                placeholder="أي ملاحظات إضافية حول التحصين..."
                rows={3}
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                className="border-violet-200 dark:border-violet-800 focus-visible:ring-violet-400 resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/30"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.sheepNumber.trim() || !formData.vaccineName.trim()}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {editingRecord ? 'حفظ التعديلات' : 'إضافة التحصين'}
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
              <Trash2 className="h-5 w-5" />
              تأكيد الحذف
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف سجل تحصين{' '}
              <span className="font-bold text-red-600">
                {deleteTarget?.sheepNumber}
              </span>
              {' '}(لقاح: {deleteTarget?.vaccineName})؟ لا يمكن التراجع عن هذا الإجراء.
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
            <DialogTitle className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
              <FileText className="h-5 w-5" />
              تفاصيل سجل التحصين
            </DialogTitle>
            <DialogDescription>
              رقم الأغنام: {detailTarget?.sheepNumber || '—'}
            </DialogDescription>
          </DialogHeader>

          {detailTarget && (
            <div className="space-y-4">
              <DetailRow
                icon={<Activity className="h-4 w-4 text-violet-500" />}
                label="رقم الأغنام"
                value={detailTarget.sheepNumber}
              />
              <DetailRow
                icon={<Syringe className="h-4 w-4 text-violet-500" />}
                label="اسم اللقاح"
                value={detailTarget.vaccineName}
              />
              <DetailRow
                icon={<CalendarCheck className="h-4 w-4 text-violet-500" />}
                label="تاريخ التحصين"
                value={detailTarget.vaccinationDate ? formatShortDate(detailTarget.vaccinationDate) : '—'}
              />
              <DetailRow
                icon={<Clock className="h-4 w-4 text-violet-500" />}
                label="الموعد القادم"
                value={detailTarget.nextDueDate ? formatShortDate(detailTarget.nextDueDate) : '—'}
              />
              <DetailRow
                icon={<ClipboardList className="h-4 w-4 text-violet-500" />}
                label="رقم الجرعة"
                value={String(detailTarget.doseNumber)}
              />
              <DetailRow
                icon={<UserCheck className="h-4 w-4 text-violet-500" />}
                label="الطبيب البيطري"
                value={detailTarget.veterinarian}
              />
              <Separator className="bg-violet-100 dark:bg-violet-800" />
              <DetailRow
                icon={<FileText className="h-4 w-4 text-violet-500" />}
                label="ملاحظات"
                value={detailTarget.notes}
                multiline
              />
              <Separator className="bg-violet-100 dark:bg-violet-800" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>تاريخ التسجيل: {formatShortDate(detailTarget.createdAt)}</span>
                <Badge
                  variant="outline"
                  className={getStatusBadge(computeStatus(detailTarget.nextDueDate, detailTarget.vaccinationDate)).className}
                >
                  {getStatusBadge(computeStatus(detailTarget.nextDueDate, detailTarget.vaccinationDate)).label}
                </Badge>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              className="border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/30"
              onClick={() => setDetailTarget(null)}
            >
              إغلاق
            </Button>
            {detailTarget && (
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => {
                  openEditDialog(detailTarget);
                  setDetailTarget(null);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                تعديل
              </Button>
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
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-violet-50 dark:bg-violet-950/20">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs font-medium text-violet-600 dark:text-violet-400">{label}</p>
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
