import { AppState, DEFAULT_APP_STATE } from './types';

const STORAGE_KEY = 'alhazira_data';

export function loadState(): AppState {
  if (typeof window === 'undefined') return DEFAULT_APP_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_APP_STATE;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      pregnancies: Array.isArray(parsed.pregnancies) ? parsed.pregnancies : [],
      diseases: Array.isArray(parsed.diseases) ? parsed.diseases : [],
      births: Array.isArray(parsed.births) ? parsed.births : [],
      feedSections: Array.isArray(parsed.feedSections) ? parsed.feedSections : [],
      vaccinations: Array.isArray(parsed.vaccinations) ? parsed.vaccinations : [],
      sheepProfiles: Array.isArray(parsed.sheepProfiles) ? parsed.sheepProfiles : [],
      financialRecords: Array.isArray(parsed.financialRecords) ? parsed.financialRecords : [],
      weightRecords: Array.isArray(parsed.weightRecords) ? parsed.weightRecords : [],
      milkRecords: Array.isArray(parsed.milkRecords) ? parsed.milkRecords : [],
    };
  } catch {
    return DEFAULT_APP_STATE;
  }
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    console.error('Failed to save state to localStorage');
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export function calculateAgeInMonths(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  return Math.max(0, months);
}

export function addMonthsToDate(dateStr: string, months: number): string {
  const date = new Date(dateStr);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split('T')[0];
}

export function formatDateArabic(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return dateStr;
  }
}
