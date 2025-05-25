export const validateBodyRecord = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (typeof data.weight !== 'number' || data.weight <= 0 || data.weight > 1000) {
    errors.push('体重は0から1000の間で入力してください')
  }
  
  if (typeof data.bodyFatPercentage !== 'number' || data.bodyFatPercentage < 0 || data.bodyFatPercentage > 100) {
    errors.push('体脂肪率は0から100の間で入力してください')
  }
  
  if (!data.date || isNaN(Date.parse(data.date))) {
    errors.push('有効な日付を入力してください')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
