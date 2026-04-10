export interface ActivityItem {
  id: string;
  type: 'pregnancy' | 'disease' | 'birth' | 'feed' | 'vaccination' | 'data';
  action: 'create' | 'update' | 'delete' | 'export' | 'import' | 'clear';
  description: string;
  timestamp: string;
  details?: string;
}

const ACTIVITY_KEY = 'alhazira_activity_log';
const MAX_ACTIVITIES = 50;

export function addActivity(item: Omit<ActivityItem, 'id' | 'timestamp'>): void {
  if (typeof window === 'undefined') return;
  try {
    const activities = loadActivities();
    activities.unshift({
      ...item,
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activities.slice(0, MAX_ACTIVITIES)));
  } catch {
    /* ignore */
  }
}

export function loadActivities(): ActivityItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function clearActivities(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACTIVITY_KEY);
}

// Helper to get action label in Arabic
export function getActionLabel(action: ActivityItem['action']): string {
  switch (action) {
    case 'create':
      return 'إضافة';
    case 'update':
      return 'تعديل';
    case 'delete':
      return 'حذف';
    case 'export':
      return 'تصدير';
    case 'import':
      return 'استيراد';
    case 'clear':
      return 'مسح';
  }
}

export function getTypeIcon(type: ActivityItem['type']): string {
  switch (type) {
    case 'pregnancy':
      return 'Baby';
    case 'disease':
      return 'HeartPulse';
    case 'birth':
      return 'Sprout';
    case 'feed':
      return 'Package';
    case 'vaccination':
      return 'Syringe';
    case 'data':
      return 'Database';
    default:
      return 'Activity';
  }
}

export function getTypeColor(type: ActivityItem['type']): string {
  switch (type) {
    case 'pregnancy':
      return 'emerald';
    case 'disease':
      return 'rose';
    case 'birth':
      return 'sky';
    case 'feed':
      return 'amber';
    case 'vaccination':
      return 'violet';
    case 'data':
      return 'gray';
    default:
      return 'gray';
  }
}

export function getTypeLabel(type: ActivityItem['type']): string {
  switch (type) {
    case 'pregnancy':
      return 'الحمل';
    case 'disease':
      return 'الأمراض';
    case 'birth':
      return 'المواليد';
    case 'feed':
      return 'الأعلاف';
    case 'vaccination':
      return 'التحصين';
    case 'data':
      return 'البيانات';
    default:
      return type;
  }
}

export function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `منذ ${diffDays} يوم`;
  return new Date(timestamp).toLocaleDateString('ar-SA');
}
