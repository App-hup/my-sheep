'use client';

import { useState, useMemo } from 'react';
import type {
  SheepProfile,
  PregnancyRecord,
  DiseaseRecord,
  BirthRecord,
  FeedSection,
  VaccinationRecord,
} from '@/lib/types';
import { generateId, calculateAgeInMonths, formatDateArabic, formatShortDate } from '@/lib/storage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import EmptyState from '@/components/ui/empty-state';
import {
  Fence,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Heart,
  Baby,
  Syringe,
  Package,
  User,
  Info,
  X,
} from 'lucide-react';

// ─── Props ─────────────────────────────────────────────────────────

interface SheepProfilesProps {
  profiles: SheepProfile[];
  onProfilesChange: (profiles: SheepProfile[]) => void;
  pregnancies: PregnancyRecord[];
  diseases: DiseaseRecord[];
  births: BirthRecord[];
  feedSections: FeedSection[];
  vaccinations: VaccinationRecord[];
}

// ─── Constants ──────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { value: 'male', label: 'ذكر' },
  { value: 'female', label: 'أنثى' },
  { value: 'unknown', label: 'غير معروف' },
] as const;

const GENDER_ICON_MAP: Record<string, 'ذكر' | 'أنثى' | '—'> = {
  male: 'ذكر',
  female: 'أنثى',
  unknown: '—',
};

interface FormData {
  number: string;
  name: string;
  section: string;
  gender: 'male' | 'female' | 'unknown';
  birthDate: string;
  notes: string;
  photo: string;
}

const EMPTY_FORM: FormData = {
  number: '',
  name: '',
  section: '',
  gender: 'unknown',
  birthDate: '',
  notes: '',
  photo: '',
};

// ─── Main Component ────────────────────────────────────────────────

export default function SheepProfiles({
  profiles,
  onProfilesChange,
  pregnancies,
  diseases,
  births,
  feedSections,
  vaccinations,
}: SheepProfilesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSection, setFilterSection] = useState<string>('all');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<SheepProfile | null>(null);
  const [viewingProfile, setViewingProfile] = useState<SheepProfile | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [showFilters, setShowFilters] = useState(false);

  // ─── Filtered profiles ──────────────────────────────────────

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const query = searchQuery.trim().toLowerCase();
      if (query && !p.number.toLowerCase().includes(query) && !p.name.toLowerCase().includes(query)) {
        return false;
      }
      if (filterSection !== 'all' && p.section !== filterSection) return false;
      if (filterGender !== 'all' && p.gender !== filterGender) return false;
      return true;
    });
  }, [profiles, searchQuery, filterSection, filterGender]);

  // ─── Stats ──────────────────────────────────────────────────

  const stats = useMemo(() => {
    return {
      total: profiles.length,
      males: profiles.filter((p) => p.gender === 'male').length,
      females: profiles.filter((p) => p.gender === 'female').length,
      unknown: profiles.filter((p) => p.gender === 'unknown').length,
    };
  }, [profiles]);

  // ─── Cross-linking helper ───────────────────────────────────

  const getLinkedRecords = (sheepNumber: string) => {
    return {
      pregnancies: pregnancies.filter((r) => r.sheepNumber === sheepNumber),
      diseases: diseases.filter((r) => r.sheepNumber === sheepNumber),
      vaccinations: vaccinations.filter((r) => r.sheepNumber === sheepNumber),
      births: births.filter((r) => r.number === sheepNumber),
    };
  };

  // ─── Form handlers ──────────────────────────────────────────

  const openAddDialog = () => {
    setEditingProfile(null);
    setFormData(EMPTY_FORM);
    setFormDialogOpen(true);
  };

  const openEditDialog = (profile: SheepProfile) => {
    setEditingProfile(profile);
    setFormData({
      number: profile.number,
      name: profile.name,
      section: profile.section,
      gender: profile.gender,
      birthDate: profile.birthDate,
      notes: profile.notes,
      photo: profile.photo,
    });
    setFormDialogOpen(true);
  };

  const openDetailDialog = (profile: SheepProfile) => {
    setViewingProfile(profile);
    setDetailDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.number.trim()) return;

    if (editingProfile) {
      const updated = profiles.map((p) =>
        p.id === editingProfile.id
          ? {
              ...p,
              number: formData.number.trim(),
              name: formData.name.trim(),
              section: formData.section,
              gender: formData.gender,
              birthDate: formData.birthDate,
              notes: formData.notes.trim(),
              photo: formData.photo,
              updatedAt: new Date().toISOString(),
            }
          : p,
      );
      onProfilesChange(updated);
    } else {
      const newProfile: SheepProfile = {
        id: generateId(),
        number: formData.number.trim(),
        name: formData.name.trim(),
        section: formData.section,
        gender: formData.gender,
        birthDate: formData.birthDate,
        notes: formData.notes.trim(),
        photo: formData.photo,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onProfilesChange([...profiles, newProfile]);
    }

    setFormDialogOpen(false);
    setEditingProfile(null);
    setFormData(EMPTY_FORM);
  };

  const handleDelete = () => {
    if (!viewingProfile) return;
    onProfilesChange(profiles.filter((p) => p.id !== viewingProfile.id));
    setDeleteDialogOpen(false);
    setDetailDialogOpen(false);
    setViewingProfile(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return; // max 2MB
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFormData((prev) => ({ ...prev, photo: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const getAgeLabel = (birthDate: string) => {
    if (!birthDate) return '—';
    const months = calculateAgeInMonths(birthDate);
    if (months < 1) return 'أقل من شهر';
    if (months < 12) return `${months} شهر`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return rem > 0 ? `${years} سنة و ${rem} شهر` : `${years} سنة`;
  };

  const getSectionName = (sectionName: string) => {
    if (!sectionName) return 'غير محدد';
    const found = feedSections.find((s) => s.name === sectionName);
    return found ? found.name : sectionName;
  };

  const getSectionColor = (sectionName: string) => {
    const found = feedSections.find((s) => s.name === sectionName);
    return found ? found.color : '#6B7280';
  };

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* ── Stats Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatsCard
          icon={<User className="size-4 text-teal-600 dark:text-teal-400" />}
          label="إجمالي مسجل"
          value={stats.total}
          color="teal"
        />
        <StatsCard
          icon={<User className="size-4 text-sky-600 dark:text-sky-400" />}
          label="ذكور"
          value={stats.males}
          color="sky"
        />
        <StatsCard
          icon={<User className="size-4 text-pink-600 dark:text-pink-400" />}
          label="إناث"
          value={stats.females}
          color="pink"
        />
        <StatsCard
          icon={<User className="size-4 text-gray-500 dark:text-gray-400" />}
          label="غير محدد"
          value={stats.unknown}
          color="gray"
        />
      </div>

      {/* ── Search & Filters ─────────────────────────────── */}
      <Card className="border-teal-200 dark:border-teal-800/50 bg-teal-50/30 dark:bg-teal-950/10">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="بحث برقم أو اسم الأغنام..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9 text-right h-9"
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

            {/* Toggle filters + Add button */}
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={`gap-2 h-9 ${showFilters ? 'bg-teal-50 dark:bg-teal-950/30 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300' : ''}`}
              >
                <Filter className="size-3.5" />
                <span className="hidden sm:inline">تصفية</span>
              </Button>
              <Button
                onClick={openAddDialog}
                size="sm"
                className="gap-2 h-9 bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-700 text-white"
              >
                <Plus className="size-3.5" />
                إضافة نعجة
              </Button>
            </div>
          </div>

          {/* Filter row */}
          {showFilters && (
            <div className="flex flex-col sm:flex-row gap-3 mt-3 pt-3 border-t border-teal-200/50 dark:border-teal-800/30">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-1 block">القسم</Label>
                <Select value={filterSection} onValueChange={setFilterSection}>
                  <SelectTrigger className="h-9 text-right text-sm">
                    <SelectValue placeholder="جميع الأقسام" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأقسام</SelectItem>
                    {feedSections.map((s) => (
                      <SelectItem key={s.id} value={s.name}>
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-sm" style={{ backgroundColor: s.color }} />
                          {s.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-1 block">الجنس</Label>
                <Select value={filterGender} onValueChange={setFilterGender}>
                  <SelectTrigger className="h-9 text-right text-sm">
                    <SelectValue placeholder="الكل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="male">ذكر</SelectItem>
                    <SelectItem value="female">أنثى</SelectItem>
                    <SelectItem value="unknown">غير معروف</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Profile Cards Grid ────────────────────────────── */}
      {filteredProfiles.length === 0 ? (
        <EmptyState
          icon={<Fence />}
          title={
            profiles.length === 0
              ? 'لا توجد ملفات أغنام مسجلة'
              : 'لا توجد نتائج مطابقة'
          }
          description={
            profiles.length === 0
              ? 'ابدأ بإضافة ملفات الأغنام لتتبع جميع بياناتها في مكان واحد'
              : 'جرّب تغيير معايير البحث أو التصفية'
          }
          action={
            profiles.length === 0
              ? { label: 'إضافة أول نعجة', onClick: openAddDialog }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProfiles.map((profile) => {
            const linked = getLinkedRecords(profile.number);
            const totalRecords =
              linked.pregnancies.length +
              linked.diseases.length +
              linked.births.length +
              linked.vaccinations.length;

            return (
              <Card
                key={profile.id}
                className="group overflow-hidden border-teal-200/60 dark:border-teal-800/40 hover:border-teal-300 dark:hover:border-teal-700 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 glass-card hover-lift animate-card-enter"
              >
                <CardContent className="p-4">
                  {/* Header: photo/avatar + number */}
                  <div className="flex items-start gap-3 mb-3">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {profile.photo ? (
                        <div className="size-12 rounded-xl overflow-hidden border-2 border-teal-200 dark:border-teal-700">
                          <img
                            src={profile.photo}
                            alt={profile.name || profile.number}
                            className="size-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="size-12 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900/40 dark:to-teal-800/30 border-2 border-teal-200 dark:border-teal-700 flex items-center justify-center">
                          <Fence className="size-6 text-teal-600 dark:text-teal-400" />
                        </div>
                      )}
                      {/* Gender badge */}
                      <div className={`absolute -bottom-1 -left-1 size-5 rounded-full flex items-center justify-center border-2 border-card ${
                        profile.gender === 'male'
                          ? 'bg-sky-500'
                          : profile.gender === 'female'
                            ? 'bg-pink-500'
                            : 'bg-gray-400'
                      }`}>
                        <User className="size-2.5 text-white" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground text-sm truncate">
                          #{profile.number}
                        </h3>
                        {profile.name && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 h-4 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 shrink-0"
                          >
                            {profile.name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {profile.section && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <span
                              className="size-2 rounded-sm shrink-0"
                              style={{ backgroundColor: getSectionColor(profile.section) }}
                            />
                            {getSectionName(profile.section)}
                          </span>
                        )}
                        {profile.birthDate && (
                          <>
                            <span className="text-muted-foreground/40">|</span>
                            <span className="text-[11px] text-muted-foreground">
                              {getAgeLabel(profile.birthDate)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick stats row */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    {linked.pregnancies.length > 0 && (
                      <MiniBadge icon={<Baby className="size-3" />} count={linked.pregnancies.length} label="حمل" color="emerald" />
                    )}
                    {linked.diseases.length > 0 && (
                      <MiniBadge icon={<Heart className="size-3" />} count={linked.diseases.length} label="مرض" color="rose" />
                    )}
                    {linked.births.length > 0 && (
                      <MiniBadge icon={<SproutIcon className="size-3" />} count={linked.births.length} label="ولادة" color="sky" />
                    )}
                    {linked.vaccinations.length > 0 && (
                      <MiniBadge icon={<Syringe className="size-3" />} count={linked.vaccinations.length} label="تحصين" color="violet" />
                    )}
                    {totalRecords === 0 && (
                      <span className="text-[11px] text-muted-foreground/60">لا توجد سجلات مرتبطة</span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDetailDialog(profile)}
                      className="gap-1.5 h-7 text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/30"
                    >
                      <Eye className="size-3.5" />
                      عرض
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(profile)}
                      className="gap-1.5 h-7 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Edit className="size-3.5" />
                      تعديل
                    </Button>
                    <div className="flex-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setViewingProfile(profile);
                        setDeleteDialogOpen(true);
                      }}
                      className="gap-1.5 h-7 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Showing count ──────────────────────────────────── */}
      {filteredProfiles.length > 0 && (searchQuery || filterSection !== 'all' || filterGender !== 'all') && (
        <p className="text-center text-xs text-muted-foreground">
          عرض {filteredProfiles.length} من {profiles.length} ملف
        </p>
      )}

      {/* ═══ Add/Edit Dialog ═══ */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-[480px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingProfile ? (
                <>
                  <Edit className="size-5 text-teal-600 dark:text-teal-400" />
                  تعديل ملف الأغنام
                </>
              ) : (
                <>
                  <Plus className="size-5 text-teal-600 dark:text-teal-400" />
                  إضافة ملف أغنام جديد
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Photo */}
            <div className="flex items-center gap-4">
              <div className="relative">
                {formData.photo ? (
                  <div className="size-16 rounded-xl overflow-hidden border-2 border-teal-200 dark:border-teal-700">
                    <img src={formData.photo} alt="صورة" className="size-full object-cover" />
                  </div>
                ) : (
                  <div className="size-16 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900/40 dark:to-teal-800/30 border-2 border-dashed border-teal-300 dark:border-teal-600 flex items-center justify-center">
                    <Fence className="size-7 text-teal-400" />
                  </div>
                )}
                {formData.photo && (
                  <button
                    onClick={() => setFormData((prev) => ({ ...prev, photo: '' }))}
                    className="absolute -top-1 -left-1 size-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-sm"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">صورة الأغنام</Label>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">حد أقصى 2 ميغابايت</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-1.5 h-7 text-xs gap-1.5"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => handlePhotoUpload(e as unknown as React.ChangeEvent<HTMLInputElement>);
                    input.click();
                  }}
                >
                  <Plus className="size-3" />
                  رفع صورة
                </Button>
              </div>
            </div>

            <Separator />

            {/* Number */}
            <div>
              <Label className="text-sm font-medium">
                رقم الأغنام <span className="text-rose-500">*</span>
              </Label>
              <Input
                placeholder="مثال: 001"
                value={formData.number}
                onChange={(e) => setFormData((prev) => ({ ...prev, number: e.target.value }))}
                className="mt-1.5 text-right h-9"
              />
            </div>

            {/* Name */}
            <div>
              <Label className="text-sm font-medium">الاسم / اللقب (اختياري)</Label>
              <Input
                placeholder="مثال: فاطمة، زهرة..."
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="mt-1.5 text-right h-9"
              />
            </div>

            {/* Gender + Birth Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium">الجنس</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(v) =>
                    setFormData((prev) => ({
                      ...prev,
                      gender: v as 'male' | 'female' | 'unknown',
                    }))
                  }
                >
                  <SelectTrigger className="mt-1.5 h-9 text-right text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">تاريخ الميلاد</Label>
                <Input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, birthDate: e.target.value }))
                  }
                  className="mt-1.5 text-right h-9"
                />
              </div>
            </div>

            {/* Section */}
            <div>
              <Label className="text-sm font-medium">القسم</Label>
              <Select
                value={formData.section || 'none'}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, section: v === 'none' ? '' : v }))
                }
              >
                <SelectTrigger className="mt-1.5 h-9 text-right text-sm">
                  <SelectValue placeholder="اختر القسم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون قسم</SelectItem>
                  {feedSections.map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2 rounded-sm"
                          style={{ backgroundColor: s.color }}
                        />
                        {s.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div>
              <Label className="text-sm font-medium">ملاحظات</Label>
              <Textarea
                placeholder="أي ملاحظات إضافية..."
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                className="mt-1.5 text-right min-h-[80px] resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={handleSave}
                disabled={!formData.number.trim()}
                className="flex-1 h-9 bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-700 text-white"
              >
                {editingProfile ? 'حفظ التعديلات' : 'إضافة الملف'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setFormDialogOpen(false)}
                className="flex-1 h-9"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ Detail View Dialog ═══ */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh]" dir="rtl">
          {viewingProfile && (
            <DetailContent
              profile={viewingProfile}
              linked={getLinkedRecords(viewingProfile.number)}
              getAgeLabel={getAgeLabel}
              getSectionName={getSectionName}
              getSectionColor={getSectionColor}
              onEdit={() => {
                setDetailDialogOpen(false);
                openEditDialog(viewingProfile);
              }}
              onDelete={() => setDeleteDialogOpen(true)}
              feedSections={feedSections}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ Delete Confirmation ═══ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف ملف الأغنام</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف ملف الأغنام رقم #{viewingProfile?.number}
              {viewingProfile?.name ? ` (${viewingProfile.name})` : ''}؟
              لن يتم حذف السجلات المرتبطة به (الحمل، الأمراض، المواليد، التحصينات).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700"
            >
              نعم، حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Detail Content ────────────────────────────────────────────────

function DetailContent({
  profile,
  linked,
  getAgeLabel,
  getSectionName,
  getSectionColor,
  onEdit,
  onDelete,
  feedSections,
}: {
  profile: SheepProfile;
  linked: {
    pregnancies: PregnancyRecord[];
    diseases: DiseaseRecord[];
    vaccinations: VaccinationRecord[];
    births: BirthRecord[];
  };
  getAgeLabel: (d: string) => string;
  getSectionName: (s: string) => string;
  getSectionColor: (s: string) => string;
  onEdit: () => void;
  onDelete: () => void;
  feedSections: FeedSection[];
}) {
  const totalRecords =
    linked.pregnancies.length +
    linked.diseases.length +
    linked.births.length +
    linked.vaccinations.length;

  return (
    <>
      <DialogHeader>
        <div className="flex items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <Eye className="size-5 text-teal-600 dark:text-teal-400" />
            ملف الأغنام #{profile.number}
          </DialogTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="gap-1.5 h-7 text-xs text-teal-600 dark:text-teal-400"
            >
              <Edit className="size-3.5" />
              تعديل
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="gap-1.5 h-7 text-xs text-rose-500"
            >
              <Trash2 className="size-3.5" />
              حذف
            </Button>
          </div>
        </div>
      </DialogHeader>

      <ScrollArea className="max-h-[65vh]">
        <div className="space-y-4 pt-2">
          {/* Profile header card */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/50 dark:border-teal-800/30">
            {/* Photo / Avatar */}
            <div className="shrink-0">
              {profile.photo ? (
                <div className="size-16 rounded-xl overflow-hidden border-2 border-teal-200 dark:border-teal-700">
                  <img src={profile.photo} alt={profile.name || profile.number} className="size-full object-cover" />
                </div>
              ) : (
                <div className="size-16 rounded-xl bg-gradient-to-br from-teal-200 to-teal-300 dark:from-teal-800/50 dark:to-teal-700/40 border-2 border-teal-300 dark:border-teal-600 flex items-center justify-center">
                  <Fence className="size-8 text-teal-600 dark:text-teal-400" />
                </div>
              )}
            </div>

            {/* Basic info */}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-foreground">#{profile.number}</h3>
                {profile.name && (
                  <Badge className="text-xs bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border-0">
                    {profile.name}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="size-3" />
                  {profile.gender === 'male' ? 'ذكر' : profile.gender === 'female' ? 'أنثى' : 'غير معروف'}
                </span>
                {profile.birthDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    العمر: {getAgeLabel(profile.birthDate)}
                  </span>
                )}
                {profile.section && (
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-sm" style={{ backgroundColor: getSectionColor(profile.section) }} />
                    {getSectionName(profile.section)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick record counts */}
          <div className="grid grid-cols-4 gap-2">
            <QuickCountBadge icon={<Baby className="size-3.5" />} count={linked.pregnancies.length} label="حمل" color="emerald" />
            <QuickCountBadge icon={<Heart className="size-3.5" />} count={linked.diseases.length} label="مرض" color="rose" />
            <QuickCountBadge icon={<SproutIcon className="size-3.5" />} count={linked.births.length} label="ولادة" color="sky" />
            <QuickCountBadge icon={<Syringe className="size-3.5" />} count={linked.vaccinations.length} label="تحصين" color="violet" />
          </div>

          {/* Tabs for linked records */}
          <Tabs defaultValue="overview" dir="rtl">
            <TabsList className="h-auto bg-muted/50 p-1 rounded-lg w-full grid grid-cols-5">
              <TabsTrigger value="overview" className="text-xs gap-1 py-1.5 px-2 rounded-md data-[state=active]:bg-teal-100 dark:data-[state=active]:bg-teal-900/30 data-[state=active]:text-teal-700 dark:data-[state=active]:text-teal-300">
                <Info className="size-3" />
                نظرة عامة
              </TabsTrigger>
              <TabsTrigger value="pregnancies" className="text-xs gap-1 py-1.5 px-2 rounded-md data-[state=active]:bg-emerald-100 dark:data-[state=active]:bg-emerald-900/30 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-300">
                <Baby className="size-3" />
                حمل ({linked.pregnancies.length})
              </TabsTrigger>
              <TabsTrigger value="diseases" className="text-xs gap-1 py-1.5 px-2 rounded-md data-[state=active]:bg-rose-100 dark:data-[state=active]:bg-rose-900/30 data-[state=active]:text-rose-700 dark:data-[state=active]:text-rose-300">
                <Heart className="size-3" />
                أمراض ({linked.diseases.length})
              </TabsTrigger>
              <TabsTrigger value="births" className="text-xs gap-1 py-1.5 px-2 rounded-md data-[state=active]:bg-sky-100 dark:data-[state=active]:bg-sky-900/30 data-[state=active]:text-sky-700 dark:data-[state=active]:text-sky-300">
                <SproutIcon className="size-3" />
                مواليد ({linked.births.length})
              </TabsTrigger>
              <TabsTrigger value="vaccinations" className="text-xs gap-1 py-1.5 px-2 rounded-md data-[state=active]:bg-violet-100 dark:data-[state=active]:bg-violet-900/30 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300">
                <Syringe className="size-3" />
                تحصينات ({linked.vaccinations.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-3">
              <OverviewTab profile={profile} getAgeLabel={getAgeLabel} totalRecords={totalRecords} />
            </TabsContent>

            <TabsContent value="pregnancies" className="mt-3">
              <PregnancyTab records={linked.pregnancies} />
            </TabsContent>

            <TabsContent value="diseases" className="mt-3">
              <DiseaseTab records={linked.diseases} />
            </TabsContent>

            <TabsContent value="births" className="mt-3">
              <BirthTab records={linked.births} />
            </TabsContent>

            <TabsContent value="vaccinations" className="mt-3">
              <VaccinationTab records={linked.vaccinations} />
            </TabsContent>
          </Tabs>

          {/* Notes */}
          {profile.notes && (
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs font-medium text-muted-foreground mb-1">ملاحظات</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{profile.notes}</p>
            </div>
          )}

          {/* Dates */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
            <span>أُنشئ: {formatShortDate(profile.createdAt)}</span>
            <span>آخر تحديث: {formatShortDate(profile.updatedAt)}</span>
          </div>
        </div>
      </ScrollArea>
    </>
  );
}

// ─── Overview Tab ──────────────────────────────────────────────────

function OverviewTab({
  profile,
  getAgeLabel,
  totalRecords,
}: {
  profile: SheepProfile;
  getAgeLabel: (d: string) => string;
  totalRecords: number;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <InfoRow label="رقم الأغنام" value={`#${profile.number}`} />
        <InfoRow label="الاسم" value={profile.name || '—'} />
        <InfoRow
          label="الجنس"
          value={
            profile.gender === 'male'
              ? 'ذكر'
              : profile.gender === 'female'
                ? 'أنثى'
                : 'غير معروف'
          }
        />
        <InfoRow
          label="تاريخ الميلاد"
          value={profile.birthDate ? `${formatDateArabic(profile.birthDate)} (${getAgeLabel(profile.birthDate)})` : '—'}
        />
        <InfoRow label="القسم" value={profile.section || 'غير محدد'} />
        <InfoRow label="إجمالي السجلات" value={`${totalRecords} سجل`} />
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded-lg bg-muted/30">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
    </div>
  );
}

// ─── Pregnancy Tab ─────────────────────────────────────────────────

function PregnancyTab({ records }: { records: PregnancyRecord[] }) {
  if (records.length === 0) {
    return <EmptyTab icon={<Baby className="size-6" />} message="لا توجد سجلات حمل مرتبطة" />;
  }
  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {records.map((r) => (
        <div key={r.id} className="p-3 rounded-lg border border-emerald-200/50 dark:border-emerald-800/30 bg-emerald-50/30 dark:bg-emerald-950/10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              {r.status === 'monitored' ? 'تحت المراقبة' : 'غير مراقب'}
            </span>
            <span className="text-[10px] text-muted-foreground">{formatShortDate(r.monitoringDate)}</span>
          </div>
          <div className="text-[11px] text-muted-foreground space-y-0.5">
            <p>الفحص الأول: {r.firstExamResult === 'yes' ? 'إيجابي' : r.firstExamResult === 'no' ? 'سلبي' : '—'}</p>
            {r.expectedBirthDate && (
              <p>الموعد المتوقع: {formatShortDate(r.expectedBirthDate)}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Disease Tab ───────────────────────────────────────────────────

function DiseaseTab({ records }: { records: DiseaseRecord[] }) {
  if (records.length === 0) {
    return <EmptyTab icon={<Heart className="size-6" />} message="لا توجد سجلات أمراض مرتبطة" />;
  }
  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {records.map((r) => (
        <div key={r.id} className="p-3 rounded-lg border border-rose-200/50 dark:border-rose-800/30 bg-rose-50/30 dark:bg-rose-950/10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 truncate max-w-[60%]">
              {r.symptoms || 'بدون أعراض'}
            </span>
            <span className="text-[10px] text-muted-foreground">{formatShortDate(r.createdAt)}</span>
          </div>
          <div className="text-[11px] text-muted-foreground space-y-0.5">
            {r.suggestedTreatment && <p>العلاج: {r.suggestedTreatment}</p>}
            {r.treatmentDuration && <p>المدة: {r.treatmentDuration}</p>}
            {r.followUp ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ تمت المتابعة</span>
            ) : r.suggestedTreatment ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">⏳ بانتظار المتابعة</span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Birth Tab ─────────────────────────────────────────────────────

function BirthTab({ records }: { records: BirthRecord[] }) {
  if (records.length === 0) {
    return <EmptyTab icon={<SproutIcon className="size-6" />} message="لا توجد سجلات مواليد مرتبطة" />;
  }
  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {records.map((r) => (
        <div key={r.id} className="p-3 rounded-lg border border-sky-200/50 dark:border-sky-800/30 bg-sky-50/30 dark:bg-sky-950/10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">
              {r.gender === 'male' ? 'ذكر' : 'أنثى'} {r.fromPregnancy ? '(من حمل)' : ''}
            </span>
            <span className="text-[10px] text-muted-foreground">{formatShortDate(r.birthDate)}</span>
          </div>
          <div className="text-[11px] text-muted-foreground space-y-0.5">
            <p>الغرض: {r.purpose === 'breeding' ? 'تربية' : r.purpose === 'sale' ? 'بيع' : 'ذبح'}</p>
            {r.ageInMonths > 0 && <p>العمر: {r.ageInMonths} شهر</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Vaccination Tab ───────────────────────────────────────────────

function VaccinationTab({ records }: { records: VaccinationRecord[] }) {
  if (records.length === 0) {
    return <EmptyTab icon={<Syringe className="size-6" />} message="لا توجد سجلات تحصينات مرتبطة" />;
  }
  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {records.map((r) => (
        <div key={r.id} className="p-3 rounded-lg border border-violet-200/50 dark:border-violet-800/30 bg-violet-50/30 dark:bg-violet-950/10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300 truncate max-w-[60%]">
              {r.vaccineName || 'بدون اسم'}
            </span>
            <StatusBadge status={r.status} />
          </div>
          <div className="text-[11px] text-muted-foreground space-y-0.5">
            <p>تاريخ التحصين: {formatShortDate(r.vaccinationDate)}</p>
            {r.nextDueDate && <p>الموعد القادم: {formatShortDate(r.nextDueDate)}</p>}
            {r.doseNumber > 0 && <p>الجرعة: {r.doseNumber}</p>}
            {r.veterinarian && <p>الطبيب البيطري: {r.veterinarian}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    completed: { label: 'مكتمل', cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
    scheduled: { label: 'مجدول', cls: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300' },
    overdue: { label: 'متأخر', cls: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300' },
  };
  const s = map[status] || map.completed;
  return <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>;
}

// ─── Empty Tab ─────────────────────────────────────────────────────

function EmptyTab({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
      <div className="size-10 rounded-full bg-muted/50 flex items-center justify-center opacity-50">
        {icon}
      </div>
      <p className="text-xs">{message}</p>
    </div>
  );
}

// ─── Mini Badge ────────────────────────────────────────────────────

function MiniBadge({
  icon,
  count,
  label,
  color,
}: {
  icon: React.ReactNode;
  count: number;
  label: string;
  color: string;
}) {
  const bgMap: Record<string, string> = {
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    rose: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    sky: 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    violet: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800',
  };

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${bgMap[color] || ''}`}>
      {icon}
      {count} {label}
    </span>
  );
}

// ─── Quick Count Badge ─────────────────────────────────────────────

function QuickCountBadge({
  icon,
  count,
  label,
  color,
}: {
  icon: React.ReactNode;
  count: number;
  label: string;
  color: string;
}) {
  const bgMap: Record<string, string> = {
    emerald: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/30',
    rose: 'bg-rose-50 dark:bg-rose-950/20 border-rose-200/50 dark:border-rose-800/30',
    sky: 'bg-sky-50 dark:bg-sky-950/20 border-sky-200/50 dark:border-sky-800/30',
    violet: 'bg-violet-50 dark:bg-violet-950/20 border-violet-200/50 dark:border-violet-800/30',
  };
  const iconMap: Record<string, string> = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    rose: 'text-rose-600 dark:text-rose-400',
    sky: 'text-sky-600 dark:text-sky-400',
    violet: 'text-violet-600 dark:text-violet-400',
  };
  const valueMap: Record<string, string> = {
    emerald: 'text-emerald-700 dark:text-emerald-300',
    rose: 'text-rose-700 dark:text-rose-300',
    sky: 'text-sky-700 dark:text-sky-300',
    violet: 'text-violet-700 dark:text-violet-300',
  };

  return (
    <div className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border ${bgMap[color] || ''}`}>
      <div className={iconMap[color]}>{icon}</div>
      <span className={`text-lg font-bold tabular-nums ${valueMap[color]}`}>{count}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

// ─── Stats Card ────────────────────────────────────────────────────

function StatsCard({
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
    teal: 'bg-teal-50 dark:bg-teal-950/20 border-teal-100 dark:border-teal-800',
    sky: 'bg-sky-50 dark:bg-sky-950/20 border-sky-100 dark:border-sky-800',
    pink: 'bg-pink-50 dark:bg-pink-950/20 border-pink-100 dark:border-pink-800',
    gray: 'bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800',
  };

  return (
    <Card className={`${bgMap[color]} border`}>
      <CardContent className="p-3 flex items-center gap-2.5">
        {icon}
        <div>
          <p className="text-xl font-bold tabular-nums">{value}</p>
          <p className="text-[10px] text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Sprout Icon Fallback ──────────────────────────────────────────

function SproutIcon({ className }: { className?: string }) {
  // Using Package as fallback since Sprout may not render in all contexts
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M7 20h10" />
      <path d="M10 20c5.5-2.5.8-6.4 3-10" />
      <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
      <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
    </svg>
  );
}
