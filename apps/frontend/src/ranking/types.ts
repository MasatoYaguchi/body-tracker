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
  endDate: string | null;
  rankings: RankingParticipant[];
}
