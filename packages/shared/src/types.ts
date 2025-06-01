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
  date: string;
}

export interface UpdateBodyRecordRequest extends CreateBodyRecordRequest {}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiErrorResponse {
  error: string;
}
