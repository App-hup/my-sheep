'use client';

import { useState, useMemo, useCallback } from 'react';
import EmptyState from '@/components/ui/empty-state';
import {
  Plus,
  Edit,
  Trash2,
  Baby,
  Calendar,
  Search,
  Filter,
} from 'lucide-react';

import type { BirthRecord, BirthGender, BirthPurpose } from '@/lib/types';
import { GENDER_LABELS, PURPOSE_LABELS } from '@/lib/types';
import { generateId, calculateAgeInMonths, formatShortDate } from '@/lib/storage';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ========== Props ==========
interface BirthsManagerProps {
  records: BirthRecord[];
  onRecordsChange: (records: BirthRecord[]) => void;
}

// ========== Form State ==========
interface FormState {
  number: string;
  gender: BirthGender;
  birthDate: string;
  purpose: BirthPurpose;
}

const INITIAL_FORM: FormState = {
  number: '',
  gender: 'male',
  birthDate: new Date().toISOString().split('T')[0],
  purpose: 'breeding',
};

// ========== Component ==========
export default function BirthsManager({ records, onRecordsChange }: BirthsManagerProps) {
  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [purposeFilter, setPurposeFilter] = useState<string>('all');

  // ========== Statistics ==========
  const stats = useMemo(() => {
    const total = records.length;
    const males = records.filter((r) => r.gender === 'male').length;
    const females = records.filter((r) => r.gender === 'female').length;
    return { total, males, females };
  }, [records]);

  // ========== Filtered Records ==========
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim();
        const matchNumber = record.number.includes(query);
        const matchGender = GENDER_LABELS[record.gender].includes(query);
        const matchPurpose = PURPOSE_LABELS[record.purpose].includes(query);
        const matchDate = formatShortDate(record.birthDate).includes(query);
        if (!matchNumber && !matchGender && !matchPurpose && !matchDate) return false;
      }
      // Gender filter
      if (genderFilter !== 'all' && record.gender !== genderFilter) return false;
      // Purpose filter
      if (purposeFilter !== 'all' && record.purpose !== purposeFilter) return false;
      return true;
    });
  }, [records, searchQuery, genderFilter, purposeFilter]);

  // ========== CRUD Handlers ==========
  const handleOpenAdd = useCallback(() => {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setFormOpen(true);
  }, []);

  const handleOpenEdit = useCallback((record: BirthRecord) => {
    setEditingId(record.id);
    setForm({
      number: record.number,
      gender: record.gender,
      birthDate: record.birthDate,
      purpose: record.purpose,
    });
    setFormOpen(true);
  }, []);

  const handleOpenDelete = useCallback((id: string) => {
    setDeletingId(id);
    setDeleteOpen(true);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!form.birthDate) return;

    if (editingId) {
      // Update existing record
      const updated = records.map((r) =>
        r.id === editingId
          ? {
              ...r,
              number: form.number,
              gender: form.gender,
              birthDate: form.birthDate,
              purpose: form.purpose,
            }
          : r
      );
      onRecordsChange(updated);
    } else {
      // Create new record
      const newRecord: BirthRecord = {
        id: generateId(),
        number: form.number,
        gender: form.gender,
        birthDate: form.birthDate,
        ageInMonths: calculateAgeInMonths(form.birthDate),
        purpose: form.purpose,
        fromPregnancy: false,
        createdAt: new Date().toISOString(),
      };
      onRecordsChange([...records, newRecord]);
    }

    setForm(INITIAL_FORM);
    setEditingId(null);
    setFormOpen(false);
  }, [form, editingId, records, onRecordsChange]);

  const handleDelete = useCallback(() => {
    if (!deletingId) return;
    onRecordsChange(records.filter((r) => r.id !== deletingId));
    setDeletingId(null);
    setDeleteOpen(false);
  }, [deletingId, records, onRecordsChange]);

  // ========== Helpers ==========
  const deletingRecord = records.find((r) => r.id === deletingId);
  const hasActiveFilters =
    searchQuery.trim() !== '' || genderFilter !== 'all' || purposeFilter !== 'all';

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setGenderFilter('all');
    setPurposeFilter('all');
  }, []);

  // ========== Render ==========
  return (
    <div className="space-y-6">
      {/* ===== Statistics Cards ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/20 py-4">
          <CardContent className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/30">
              <Baby className="h-5 w-5 text-sky-700 dark:text-sky-300" />
            </div>
            <div>
              <p className="text-sm text-sky-600 dark:text-sky-400">إجمالي المواليد</p>
              <p className="text-2xl font-bold text-sky-800 dark:text-sky-200">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 py-4">
          <CardContent className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <span className="text-lg">🐏</span>
            </div>
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400">ذكور</p>
              <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{stats.males}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-pink-200 dark:border-pink-800 bg-pink-50 dark:bg-pink-950/20 py-4">
          <CardContent className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900/30">
              <span className="text-lg">🐑</span>
            </div>
            <div>
              <p className="text-sm text-pink-600 dark:text-pink-400">إناث</p>
              <p className="text-2xl font-bold text-pink-800 dark:text-pink-200">{stats.females}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== Controls Bar ===== */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search & Filters */}
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="بحث بالرقم أو التاريخ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-9"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />

                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger className="w-full sm:w-[130px]">
                    <SelectValue placeholder="الجنس" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="male">ذكر</SelectItem>
                    <SelectItem value="female">أنثى</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={purposeFilter} onValueChange={setPurposeFilter}>
                  <SelectTrigger className="w-full sm:w-[130px]">
                    <SelectValue placeholder="الغرض" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="breeding">تربية</SelectItem>
                    <SelectItem value="sale">بيع</SelectItem>
                    <SelectItem value="slaughter">ذبح</SelectItem>
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    مسح
                  </Button>
                )}
              </div>
            </div>

            {/* Add Button */}
            <Button onClick={handleOpenAdd} className="bg-sky-600 hover:bg-sky-700 gap-2">
              <Plus className="h-4 w-4" />
              <span>إضافة مولود</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ===== Data Table ===== */}
      <Card>
        {filteredRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right">الرقم</TableHead>
                  <TableHead className="text-right">الجنس</TableHead>
                  <TableHead className="text-right">تاريخ الولادة</TableHead>
                  <TableHead className="text-right">العمر (أشهر)</TableHead>
                  <TableHead className="text-right">الغرض</TableHead>
                  <TableHead className="text-right">المصدر</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => {
                  const age = calculateAgeInMonths(record.birthDate);
                  return (
                    <TableRow key={record.id}>
                      {/* Number */}
                      <TableCell className="font-medium">
                        {record.number || '—'}
                      </TableCell>

                      {/* Gender Badge */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            record.gender === 'male'
                              ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300'
                              : 'border-pink-300 dark:border-pink-700 bg-pink-50 dark:bg-pink-950/20 text-pink-700 dark:text-pink-300'
                          }
                        >
                          {GENDER_LABELS[record.gender]}
                        </Badge>
                      </TableCell>

                      {/* Birth Date */}
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatShortDate(record.birthDate)}
                        </div>
                      </TableCell>

                      {/* Age (auto-calculated) */}
                      <TableCell>
                        <span className="font-medium tabular-nums">{age}</span>
                      </TableCell>

                      {/* Purpose Badge */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            record.purpose === 'breeding'
                              ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300'
                              : record.purpose === 'sale'
                                ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300'
                                : 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300'
                          }
                        >
                          {PURPOSE_LABELS[record.purpose]}
                        </Badge>
                      </TableCell>

                      {/* Source Badge */}
                      <TableCell>
                        {record.fromPregnancy ? (
                          <Badge className="border-transparent bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300">
                            تلقائي
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">يدوي</span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-sky-700"
                            onClick={() => handleOpenEdit(record)}
                            aria-label="تعديل"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-600"
                            onClick={() => handleOpenDelete(record.id)}
                            aria-label="حذف"
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
        ) : (
          /* ===== Empty State ===== */
          <EmptyState
            icon={<Baby />}
            title={hasActiveFilters ? 'لا توجد نتائج مطابقة' : 'لا توجد سجلات مواليد بعد'}
            description={hasActiveFilters ? 'لا توجد نتائج مطابقة للفلتر' : 'ابدأ بتسجيل أول مولود في قطيعك'}
            action={hasActiveFilters ? {
              label: 'مسح الفلاتر',
              onClick: clearFilters,
            } : {
              label: 'إضافة أول مولود',
              onClick: handleOpenAdd,
            }}
          />
        )}
      </Card>

      {/* ===== Add / Edit Dialog ===== */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'تعديل سجل المولود' : 'إضافة مولود جديد'}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? 'قم بتعديل بيانات المولود ثم اضغط حفظ'
                : 'أدخل بيانات المولود الجديد ثم اضغط حفظ'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Number */}
            <div className="grid gap-2">
              <Label htmlFor="birth-number">الرقم</Label>
              <Input
                id="birth-number"
                placeholder="رقم المولود (اختياري)"
                value={form.number}
                onChange={(e) => setForm((prev) => ({ ...prev, number: e.target.value }))}
              />
            </div>

            {/* Gender */}
            <div className="grid gap-2">
              <Label>الجنس</Label>
              <Select
                value={form.gender}
                onValueChange={(val) =>
                  setForm((prev) => ({ ...prev, gender: val as BirthGender }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{GENDER_LABELS.male}</SelectItem>
                  <SelectItem value="female">{GENDER_LABELS.female}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Birth Date */}
            <div className="grid gap-2">
              <Label htmlFor="birth-date">تاريخ الولادة</Label>
              <Input
                id="birth-date"
                type="date"
                value={form.birthDate}
                onChange={(e) => setForm((prev) => ({ ...prev, birthDate: e.target.value }))}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Age (read-only) */}
            {form.birthDate && (
              <div className="grid gap-2">
                <Label>العمر بالأشهر</Label>
                <div className="flex h-9 items-center rounded-md border bg-muted/50 px-3 text-sm">
                  {calculateAgeInMonths(form.birthDate)} شهر
                </div>
              </div>
            )}

            {/* Purpose */}
            <div className="grid gap-2">
              <Label>المجال / الغرض</Label>
              <Select
                value={form.purpose}
                onValueChange={(val) =>
                  setForm((prev) => ({ ...prev, purpose: val as BirthPurpose }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breeding">{PURPOSE_LABELS.breeding}</SelectItem>
                  <SelectItem value="sale">{PURPOSE_LABELS.sale}</SelectItem>
                  <SelectItem value="slaughter">{PURPOSE_LABELS.slaughter}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setFormOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.birthDate}
              className="bg-sky-600 hover:bg-sky-700"
            >
              {editingId ? 'حفظ التعديلات' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Delete Confirmation Dialog ===== */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف سجل المولود
              {deletingRecord && (
                <span className="font-semibold text-foreground">
                  {' '}
                  {deletingRecord.number
                    ? `رقم ${deletingRecord.number}`
                    : GENDER_LABELS[deletingRecord.gender]}{' '}
                </span>
              )}
              ؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
