### TODO

- `apps/frontend/src/dashboard/QuickRecordForm.tsx` を非制御入力＋小さなコンポーネント分割にリファクタし、`ref` で値を取得して送信時にバリデーションする形にして再レンダリングを抑える。
- 最新レコードの値は `Dashboard` から `defaultValue` で渡す（`useEffect` ではなく `key={latest?.id ?? 'empty'}` で再マウントして初期値を取り直す）。

### 実装イメージ（抜粋）
```tsx
// Dashboard 側
const latest = records[0] ?? null;
<QuickRecordForm
  key={latest?.id ?? 'empty'}
  onRecordAdded={loadData}
  initialWeight={latest ? latest.weight.toString() : ''}
  initialBodyFat={latest ? latest.bodyFatPercentage.toString() : ''}
  initialDate={latest ? latest.date : new Date().toISOString().split('T')[0]}
/>

// QuickRecordForm 側
type NumberInputProps = {
  id: string; label: string; step?: string; min?: string; max?: string;
  defaultValue?: string;
  inputRef: React.RefObject<HTMLInputElement>;
};
function NumberInput({ id, label, step, min, max, defaultValue, inputRef }: NumberInputProps) {
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        defaultValue={defaultValue}
        step={step}
        min={min}
        max={max}
        ref={inputRef}
        className="form-input"
      />
    </div>
  );
}

export function QuickRecordForm({
  onRecordAdded,
  initialWeight = '',
  initialBodyFat = '',
  initialDate = new Date().toISOString().split('T')[0],
}: QuickRecordFormProps) {
  const weightRef = useRef<HTMLInputElement>(null);
  const bodyFatRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const weightNum = Number.parseFloat(weightRef.current?.value ?? '');
    const bodyFatNum = Number.parseFloat(bodyFatRef.current?.value ?? '');
    const date = dateRef.current?.value ?? '';
    // ここでバリデーション → API 呼び出し
  };

  return (
    <form onSubmit={handleSubmit}>
      <NumberInput id="weight" label="体重" inputRef={weightRef} defaultValue={initialWeight} />
      <NumberInput
        id="bodyFat"
        label="体脂肪率"
        inputRef={bodyFatRef}
        defaultValue={initialBodyFat}
      />
      <input ref={dateRef} type="date" defaultValue={initialDate} />
      <button type="submit">追加</button>
    </form>
  );
}
```
