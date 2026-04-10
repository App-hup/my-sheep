// ========== Pregnancy Tracking ==========
export interface PregnancyRecord {
  id: string;
  sheepNumber: string;
  status: 'monitored' | 'unmonitored';
  monitoringDate: string;
  firstExamDate: string;
  firstExamResult: 'yes' | 'no' | '';
  secondExamDate: string;
  secondExamResult: 'yes' | 'no' | '';
  pregnancyPeriod: number; // in months (auto calculated)
  expectedBirthDate: string;
  birthDate: string;
  maleCount: number;
  femaleCount: number;
  createdAt: string;
  updatedAt: string;
}

// ========== Diseases ==========
export interface DiseaseRecord {
  id: string;
  sheepNumber: string;
  age: string;
  symptoms: string;
  initialExam: string;
  suggestedTreatment: string;
  treatmentDuration: string;
  followUp: string;
  createdAt: string;
  updatedAt: string;
}

// ========== Births ==========
export type BirthPurpose = 'breeding' | 'sale' | 'slaughter';
export type BirthGender = 'male' | 'female';

export interface BirthRecord {
  id: string;
  number: string;
  gender: BirthGender;
  birthDate: string;
  ageInMonths: number; // auto calculated
  purpose: BirthPurpose;
  fromPregnancy: boolean; // auto-generated from pregnancy tab
  pregnancyId?: string; // reference to pregnancy record
  createdAt: string;
}

// ========== Feed Management ==========
export interface FeedItem {
  id: string;
  name: string;
  qty: number;
  unit: 'kg' | 'g' | 'ml';
}

export interface FeedSection {
  id: string;
  name: string;
  count: number;
  color: string;
  feeds: FeedItem[];
  createdAt: string;
}

// ========== Vaccinations ==========
export interface VaccinationRecord {
  id: string;
  sheepNumber: string;
  vaccineName: string;
  vaccinationDate: string;
  nextDueDate: string;
  doseNumber: number; // 1, 2, 3, etc.
  veterinarian: string;
  notes: string;
  status: 'completed' | 'scheduled' | 'overdue';
  createdAt: string;
  updatedAt: string;
}

// ========== Sheep Profile ==========
export interface SheepProfile {
  id: string;
  number: string; // unique sheep number
  name: string; // optional nickname
  section: string; // feed section name (reference)
  gender: 'male' | 'female' | 'unknown';
  birthDate: string;
  notes: string;
  photo: string; // base64 or empty
  createdAt: string;
  updatedAt: string;
}

// ========== Weight Tracking ==========
export type BodyCondition = 'excellent' | 'good' | 'fair' | 'poor';

export interface WeightRecord {
  id: string;
  sheepNumber: string;
  weight: number;        // in kg
  date: string;          // ISO date
  notes: string;
  bodyCondition: BodyCondition;
  createdAt: string;
  updatedAt: string;
}

// ========== Financial Tracking ==========
export interface FinancialRecord {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  description: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ========== Milk Production ==========
export type MilkQuality = 'excellent' | 'good' | 'fair' | 'poor';

export interface MilkRecord {
  id: string;
  sheepNumber: string;
  date: string;           // ISO date
  morningAmount: number;  // liters (صباحي)
  eveningAmount: number;  // liters (مسائي)
  totalAmount: number;    // auto-calculated (morning + evening)
  quality: MilkQuality;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export const MILK_QUALITY_LABELS: Record<MilkQuality, string> = {
  excellent: 'ممتاز',
  good: 'جيد',
  fair: 'مقبول',
  poor: 'ضعيف',
};

// ========== App State ==========
export interface AppState {
  pregnancies: PregnancyRecord[];
  diseases: DiseaseRecord[];
  births: BirthRecord[];
  feedSections: FeedSection[];
  vaccinations: VaccinationRecord[];
  sheepProfiles: SheepProfile[];
  financialRecords: FinancialRecord[];
  weightRecords: WeightRecord[];
  milkRecords: MilkRecord[];
}

export const DEFAULT_APP_STATE: AppState = {
  pregnancies: [],
  diseases: [],
  births: [],
  feedSections: [],
  vaccinations: [],
  sheepProfiles: [],
  financialRecords: [],
  weightRecords: [],
  milkRecords: [],
};

// ========== Helper Types ==========
export const GENDER_LABELS: Record<BirthGender, string> = {
  male: 'ذكر',
  female: 'أنثى',
};

export const PURPOSE_LABELS: Record<BirthPurpose, string> = {
  breeding: 'تربية',
  sale: 'بيع',
  slaughter: 'ذبح',
};

export const FEED_UNIT_LABELS: Record<FeedItem['unit'], string> = {
  kg: 'كجم',
  g: 'جرام',
  ml: 'مل',
};

export const BODY_CONDITION_LABELS: Record<BodyCondition, string> = {
  excellent: 'ممتاز',
  good: 'جيد',
  fair: 'مقبول',
  poor: 'ضعيف',
};

export const SECTION_COLORS = [
  '#059669', // emerald-600
  '#D97706', // amber-600
  '#DC2626', // red-600
  '#7C3AED', // violet-600
  '#2563EB', // blue-600
  '#DB2777', // pink-600
  '#0891B2', // cyan-600
  '#65A30D', // lime-600
  '#CA8A04', // yellow-600
  '#9333EA', // purple-600
];
