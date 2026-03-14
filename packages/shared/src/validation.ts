interface BodyRecordInput {
  weight: number;
  bodyFatPercentage: number;
  date: string;
}

// バリデーション定数
export const WEIGHT_MIN = 30;
export const WEIGHT_MAX = 150;
export const BODY_FAT_MIN = 1;
export const BODY_FAT_MAX = 50;

export const validateBodyRecord = (
  data: BodyRecordInput,
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (typeof data.weight !== 'number' || data.weight < WEIGHT_MIN || data.weight > WEIGHT_MAX) {
    errors.push(`体重は${WEIGHT_MIN}kgから${WEIGHT_MAX}kgの間で入力してください`);
  }

  if (
    typeof data.bodyFatPercentage !== 'number' ||
    data.bodyFatPercentage < BODY_FAT_MIN ||
    data.bodyFatPercentage > BODY_FAT_MAX
  ) {
    errors.push(`体脂肪率は${BODY_FAT_MIN}%から${BODY_FAT_MAX}%の間で入力してください`);
  }

  if (!data.date || Number.isNaN(Date.parse(data.date))) {
    errors.push('有効な日付を入力してください');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
