export interface BodyRecord {
  id: string;
  weight: number;
  bodyFatPercentage: number;
  date: string;
  createdAt: string;
}

export interface Stats {
  count: number;
  latestWeight: number | null;
  latestBodyFat: number | null;
  weightChange: number | null;
  bodyFatChange: number | null;
}

export interface CreateBodyRecordRequest {
  weight: number;
  bodyFatPercentage: number;
  date: string; // ISO形式の日付文字列 TODO: Date型に変更またバリデーションを追加 (別PRで対応予定)
}

export interface UpdateBodyRecordRequest extends CreateBodyRecordRequest {}

export interface RankingParticipant {
  rank: number;
  userId?: string; // 未認証時は undefined
  username: string;
  baselineWeight: number;
  currentWeight: number;
  weightLossRate: number; // %
  baselineBodyFat: number;
  currentBodyFat: number;
  bodyFatLossRate: number; // %
  totalScore: number; // %
  recordedAt: string;
}

export interface RankingData {
  competitionName: string;
  startDate: string;
  endDate: string; // "YYYY-MM-DD" or ""
  rankings: RankingParticipant[];
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiErrorResponse {
  error: string;
}

// ========== 活動記録 ==========

// 運動種目マスタ
export interface ExerciseType {
  id: string;
  name: string;
  sortOrder: number;
}

// 運動エントリ（1日に複数の運動を記録可能）
export interface ExerciseEntry {
  exerciseTypeId: string;
  exerciseType?: ExerciseType;
  minutes: number;
}

// 活動記録
export interface ActivityRecord {
  id: string;
  date: string;
  exercises: ExerciseEntry[]; // 複数の運動を記録可能
  mealRating?: number; // 1-5
  hadSnack: boolean;
  hadAlcohol: boolean;
  notes?: string;
  createdAt: string;
}

export interface CreateActivityRecordRequest {
  date: string;
  exercises: Omit<ExerciseEntry, 'exerciseType'>[];
  mealRating?: number;
  hadSnack: boolean;
  hadAlcohol: boolean;
  notes?: string;
}

export interface CreateExerciseTypeRequest {
  name: string;
  sortOrder?: number;
}
