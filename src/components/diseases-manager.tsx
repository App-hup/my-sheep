'use client';

import { useState, useMemo, useCallback } from 'react';
import type { DiseaseRecord } from '@/lib/types';
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
  HeartPulse,
  Search,
  FileText,
  Activity,
  ClipboardList,
  Clock,
  Stethoscope,
  Eye,
} from 'lucide-react';

// ============================================================
// Props
// ============================================================

interface DiseasesManagerProps {
  records: DiseaseRecord[];
  onRecordsChange: (records: DiseaseRecord[]) => void;
}

// ============================================================
// Initial / Empty Form
// ============================================================

interface FormData {
  sheepNumber: string;
  age: string;
  symptoms: string;
  initialExam: string;
  suggestedTreatment: string;
  treatmentDuration: string;
  followUp: string;
}

const EMPTY_FORM: FormData = {
  sheepNumber: '',
  age: '',
  symptoms: '',
  initialExam: '',
  suggestedTreatment: '',
  treatmentDuration: '',
  followUp: '',
};

// ============================================================
// Helpers
// ============================================================

function truncate(str: string, max: number): string {
  if (!str) return '—';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

function getTreatmentStatus(record: DiseaseRecord): {
  label: string;
  className: string;
} {
  if (!record.suggestedTreatment) {
    return { label: 'لم يبدأ', className: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700' };
  }
  if (!record.followUp) {
    return { label: 'قيد العلاج', className: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700' };
  }
  return { label: 'تم المتابعة', className: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700' };
}

// ============================================================
// Component
// ============================================================

export default function DiseasesManager({ records, onRecordsChange }: DiseasesManagerProps) {
  // ----- State -----
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DiseaseRecord | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<DiseaseRecord | null>(null);
  const [detailTarget, setDetailTarget] = useState<DiseaseRecord | null>(null);

  // ----- Derived Data -----
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.trim().toLowerCase();
    return records.filter(
      (r) =>
        r.sheepNumber.toLowerCase().includes(q) ||
        r.age.toLowerCase().includes(q) ||
        r.symptoms.toLowerCase().includes(q) ||
        r.initialExam.toLowerCase().includes(q) ||
        r.suggestedTreatment.toLowerCase().includes(q) ||
        r.treatmentDuration.toLowerCase().includes(q) ||
        r.followUp.toLowerCase().includes(q),
    );
  }, [records, searchQuery]);

  const stats = useMemo(() => {
    const total = records.length;
    const treated = records.filter((r) => r.suggestedTreatment).length;
    const followedUp = records.filter((r) => r.followUp).length;
    const pending = total - treated;
    return { total, treated, followedUp, pending };
  }, [records]);

  // ----- Handlers -----
  const openAddDialog = useCallback(() => {
    setEditingRecord(null);
    setFormData(EMPTY_FORM);
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((record: DiseaseRecord) => {
    setEditingRecord(record);
    setFormData({
      sheepNumber: record.sheepNumber,
      age: record.age,
      symptoms: record.symptoms,
      initialExam: record.initialExam,
      suggestedTreatment: record.suggestedTreatment,
      treatmentDuration: record.treatmentDuration,
      followUp: record.followUp,
    });
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!formData.sheepNumber.trim()) return;

    const now = new Date().toISOString();

    if (editingRecord) {
      // Update
      const updated = records.map((r) =>
        r.id === editingRecord.id
          ? { ...r, ...formData, updatedAt: now }
          : r,
      );
      onRecordsChange(updated);
    } else {
      // Create
      const newRecord: DiseaseRecord = {
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
        <Card className="border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/30">
              <Activity className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-sm text-rose-600 dark:text-rose-400">إجمالي الحالات</p>
              <p className="text-xl font-bold text-rose-700 dark:text-rose-300">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Stethoscope className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-amber-600 dark:text-amber-400">قيد العلاج</p>
              <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/20">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/30">
              <ClipboardList className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <p className="text-sm text-sky-600 dark:text-sky-400">تحت العلاج</p>
              <p className="text-xl font-bold text-sky-700 dark:text-sky-300">{stats.treated}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <HeartPulse className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">تمت المتابعة</p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{stats.followedUp}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ====== Search + Add Button ====== */}
      <Card className="border-rose-200 dark:border-rose-800">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ابحث برقم الخروف أو الأعراض أو العلاج..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-rose-200 dark:border-rose-800 pr-9 focus-visible:ring-rose-400"
              />
            </div>
            <Button
              onClick={openAddDialog}
              className="bg-rose-600 hover:bg-rose-700 shrink-0 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              إضافة حالة مرضية
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ====== Data Table ====== */}
      <Card className="border-rose-200 dark:border-rose-800">
        <CardHeader className="border-b border-rose-100 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 px-6 py-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            <CardTitle className="text-lg text-rose-700 dark:text-rose-300">
              سجل الحالات المرضية
            </CardTitle>
          </div>
          <CardDescription className="text-rose-500 dark:text-rose-400">
            عرض جميع حالات الأمراض المسجلة ({filteredRecords.length}{' '}
            {filteredRecords.length === 1 ? 'حالة' : 'حالات'})
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {filteredRecords.length === 0 ? (
            /* ----- Empty State ----- */
            records.length === 0 ? (
              <EmptyState
                icon={<HeartPulse />}
                title="لا توجد حالات مرضية مسجلة"
                description="ابدأ بإضافة أول حالة مرضية لتتبع صحة قطيعك وتسجيل الأعراض والعلاجات"
                action={{
                  label: 'إضافة أول حالة',
                  onClick: openAddDialog,
                }}
              />
            ) : (
              <EmptyState
                icon={<Search />}
                title="لا توجد نتائج مطابقة"
                description="جرب تغيير كلمات البحث للعثور على الحالة المطلوبة"
                action={{
                  label: 'مسح البحث',
                  onClick: () => setSearchQuery(''),
                }}
              />
            )
          ) : (
            /* ----- Table ----- */
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-rose-50 dark:bg-muted">
                  <TableRow className="border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-muted">
                    <TableHead className="text-right text-rose-700 dark:text-rose-300 font-semibold">
                      رقم الخروف
                    </TableHead>
                    <TableHead className="text-right text-rose-700 dark:text-rose-300 font-semibold">
                      العمر
                    </TableHead>
                    <TableHead className="text-right text-rose-700 dark:text-rose-300 font-semibold">
                      الأعراض
                    </TableHead>
                    <TableHead className="text-right text-rose-700 dark:text-rose-300 font-semibold hidden md:table-cell">
                      العلاج المقترح
                    </TableHead>
                    <TableHead className="text-right text-rose-700 dark:text-rose-300 font-semibold hidden lg:table-cell">
                      المدة
                    </TableHead>
                    <TableHead className="text-right text-rose-700 dark:text-rose-300 font-semibold">
                      الحالة
                    </TableHead>
                    <TableHead className="text-right text-rose-700 dark:text-rose-300 font-semibold hidden sm:table-cell">
                      التاريخ
                    </TableHead>
                    <TableHead className="text-center text-rose-700 dark:text-rose-300 font-semibold">
                      الإجراءات
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => {
                    const status = getTreatmentStatus(record);
                    return (
                      <TableRow
                        key={record.id}
                        className="border-rose-100 dark:border-rose-800 transition-colors hover:bg-rose-50/60 dark:hover:bg-rose-950/10"
                      >
                        <TableCell className="font-medium text-rose-800 dark:text-rose-200">
                          {record.sheepNumber || '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.age || '—'}
                        </TableCell>
                        <TableCell
                          className="max-w-[180px] text-muted-foreground"
                          title={record.symptoms}
                        >
                          {truncate(record.symptoms, 30)}
                        </TableCell>
                        <TableCell
                          className="hidden max-w-[160px] text-muted-foreground md:table-cell"
                          title={record.suggestedTreatment}
                        >
                          {truncate(record.suggestedTreatment, 25)}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground lg:table-cell">
                          {record.treatmentDuration ? (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {record.treatmentDuration}
                            </span>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={status.className}
                          >
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                          {formatShortDate(record.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 hover:text-rose-700"
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
            <DialogTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
              <HeartPulse className="h-5 w-5" />
              {editingRecord ? 'تعديل حالة مرضية' : 'إضافة حالة مرضية جديدة'}
            </DialogTitle>
            <DialogDescription>
              {editingRecord
                ? 'قم بتعديل بيانات الحالة المرضية ثم اضغط حفظ'
                : 'أدخل بيانات الحالة المرضية الجديدة ثم اضغط حفظ'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Sheep Number + Age row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sheepNumber" className="text-rose-700 dark:text-rose-300 font-medium">
                  رقم الخروف
                </Label>
                <Input
                  id="sheepNumber"
                  placeholder="مثال: 1024"
                  value={formData.sheepNumber}
                  onChange={(e) => updateField('sheepNumber', e.target.value)}
                  className="border-rose-200 dark:border-rose-800 focus-visible:ring-rose-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age" className="text-rose-700 dark:text-rose-300 font-medium">
                  العمر
                </Label>
                <Input
                  id="age"
                  placeholder="مثال: 2 سنوات"
                  value={formData.age}
                  onChange={(e) => updateField('age', e.target.value)}
                  className="border-rose-200 dark:border-rose-800 focus-visible:ring-rose-400"
                />
              </div>
            </div>

            <Separator className="bg-rose-100 dark:bg-rose-800" />

            {/* Symptoms */}
            <div className="space-y-2">
              <Label htmlFor="symptoms" className="text-rose-700 dark:text-rose-300 font-medium">
                الأعراض
              </Label>
              <Textarea
                id="symptoms"
                placeholder="صف الأعراض التي تظهر على الخروف..."
                rows={3}
                value={formData.symptoms}
                onChange={(e) => updateField('symptoms', e.target.value)}
                className="border-rose-200 dark:border-rose-800 focus-visible:ring-rose-400 resize-none"
              />
            </div>

            {/* Initial Exam */}
            <div className="space-y-2">
              <Label htmlFor="initialExam" className="text-rose-700 dark:text-rose-300 font-medium">
                الفحص المبدئي
              </Label>
              <Input
                id="initialExam"
                placeholder="نتيجة الفحص المبدئي"
                value={formData.initialExam}
                onChange={(e) => updateField('initialExam', e.target.value)}
                className="border-rose-200 dark:border-rose-800 focus-visible:ring-rose-400"
              />
            </div>

            <Separator className="bg-rose-100 dark:bg-rose-800" />

            {/* Suggested Treatment */}
            <div className="space-y-2">
              <Label
                htmlFor="suggestedTreatment"
                className="text-rose-700 dark:text-rose-300 font-medium"
              >
                العلاج المقترح
              </Label>
              <Textarea
                id="suggestedTreatment"
                placeholder="اكتب العلاج المقترح من قبل الطبيب البيطري..."
                rows={3}
                value={formData.suggestedTreatment}
                onChange={(e) =>
                  updateField('suggestedTreatment', e.target.value)
                }
                className="border-rose-200 dark:border-rose-800 focus-visible:ring-rose-400 resize-none"
              />
            </div>

            {/* Treatment Duration */}
            <div className="space-y-2">
              <Label
                htmlFor="treatmentDuration"
                className="text-rose-700 dark:text-rose-300 font-medium"
              >
                مدة العلاج
              </Label>
              <Input
                id="treatmentDuration"
                placeholder="مثال: 7 أيام"
                value={formData.treatmentDuration}
                onChange={(e) => updateField('treatmentDuration', e.target.value)}
                className="border-rose-200 dark:border-rose-800 focus-visible:ring-rose-400"
              />
            </div>

            <Separator className="bg-rose-100 dark:bg-rose-800" />

            {/* Follow-up */}
            <div className="space-y-2">
              <Label htmlFor="followUp" className="text-rose-700 dark:text-rose-300 font-medium">
                المتابعة بعد العلاج
              </Label>
              <Textarea
                id="followUp"
                placeholder="سجل نتائج المتابعة بعد انتهاء العلاج..."
                rows={3}
                value={formData.followUp}
                onChange={(e) => updateField('followUp', e.target.value)}
                className="border-rose-200 dark:border-rose-800 focus-visible:ring-rose-400 resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-rose-200 dark:border-rose-700 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.sheepNumber.trim()}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {editingRecord ? 'حفظ التعديلات' : 'إضافة الحالة'}
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
              هل أنت متأكد من حذف حالة الخروف{' '}
              <span className="font-bold text-red-600">
                {deleteTarget?.sheepNumber}
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
              نعم، احذف الحالة
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
            <DialogTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
              <FileText className="h-5 w-5" />
              تفاصيل الحالة المرضية
            </DialogTitle>
            <DialogDescription>
              رقم الخروف: {detailTarget?.sheepNumber || '—'}
            </DialogDescription>
          </DialogHeader>

          {detailTarget && (
            <div className="space-y-4">
              <DetailRow
                icon={<Activity className="h-4 w-4 text-rose-500" />}
                label="رقم الخروف"
                value={detailTarget.sheepNumber}
              />
              <DetailRow
                icon={<Clock className="h-4 w-4 text-rose-500" />}
                label="العمر"
                value={detailTarget.age}
              />
              <DetailRow
                icon={<HeartPulse className="h-4 w-4 text-rose-500" />}
                label="الأعراض"
                value={detailTarget.symptoms}
                multiline
              />
              <DetailRow
                icon={<Stethoscope className="h-4 w-4 text-rose-500" />}
                label="الفحص المبدئي"
                value={detailTarget.initialExam}
              />
              <Separator className="bg-rose-100" />
              <DetailRow
                icon={<ClipboardList className="h-4 w-4 text-rose-500" />}
                label="العلاج المقترح"
                value={detailTarget.suggestedTreatment}
                multiline
              />
              <DetailRow
                icon={<Clock className="h-4 w-4 text-rose-500" />}
                label="مدة العلاج"
                value={detailTarget.treatmentDuration}
              />
              <DetailRow
                icon={<Activity className="h-4 w-4 text-rose-500" />}
                label="المتابعة بعد العلاج"
                value={detailTarget.followUp}
                multiline
              />
              <Separator className="bg-rose-100" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>تاريخ التسجيل: {formatShortDate(detailTarget.createdAt)}</span>
                <Badge
                  variant="outline"
                  className={getTreatmentStatus(detailTarget).className}
                >
                  {getTreatmentStatus(detailTarget).label}
                </Badge>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              className="border-rose-200 dark:border-rose-700 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30"
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
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-rose-50 dark:bg-rose-950/20">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs font-medium text-rose-600 dark:text-rose-400">{label}</p>
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
