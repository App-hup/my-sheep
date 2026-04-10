'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Baby,
  HeartPulse,
  Sprout,
  Package,
  Syringe,
  Database,
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  Activity,
} from 'lucide-react';
import {
  type ActivityItem,
  loadActivities,
  clearActivities,
  getActionLabel,
  getTypeColor,
  getTypeLabel,
  formatRelativeTime,
} from '@/lib/activity-log';

// ─── Icon mapping ────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Baby,
  HeartPulse,
  Sprout,
  Package,
  Syringe,
  Database,
  Activity,
};

// ─── Color maps ──────────────────────────────────────────────────

const COLOR_BORDER: Record<string, string> = {
  emerald: 'border-r-emerald-400 dark:border-r-emerald-500',
  rose: 'border-r-rose-400 dark:border-r-rose-500',
  sky: 'border-r-sky-400 dark:border-r-sky-500',
  amber: 'border-r-amber-400 dark:border-r-amber-500',
  violet: 'border-r-violet-400 dark:border-r-violet-500',
  gray: 'border-r-gray-400 dark:border-r-gray-500',
};

const COLOR_ICON_BG: Record<string, string> = {
  emerald: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
  rose: 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
  sky: 'bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400',
  amber: 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
  violet: 'bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400',
  gray: 'bg-gray-100 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400',
};

const COLOR_BADGE: Record<string, string> = {
  emerald: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
  rose: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700',
  sky: 'bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-700',
  amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700',
  violet: 'bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700',
  gray: 'bg-gray-50 dark:bg-gray-800/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700',
};

const ICON_NAME_MAP: Record<string, string> = {
  pregnancy: 'Baby',
  disease: 'HeartPulse',
  birth: 'Sprout',
  feed: 'Package',
  vaccination: 'Syringe',
  data: 'Database',
};

// ─── Component ───────────────────────────────────────────────────

export default function ActivityTimeline() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    // Poll every 2 seconds to catch updates from other operations
    const interval = setInterval(() => {
      setActivities(loadActivities());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleClear = useCallback(() => {
    clearActivities();
    setActivities([]);
  }, []);

  const VISIBLE_COUNT = 10;
  const displayedActivities = showAll ? activities : activities.slice(0, VISIBLE_COUNT);
  const hasMore = activities.length > VISIBLE_COUNT;

  // Don't render until mounted (avoid hydration mismatch)
  if (!mounted) {
    return (
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Clock className="size-4 text-muted-foreground" />
            <span>سجل النشاط</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-24 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground text-sm">جاري التحميل...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Clock className="size-4 text-muted-foreground" />
            <span>سجل النشاط</span>
            {activities.length > 0 && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-5 tabular-nums"
              >
                {activities.length}
              </Badge>
            )}
          </CardTitle>
          {activities.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs gap-1 h-7 px-2"
            >
              <Trash2 className="size-3" />
              <span>مسح السجل</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <div className="size-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
              <Activity className="size-5 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-medium">لا توجد أنشطة بعد</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              ستظهر هنا العمليات التي تجريها على البيانات
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-[420px]" dir="rtl">
              <div className="space-y-2 pr-1">
                {displayedActivities.map((item, index) => (
                  <ActivityRow key={item.id} item={item} index={index} />
                ))}
              </div>
            </ScrollArea>

            {hasMore && (
              <div className="mt-3 flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                  className="text-xs gap-1 text-muted-foreground hover:text-foreground h-7 px-3"
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="size-3" />
                      <span>عرض أقل</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="size-3" />
                      <span>عرض الكل ({activities.length})</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Activity Row ────────────────────────────────────────────────

function ActivityRow({
  item,
  index,
}: {
  item: ActivityItem;
  index: number;
}) {
  const color = getTypeColor(item.type);
  const iconColor = COLOR_ICON_BG[color] || COLOR_ICON_BG.gray;
  const borderColor = COLOR_BORDER[color] || COLOR_BORDER.gray;
  const badgeColor = COLOR_BADGE[color] || COLOR_BADGE.gray;
  const IconComponent = ICON_MAP[ICON_NAME_MAP[item.type]] || Activity;

  return (
    <div
      className={`
        flex items-start gap-3 p-3 rounded-lg border-r-[3px]
        bg-muted/30 dark:bg-muted/10 hover:bg-muted/50 dark:hover:bg-muted/20
        transition-colors duration-150
        animate-[fadeIn_0.3s_ease-out] opacity-0
        ${borderColor}
      `}
      style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'forwards' }}
    >
      {/* Icon */}
      <div className={`shrink-0 size-8 rounded-lg flex items-center justify-center ${iconColor}`}>
        <IconComponent className="size-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground truncate">
            {item.description}
          </span>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 h-4 shrink-0 ${badgeColor}`}
          >
            {getActionLabel(item.action)} · {getTypeLabel(item.type)}
          </Badge>
        </div>
        {item.details && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {item.details}
          </p>
        )}
        <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground/70">
          <Clock className="size-2.5" />
          <span>{formatRelativeTime(item.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}
