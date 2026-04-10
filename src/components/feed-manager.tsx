'use client';

import { useState, useCallback, useMemo } from 'react';
import EmptyState from '@/components/ui/empty-state';
import {
  Plus,
  Edit,
  Trash2,
  Layers,
  Calculator,
  Settings2,
  Package,
  BarChart3,
  RefreshCw,
  Ban,
  CheckCircle2,
} from 'lucide-react';
import type { FeedSection, FeedItem } from '@/lib/types';
import { SECTION_COLORS, FEED_UNIT_LABELS } from '@/lib/types';
import { generateId } from '@/lib/storage';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  TableFooter,
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

// ============================================================
// Props
// ============================================================

interface FeedManagerProps {
  sections: FeedSection[];
  onSectionsChange: (sections: FeedSection[]) => void;
}

// ============================================================
// Form State Types
// ============================================================

interface SectionFormState {
  name: string;
}

interface FeedFormState {
  name: string;
  qty: string;
  unit: FeedItem['unit'];
}

const EMPTY_SECTION_FORM: SectionFormState = { name: '' };
const EMPTY_FEED_FORM: FeedFormState = { name: '', qty: '', unit: 'kg' };

// ============================================================
// Helper: get next color from SECTION_COLORS
// ============================================================

function getNextColor(existingSections: FeedSection[]): string {
  const usedColors = existingSections.map((s) => s.color);
  const available = SECTION_COLORS.find((c) => !usedColors.includes(c));
  if (available) return available;
  return SECTION_COLORS[existingSections.length % SECTION_COLORS.length];
}

// ============================================================
// Main Component
// ============================================================

export default function FeedManager({ sections, onSectionsChange }: FeedManagerProps) {
  // ----------------------------------------------------------
  // Core state
  // ----------------------------------------------------------
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // ----------------------------------------------------------
  // Section dialog state
  // ----------------------------------------------------------
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [editSectionOpen, setEditSectionOpen] = useState(false);
  const [deleteSectionOpen, setDeleteSectionOpen] = useState(false);
  const [sectionForm, setSectionForm] = useState<SectionFormState>(EMPTY_SECTION_FORM);
  const [targetSectionId, setTargetSectionId] = useState<string | null>(null);

  // ----------------------------------------------------------
  // Feed dialog state
  // ----------------------------------------------------------
  const [addFeedOpen, setAddFeedOpen] = useState(false);
  const [editFeedOpen, setEditFeedOpen] = useState(false);
  const [deleteFeedOpen, setDeleteFeedOpen] = useState(false);
  const [feedForm, setFeedForm] = useState<FeedFormState>(EMPTY_FEED_FORM);
  const [targetFeedId, setTargetFeedId] = useState<string | null>(null);

  // ----------------------------------------------------------
  // Derived state
  // ----------------------------------------------------------
  const selectedSection = useMemo(
    () => sections.find((s) => s.id === selectedSectionId) ?? null,
    [sections, selectedSectionId],
  );

  // ============================================================
  // Section CRUD handlers
  // ============================================================

  const handleAddSection = useCallback(() => {
    const trimmed = sectionForm.name.trim();
    if (!trimmed) return;
    const newSection: FeedSection = {
      id: generateId(),
      name: trimmed,
      count: 0,
      color: getNextColor(sections),
      feeds: [],
      createdAt: new Date().toISOString(),
    };
    onSectionsChange([...sections, newSection]);
    setSectionForm(EMPTY_SECTION_FORM);
    setAddSectionOpen(false);
  }, [sectionForm.name, sections, onSectionsChange]);

  const handleEditSection = useCallback(() => {
    const trimmed = sectionForm.name.trim();
    if (!trimmed || !targetSectionId) return;
    onSectionsChange(
      sections.map((s) => (s.id === targetSectionId ? { ...s, name: trimmed } : s)),
    );
    setSectionForm(EMPTY_SECTION_FORM);
    setTargetSectionId(null);
    setEditSectionOpen(false);
  }, [sectionForm.name, targetSectionId, sections, onSectionsChange]);

  const handleDeleteSection = useCallback(() => {
    if (!targetSectionId) return;
    onSectionsChange(sections.filter((s) => s.id !== targetSectionId));
    if (selectedSectionId === targetSectionId) {
      setSelectedSectionId(null);
    }
    setTargetSectionId(null);
    setDeleteSectionOpen(false);
  }, [targetSectionId, sections, selectedSectionId, onSectionsChange]);

  const handleSectionCountChange = useCallback(
    (sectionId: string, count: number) => {
      onSectionsChange(
        sections.map((s) => (s.id === sectionId ? { ...s, count: Math.max(0, count) } : s)),
      );
    },
    [sections, onSectionsChange],
  );

  // ============================================================
  // Feed CRUD handlers
  // ============================================================

  const handleAddFeed = useCallback(() => {
    const trimmedName = feedForm.name.trim();
    const qty = parseFloat(feedForm.qty);
    if (!trimmedName || isNaN(qty) || qty < 0 || !selectedSectionId) return;

    const newFeed: FeedItem = {
      id: generateId(),
      name: trimmedName,
      qty,
      unit: feedForm.unit,
    };

    onSectionsChange(
      sections.map((s) =>
        s.id === selectedSectionId ? { ...s, feeds: [...s.feeds, newFeed] } : s,
      ),
    );
    setFeedForm(EMPTY_FEED_FORM);
    setAddFeedOpen(false);
  }, [feedForm, selectedSectionId, sections, onSectionsChange]);

  const handleEditFeed = useCallback(() => {
    const trimmedName = feedForm.name.trim();
    const qty = parseFloat(feedForm.qty);
    if (!trimmedName || isNaN(qty) || qty < 0 || !targetFeedId || !selectedSectionId) return;

    onSectionsChange(
      sections.map((s) =>
        s.id === selectedSectionId
          ? {
              ...s,
              feeds: s.feeds.map((f) =>
                f.id === targetFeedId ? { ...f, name: trimmedName, qty, unit: feedForm.unit } : f,
              ),
            }
          : s,
      ),
    );
    setFeedForm(EMPTY_FEED_FORM);
    setTargetFeedId(null);
    setEditFeedOpen(false);
  }, [feedForm, targetFeedId, selectedSectionId, sections, onSectionsChange]);

  const handleDeleteFeed = useCallback(() => {
    if (!targetFeedId || !selectedSectionId) return;
    onSectionsChange(
      sections.map((s) =>
        s.id === selectedSectionId
          ? { ...s, feeds: s.feeds.filter((f) => f.id !== targetFeedId) }
          : s,
      ),
    );
    setTargetFeedId(null);
    setDeleteFeedOpen(false);
  }, [targetFeedId, selectedSectionId, sections, onSectionsChange]);

  // ============================================================
  // Dialog open helpers (set form defaults)
  // ============================================================

  const openAddSectionDialog = () => {
    setSectionForm(EMPTY_SECTION_FORM);
    setAddSectionOpen(true);
  };

  const openEditSectionDialog = (section: FeedSection) => {
    setSectionForm({ name: section.name });
    setTargetSectionId(section.id);
    setEditSectionOpen(true);
  };

  const openDeleteSectionDialog = (sectionId: string) => {
    setTargetSectionId(sectionId);
    setDeleteSectionOpen(true);
  };

  const openAddFeedDialog = () => {
    setFeedForm(EMPTY_FEED_FORM);
    setAddFeedOpen(true);
  };

  const openEditFeedDialog = (feed: FeedItem) => {
    setFeedForm({ name: feed.name, qty: String(feed.qty), unit: feed.unit });
    setTargetFeedId(feed.id);
    setEditFeedOpen(true);
  };

  const openDeleteFeedDialog = (feedId: string) => {
    setTargetFeedId(feedId);
    setDeleteFeedOpen(true);
  };

  // ============================================================
  // Reset all
  // ============================================================
  const handleReset = () => {
    onSectionsChange([]);
    setSelectedSectionId(null);
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
            <Package className="h-5 w-5 text-amber-700 dark:text-amber-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">إدارة الأعلاف</h2>
            <p className="text-sm text-muted-foreground">تعريف الأقسام والعليقة وحساب الاحتياجات اليومية</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleReset}>
          <RefreshCw className="h-4 w-4" />
          إعادة تعيين
        </Button>
      </div>

      <Separator />

      {/* Three-Panel Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ========== Panel 1: Section Management ========== */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Layers className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                إدارة الأقسام
              </CardTitle>
              <Button size="sm" className="gap-1.5 bg-amber-600 hover:bg-amber-700" onClick={openAddSectionDialog}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">إضافة قسم</span>
              </Button>
            </div>
            <CardDescription>
              {sections.length === 0
                ? 'لا توجد أقسام بعد. أضف قسماً للبدء.'
                : `${sections.length} قسم مسجل`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {sections.length === 0 ? (
              <EmptyState
                icon={<Layers />}
                title="لا توجد أقسام"
                description='اضغط على "إضافة قسم" لإنشاء قسم جديد'
              />
            ) : (
              <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                {sections.map((section) => (
                  <SectionCard
                    key={section.id}
                    section={section}
                    isSelected={section.id === selectedSectionId}
                    onSelect={() => setSelectedSectionId(section.id)}
                    onEdit={() => openEditSectionDialog(section)}
                    onDelete={() => openDeleteSectionDialog(section.id)}
                    onCountChange={(count) => handleSectionCountChange(section.id, count)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ========== Panel 2: Feed Definition ========== */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Settings2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                تعريف العليقة
              </CardTitle>
              {selectedSection && (
                <Button
                  size="sm"
                  className="gap-1.5 bg-amber-600 hover:bg-amber-700"
                  onClick={openAddFeedDialog}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">إضافة مكون</span>
                </Button>
              )}
            </div>
            {selectedSection ? (
              <CardDescription className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: selectedSection.color }}
                />
                <span className="font-medium" style={{ color: selectedSection.color }}>
                  {selectedSection.name}
                </span>
                <span className="text-muted-foreground">
                  — {selectedSection.count} رأس
                </span>
              </CardDescription>
            ) : (
              <CardDescription>اختر قسماً من القائمة لإدارة عليقته</CardDescription>
            )}
          </CardHeader>
          <CardContent className="flex-1">
            {!selectedSection ? (
              <EmptyState
                icon={<Ban />}
                title="لم يتم اختيار قسم"
                description='اختر قسماً من "إدارة الأقسام" لتعريف عليقته'
              />
            ) : selectedSection.feeds.length === 0 ? (
              <EmptyState
                icon={<Package />}
                title="لا توجد مكونات"
                description="أضف مكونات العليقة (برسيم، شعير، وافي تربية، فيتامينات...)"
                action={{
                  label: 'إضافة مكون',
                  onClick: openAddFeedDialog,
                }}
              />
            ) : (
              <div className="max-h-[420px] overflow-y-auto pr-1">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">المكون</TableHead>
                      <TableHead className="text-center w-24">الكمية</TableHead>
                      <TableHead className="text-center w-24">الوحدة</TableHead>
                      <TableHead className="text-center w-24">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedSection.feeds.map((feed, idx) => (
                      <TableRow key={feed.id} className={idx % 2 === 0 ? '' : 'bg-muted/30'}>
                        <TableCell className="font-medium text-right">{feed.name}</TableCell>
                        <TableCell className="text-center tabular-nums">{feed.qty}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="text-xs">
                            {FEED_UNIT_LABELS[feed.unit]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => openEditFeedDialog(feed)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => openDeleteFeedDialog(feed.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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

        {/* ========== Panel 3: Results ========== */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              النتائج
            </CardTitle>
            <CardDescription>
              حساب الاحتياجات اليومية من الأعلاف لكل قسم
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {sections.length === 0 ? (
              <EmptyState
                icon={<Calculator />}
                title="لا توجد نتائج"
                description="أضف أقساماً ومكونات العليقة لعرض النتائج"
              />
            ) : sections.every((s) => s.feeds.length === 0 || s.count === 0) ? (
              <EmptyState
                icon={<Calculator />}
                title="النتائج غير مكتملة"
                description="تأكد من تعريف مكونات العليقة وتحديد عدد الأغنام"
              />
            ) : (
              <div className="max-h-[420px] space-y-5 overflow-y-auto pr-1">
                {sections
                  .filter((s) => s.feeds.length > 0)
                  .map((section) => (
                    <ResultsTable key={section.id} section={section} />
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ========== Dialogs ========== */}

      {/* --- Add Section Dialog --- */}
      <Dialog open={addSectionOpen} onOpenChange={setAddSectionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              إضافة قسم جديد
            </DialogTitle>
            <DialogDescription>أدخل اسم القسم الجديد (مثال: المرضعات، الحوامل، التسمين)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="add-section-name">اسم القسم</Label>
              <Input
                id="add-section-name"
                placeholder="مثال: المرضعات"
                value={sectionForm.name}
                onChange={(e) => setSectionForm({ name: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSection();
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSectionOpen(false)}>
              إلغاء
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              onClick={handleAddSection}
              disabled={!sectionForm.name.trim()}
            >
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Edit Section Dialog --- */}
      <Dialog open={editSectionOpen} onOpenChange={setEditSectionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              تعديل القسم
            </DialogTitle>
            <DialogDescription>تعديل اسم القسم</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-section-name">اسم القسم</Label>
              <Input
                id="edit-section-name"
                placeholder="اسم القسم"
                value={sectionForm.name}
                onChange={(e) => setSectionForm({ name: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEditSection();
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSectionOpen(false)}>
              إلغاء
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              onClick={handleEditSection}
              disabled={!sectionForm.name.trim()}
            >
              حفظ التعديلات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Delete Section AlertDialog --- */}
      <AlertDialog open={deleteSectionOpen} onOpenChange={setDeleteSectionOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              حذف القسم
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا القسم؟ سيتم حذف جميع مكونات العليقة المرتبطة به. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDeleteSection}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- Add Feed Dialog --- */}
      <Dialog open={addFeedOpen} onOpenChange={setAddFeedOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              إضافة مكون عليقة
            </DialogTitle>
            <DialogDescription>
              أضف مكون جديد لعليقة قسم &quot;{selectedSection?.name}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="add-feed-name">اسم المكون</Label>
              <Input
                id="add-feed-name"
                placeholder="مثال: برسيم، شعير، وافي تربية"
                value={feedForm.name}
                onChange={(e) => setFeedForm((prev) => ({ ...prev, name: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-feed-qty">الكمية للرأس</Label>
                <Input
                  id="add-feed-qty"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={feedForm.qty}
                  onChange={(e) => setFeedForm((prev) => ({ ...prev, qty: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddFeed();
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>الوحدة</Label>
                <Select
                  value={feedForm.unit}
                  onValueChange={(val) =>
                    setFeedForm((prev) => ({ ...prev, unit: val as FeedItem['unit'] }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">كجم</SelectItem>
                    <SelectItem value="g">جرام</SelectItem>
                    <SelectItem value="ml">مل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddFeedOpen(false)}>
              إلغاء
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              onClick={handleAddFeed}
              disabled={!feedForm.name.trim() || !feedForm.qty || parseFloat(feedForm.qty) < 0}
            >
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Edit Feed Dialog --- */}
      <Dialog open={editFeedOpen} onOpenChange={setEditFeedOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              تعديل مكون العليقة
            </DialogTitle>
            <DialogDescription>تعديل بيانات مكون العليقة</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-feed-name">اسم المكون</Label>
              <Input
                id="edit-feed-name"
                placeholder="اسم المكون"
                value={feedForm.name}
                onChange={(e) => setFeedForm((prev) => ({ ...prev, name: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-feed-qty">الكمية للرأس</Label>
                <Input
                  id="edit-feed-qty"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={feedForm.qty}
                  onChange={(e) => setFeedForm((prev) => ({ ...prev, qty: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditFeed();
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>الوحدة</Label>
                <Select
                  value={feedForm.unit}
                  onValueChange={(val) =>
                    setFeedForm((prev) => ({ ...prev, unit: val as FeedItem['unit'] }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">كجم</SelectItem>
                    <SelectItem value="g">جرام</SelectItem>
                    <SelectItem value="ml">مل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditFeedOpen(false)}>
              إلغاء
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              onClick={handleEditFeed}
              disabled={!feedForm.name.trim() || !feedForm.qty || parseFloat(feedForm.qty) < 0}
            >
              حفظ التعديلات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Delete Feed AlertDialog --- */}
      <AlertDialog open={deleteFeedOpen} onOpenChange={setDeleteFeedOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              حذف مكون العليقة
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا المكون من العليقة؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDeleteFeed}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// SectionCard Sub-component
// ============================================================

function SectionCard({
  section,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onCountChange,
}: {
  section: FeedSection;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCountChange: (count: number) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`
        group relative cursor-pointer rounded-lg border-2 p-3 transition-all duration-200
        ${isSelected ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20 shadow-sm' : 'border-border bg-card hover:border-amber-300 dark:hover:border-amber-600 hover:bg-amber-50/50 dark:hover:bg-amber-950/10'}
      `}
    >
      {/* Color indicator bar */}
      <div
        className="absolute right-0 top-0 h-full w-1 rounded-r-lg"
        style={{ backgroundColor: section.color }}
      />

      {/* Header row */}
      <div className="flex items-center gap-2 pr-2">
        <div
          className="h-3 w-3 shrink-0 rounded-full ring-2 ring-offset-1"
          style={{ backgroundColor: section.color, ringColor: section.color }}
        />
        <span className="flex-1 truncate text-sm font-semibold" style={{ color: section.color }}>
          {section.name}
        </span>
        {isSelected && (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        )}
      </div>

      {/* Sheep count + actions row */}
      <div className="mt-2 flex items-center gap-2 pr-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-xs text-muted-foreground whitespace-nowrap">عدد الأغنام:</span>
          <Input
            type="number"
            min="0"
            value={section.count || ''}
            onChange={(e) => {
              const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
              onCountChange(isNaN(val) ? 0 : val);
            }}
            onClick={(e) => e.stopPropagation()}
            className="h-7 w-20 text-center text-sm"
            placeholder="0"
          />
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Feed count badge */}
      {section.feeds.length > 0 && (
        <div className="mt-1.5 flex items-center gap-1 pr-2">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {section.feeds.length} مكون
          </Badge>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ResultsTable Sub-component
// ============================================================

function ResultsTable({ section }: { section: FeedSection }) {
  const hasValidData = section.count > 0 && section.feeds.length > 0;

  return (
    <div className="rounded-lg border">
      {/* Section header */}
      <div
        className="flex items-center gap-2 rounded-t-lg px-3 py-2"
        style={{ backgroundColor: `${section.color}10` }}
      >
        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: section.color }} />
        <span className="text-sm font-semibold" style={{ color: section.color }}>
          {section.name}
        </span>
        <Badge variant="outline" className="mr-auto text-xs" style={{ borderColor: section.color, color: section.color }}>
          {section.count} رأس
        </Badge>
      </div>

      {!hasValidData ? (
        <div className="px-3 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            {section.count === 0
              ? 'يرجى تحديد عدد الأغنام لحساب الاحتياجات'
              : 'لا توجد مكونات عليقة معرّفة لهذا القسم'}
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right text-xs font-semibold">اسم العلف</TableHead>
              <TableHead className="text-center text-xs font-semibold">للرأس</TableHead>
              <TableHead className="text-center text-xs font-semibold">عدد الأغنام</TableHead>
              <TableHead className="text-center text-xs font-semibold">الإجمالي</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {section.feeds.map((feed, idx) => {
              const total = feed.qty * section.count;
              return (
                <TableRow key={feed.id} className={idx % 2 === 0 ? '' : 'bg-muted/20'}>
                  <TableCell className="text-right text-sm">{feed.name}</TableCell>
                  <TableCell className="text-center text-sm tabular-nums">
                    {feed.qty} {FEED_UNIT_LABELS[feed.unit]}
                  </TableCell>
                  <TableCell className="text-center text-sm tabular-nums">{section.count}</TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 text-sm font-semibold text-amber-700 dark:text-amber-300 tabular-nums">
                      {total % 1 === 0 ? total : total.toFixed(2)} {FEED_UNIT_LABELS[feed.unit]}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
