'use client';

import { useState } from 'react';
import { Baby, HeartPulse, Sprout, Syringe, Menu, Package, User, Wallet, Scale, Download, Upload, Settings } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface MobileBottomNavProps {
  activeTab: string;
  onNavigateToTab: (tab: string) => void;
  onExport: () => void;
  onImport: () => void;
  onSettings: () => void;
}

interface NavItem {
  label: string;
  tab: string;
  icon: React.ElementType;
  color: string;
  activeBg: string;
  activeText: string;
}

const MAIN_NAV_ITEMS: NavItem[] = [
  {
    label: 'متابعة الحمل',
    tab: 'pregnancy',
    icon: Baby,
    color: 'text-emerald-600 dark:text-emerald-400',
    activeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    activeText: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    label: 'الأمراض',
    tab: 'diseases',
    icon: HeartPulse,
    color: 'text-rose-600 dark:text-rose-400',
    activeBg: 'bg-rose-50 dark:bg-rose-950/40',
    activeText: 'text-rose-700 dark:text-rose-300',
  },
  {
    label: 'المواليد',
    tab: 'births',
    icon: Sprout,
    color: 'text-sky-600 dark:text-sky-400',
    activeBg: 'bg-sky-50 dark:bg-sky-950/40',
    activeText: 'text-sky-700 dark:text-sky-300',
  },
  {
    label: 'التحصينات',
    tab: 'vaccinations',
    icon: Syringe,
    color: 'text-violet-600 dark:text-violet-400',
    activeBg: 'bg-violet-50 dark:bg-violet-950/40',
    activeText: 'text-violet-700 dark:text-violet-300',
  },
];

const MORE_TAB_ITEMS: NavItem[] = [
  {
    label: 'الأعلاف',
    tab: 'feed',
    icon: Package,
    color: 'text-amber-600 dark:text-amber-400',
    activeBg: 'bg-amber-50 dark:bg-amber-950/40',
    activeText: 'text-amber-700 dark:text-amber-300',
  },
  {
    label: 'سجل الأغنام',
    tab: 'profiles',
    icon: User,
    color: 'text-teal-600 dark:text-teal-400',
    activeBg: 'bg-teal-50 dark:bg-teal-950/40',
    activeText: 'text-teal-700 dark:text-teal-300',
  },
  {
    label: 'المالية',
    tab: 'financial',
    icon: Wallet,
    color: 'text-orange-600 dark:text-orange-400',
    activeBg: 'bg-orange-50 dark:bg-orange-950/40',
    activeText: 'text-orange-700 dark:text-orange-300',
  },
  {
    label: 'الأوزان',
    tab: 'weight',
    icon: Scale,
    color: 'text-lime-600 dark:text-lime-400',
    activeBg: 'bg-lime-50 dark:bg-lime-950/40',
    activeText: 'text-lime-700 dark:text-lime-300',
  },
];

export default function MobileBottomNav({
  activeTab,
  onNavigateToTab,
  onExport,
  onImport,
  onSettings,
}: MobileBottomNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);

  const handleNavigate = (tab: string) => {
    onNavigateToTab(tab);
    setMoreOpen(false);
  };

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav className="no-print lg:hidden fixed bottom-0 inset-x-0 z-50 glass-header border-t animate-slide-up-fade">
        <div className="flex items-center justify-around px-1 safe-bottom">
          {MAIN_NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.tab;
            const Icon = item.icon;
            return (
              <button
                key={item.tab}
                onClick={() => handleNavigate(item.tab)}
                className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg transition-all duration-200 min-w-0 flex-1 btn-press ${
                  isActive
                    ? `${item.activeBg} ${item.activeText}`
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className={`size-5 flex items-center justify-center transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                  <Icon className="size-5" />
                </div>
                <span className="text-[10px] font-medium leading-tight truncate max-w-full">
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* More Button */}
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg transition-all duration-200 min-w-0 flex-1 btn-press ${
              !MAIN_NAV_ITEMS.some((i) => i.tab === activeTab) && !MORE_TAB_ITEMS.every((i) => i.tab !== activeTab)
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="size-5 flex items-center justify-center">
              <Menu className="size-5" />
            </div>
            <span className="text-[10px] font-medium leading-tight">المزيد</span>
          </button>
        </div>
      </nav>

      {/* More Options Sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh]">
          <SheetHeader className="pb-2">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Menu className="size-5 text-emerald-600 dark:text-emerald-400" />
              المزيد من الأقسام
            </SheetTitle>
          </SheetHeader>

          <div className="mt-2 space-y-1">
            {/* Remaining Tabs */}
            {MORE_TAB_ITEMS.map((item) => {
              const isActive = activeTab === item.tab;
              const Icon = item.icon;
              return (
                <button
                  key={item.tab}
                  onClick={() => handleNavigate(item.tab)}
                  className={`flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm transition-all duration-200 ${
                    isActive
                      ? `${item.activeBg} ${item.activeText} font-semibold border`
                      : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive
                      ? item.activeBg
                      : 'bg-muted/50'
                  }`}>
                    <Icon className={`size-4 ${item.color}`} />
                  </div>
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="ms-auto size-2 rounded-full bg-emerald-500" />
                  )}
                </button>
              );
            })}

            <Separator className="my-3" />

            {/* Quick Actions */}
            <p className="text-xs font-semibold text-muted-foreground px-4 pb-1">إجراءات سريعة</p>

            <button
              onClick={() => { onExport(); setMoreOpen(false); }}
              className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-300"
            >
              <div className="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                <Download className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span>تصدير البيانات</span>
            </button>

            <button
              onClick={() => { onImport(); setMoreOpen(false); }}
              className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-300"
            >
              <div className="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                <Upload className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span>استيراد البيانات</span>
            </button>

            <button
              onClick={() => { onSettings(); setMoreOpen(false); }}
              className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            >
              <div className="size-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                <Settings className="size-4 text-muted-foreground" />
              </div>
              <span>الإعدادات</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
