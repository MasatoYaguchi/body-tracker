export interface RatingButtonsProps {
  /** 各評価のラベル（1から順に） */
  labels: string[];
  /** 現在の評価値（1-5） */
  value: number;
  /** 評価変更時のコールバック */
  onChange: (value: number) => void;
}

export function RatingButtons({ labels, value, onChange }: RatingButtonsProps): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-2">
      {labels.map((label, index) => {
        const ratingValue = index + 1;
        const isSelected = value === ratingValue;

        return (
          <button
            key={ratingValue}
            type="button"
            onClick={() => onChange(ratingValue)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              isSelected
                ? 'bg-primary-100 text-primary-700 ring-2 ring-offset-1 ring-primary-400'
                : 'bg-surface-secondary text-content-secondary hover:bg-border'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
