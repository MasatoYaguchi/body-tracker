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
  userId: string;
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
