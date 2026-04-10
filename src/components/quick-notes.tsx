'use client';

import { useState, useEffect, useCallback } from 'react';
import { StickyNote, Plus, Trash2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface QuickNote {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  color: string;
}

const DEFAULT_COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899'];
const STORAGE_KEY = 'alhazira_notes';
const MAX_NOTES = 50;

type FilterType = 'all' | 'active' | 'completed';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

function loadNotes(): QuickNote[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveNotes(notes: QuickNote[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    // localStorage might be full
  }
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'الآن';
  if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
  if (diffHr < 24) return `منذ ${diffHr} ساعة`;
  if (diffDay < 7) return `منذ ${diffDay} يوم`;
  return `منذ ${Math.floor(diffDay / 7)} أسبوع`;
}

export default function QuickNotes() {
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [mounted, setMounted] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0]);
  const [filter, setFilter] = useState<FilterType>('all');

  // Load from localStorage on mount — standard hydration pattern for client-only state
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNotes(loadNotes());
    setMounted(true);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (mounted) {
      saveNotes(notes);
    }
  }, [notes, mounted]);

  const addNote = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    if (notes.length >= MAX_NOTES) return;

    const newNote: QuickNote = {
      id: generateId(),
      text: trimmed,
      completed: false,
      createdAt: new Date().toISOString(),
      color: selectedColor,
    };

    setNotes((prev) => [newNote, ...prev]);
    setInputText('');
  }, [inputText, selectedColor, notes.length]);

  const toggleNote = useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, completed: !n.completed } : n))
    );
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setNotes((prev) => prev.filter((n) => !n.completed));
  }, []);

  const filteredNotes = notes.filter((note) => {
    if (filter === 'active') return !note.completed;
    if (filter === 'completed') return note.completed;
    return true;
  });

  const completedCount = notes.filter((n) => n.completed).length;
  const activeCount = notes.filter((n) => !n.completed).length;

  if (!mounted) {
    return (
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <StickyNote className="size-4 animate-pulse" />
            <span className="text-sm">جارٍ التحميل...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="size-7 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200/60 dark:from-emerald-900/40 dark:to-emerald-800/30 flex items-center justify-center">
              <StickyNote className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            ملاحظات سريعة
            {notes.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ms-1">
                {notes.length}
              </Badge>
            )}
          </CardTitle>
          {completedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCompleted}
              className="text-[11px] text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 h-7 px-2"
            >
              <Trash2 className="size-3 me-1" />
              مسح المكتملة ({completedCount})
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Input Area */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addNote();
              }}
              placeholder="أضف ملاحظة جديدة..."
              className="text-sm h-9 flex-1"
              maxLength={200}
            />
            <Button
              onClick={addNote}
              disabled={!inputText.trim() || notes.length >= MAX_NOTES}
              size="sm"
              className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
            >
              <Plus className="size-4" />
            </Button>
          </div>

          {/* Color Picker */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">اللون:</span>
            {DEFAULT_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className="size-5 rounded-full transition-all duration-200 hover:scale-110 focus-glow"
                style={{
                  backgroundColor: color,
                  outline: selectedColor === color ? `2px solid ${color}` : 'none',
                  outlineOffset: selectedColor === color ? '2px' : '0',
                  opacity: selectedColor === color ? 1 : 0.5,
                  boxShadow: selectedColor === color ? `0 0 0 2px var(--background), 0 0 0 4px ${color}40` : 'none',
                }}
                aria-label={`اللون ${color}`}
              />
            ))}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5">
          {([
            { key: 'all' as FilterType, label: 'الكل', count: notes.length },
            { key: 'active' as FilterType, label: 'نشطة', count: activeCount },
            { key: 'completed' as FilterType, label: 'مكتملة', count: completedCount },
          ]).map((pill) => (
            <button
              key={pill.key}
              onClick={() => setFilter(pill.key)}
              className={`text-[11px] px-2.5 py-1 rounded-full transition-all duration-200 ${
                filter === pill.key
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {pill.label}
              <span className="ms-0.5 opacity-60">({pill.count})</span>
            </button>
          ))}
        </div>

        {/* Notes List */}
        <div className="space-y-1.5 max-h-72 overflow-y-auto scrollbar-thin">
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <StickyNote className="size-8 mb-2 opacity-30" />
              <p className="text-sm">
                {notes.length === 0 ? 'لا توجد ملاحظات بعد' : 'لا توجد ملاحظات في هذا التصنيف'}
              </p>
              {notes.length === 0 && (
                <p className="text-[11px] mt-1 opacity-60">
                  أضف ملاحظتك الأولى للمتابعة اليومية
                </p>
              )}
            </div>
          ) : (
            filteredNotes.map((note) => (
              <div
                key={note.id}
                className={`group flex items-start gap-2 rounded-lg px-3 py-2.5 transition-all duration-200 hover:bg-muted/50 border-r-[3px] animate-card-enter ${
                  note.completed ? 'opacity-60' : ''
                }`}
                style={{ borderRightColor: note.color }}
              >
                <Checkbox
                  checked={note.completed}
                  onCheckedChange={() => toggleNote(note.id)}
                  className="mt-0.5 shrink-0 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm leading-relaxed break-words ${
                      note.completed
                        ? 'line-through text-muted-foreground'
                        : 'text-foreground'
                    }`}
                  >
                    {note.text}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    {formatRelativeTime(note.createdAt)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteNote(note.id)}
                  className="size-7 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-opacity"
                  aria-label="حذف الملاحظة"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Footer Info */}
        {notes.length > 0 && (
          <div className="flex items-center justify-between text-[10px] text-muted-foreground/60 pt-1">
            <span>{activeCount} نشطة · {completedCount} مكتملة</span>
            <span>{notes.length}/{MAX_NOTES} ملاحظة</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
