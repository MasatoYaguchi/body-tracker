# Body Tracker 全体レビュー（2026-03-21）

## 1. レビュー対象と方法
- 対象: backend / frontend / shared / ワークスペース設定
- 観点: セキュリティ、統一感、一般的ベストプラクティス
- 実施内容:
  - 重要実装の精読（認証、API、ストレージ、CORS、設定）
  - パターン検索（トークン処理、ログ出力、バリデーション、重複実装）
  - 品質ゲート実行（type-check / lint）

## 2. 主要な指摘（重大度順）

### High

1. Google IDトークン検証を tokeninfo のクエリ文字列で実施している
- 根拠: [apps/backend/src/auth/google.ts](apps/backend/src/auth/google.ts#L65)
- 問題:
  - id_token を URL クエリに載せると、ログや監視基盤で露出しやすい
  - ネットワーク境界での取り扱いが不必要に広がる
- 改善案:
  - google-auth-library で JWKS ベースの署名検証に切り替え（サーバー内で完結）
  - 最低でもトークン文字列をURLに含めない方式に統一

2. PKCE の state が固定文字列で CSRF 耐性が弱い
- 根拠: [apps/frontend/src/auth/services/authCodeFlow.ts](apps/frontend/src/auth/services/authCodeFlow.ts#L20), [apps/frontend/src/auth/services/authCodeFlow.ts](apps/frontend/src/auth/services/authCodeFlow.ts#L38)
- 問題:
  - state が常に login だと、リクエスト単位の相関検証が成立しない
- 改善案:
  - state を都度ランダム生成し sessionStorage に保存
  - callback で完全一致検証し、検証後は即削除

### Medium

3. JWT を localStorage に保持しており XSS 時の窃取リスクがある
- 根拠: [apps/frontend/src/auth/services/authStorage.ts](apps/frontend/src/auth/services/authStorage.ts#L29), [apps/frontend/src/auth/services/authStorage.ts](apps/frontend/src/auth/services/authStorage.ts#L53)
- 問題:
  - localStorage トークンは JS から読めるため、XSS 侵害時に漏えいしやすい
- 改善案:
  - 中長期: HttpOnly + Secure + SameSite Cookie ベースに移行
  - 移行前: CSP 強化、ログイン寿命短縮、リフレッシュトークン戦略導入

4. 認証コードやトークン相当情報を含むデバッグログが残っている
- 根拠: [apps/frontend/src/auth/components/AuthCallback.tsx](apps/frontend/src/auth/components/AuthCallback.tsx#L12), [apps/frontend/src/auth/services/authApi.ts](apps/frontend/src/auth/services/authApi.ts#L171)
- 問題:
  - URL 全体（code を含む可能性）やレスポンス全体のログ出力は情報漏えいの温床
- 改善案:
  - 本番ビルドで機密ログを禁止（マスク済み logger を導入）
  - 認証関連ログは requestId と結果コード中心に最小化

5. セキュリティヘッダー適用が未実装
- 根拠: [apps/backend/src/server.ts](apps/backend/src/server.ts)
- 問題:
  - CSP、X-Content-Type-Options、Referrer-Policy 等の防御層が不足
- 改善案:
  - Hono の secure headers ミドルウェアを導入
  - Frontend 側も CSP を明示（script-src, connect-src を実態に合わせる）

6. CORS 判定が startsWith ベースで運用されている
- 根拠: [apps/backend/src/server.ts](apps/backend/src/server.ts#L37), [apps/backend/src/server.ts](apps/backend/src/server.ts#L38), [apps/backend/src/server.ts](apps/backend/src/server.ts#L55)
- 問題:
  - 厳密一致より誤判定リスクが高く、将来の条件追加で事故を誘発しやすい
- 改善案:
  - URL パース後の origin 厳密一致（許可リスト）へ変更
  - 環境変数ベースで許可 origin を集中管理

7. JWT 有効期限が長め（30日）で、失効戦略が弱い
- 根拠: [apps/backend/src/auth/google.ts](apps/backend/src/auth/google.ts#L244), [apps/backend/src/routes/auth.ts](apps/backend/src/routes/auth.ts#L186)
- 問題:
  - 長寿命アクセストークンは漏えい時の被害期間が長い
  - サーバー側で無効化できない設計
- 改善案:
  - 短寿命 access token + refresh token ローテーション
  - 失効リストまたは token version 戦略の導入

### Low

8. 認証ステータス API がトークン情報を返却している
- 根拠: [apps/backend/src/routes/auth.ts](apps/backend/src/routes/auth.ts#L213), [apps/backend/src/routes/auth.ts](apps/backend/src/routes/auth.ts#L224)
- 問題:
  - デバッグ用途情報が運用で残ると、情報開示面で不要リスク
- 改善案:
  - 開発環境限定にするか、レスポンス項目を最小化

## 3. 統一感の課題

1. API呼び出し層が分裂している
- 根拠: [apps/frontend/src/auth/services/authApi.ts](apps/frontend/src/auth/services/authApi.ts#L10), [apps/frontend/src/dashboard/Dashboard.tsx](apps/frontend/src/dashboard/Dashboard.tsx#L19), [apps/frontend/src/dashboard/Dashboard.tsx](apps/frontend/src/dashboard/Dashboard.tsx#L24), [apps/frontend/src/dashboard/Dashboard.tsx](apps/frontend/src/dashboard/Dashboard.tsx#L25)
- 問題:
  - Dashboard 側が独自 fetch + localStorage 直参照、Ranking 側は authApi を使用
  - 401時挙動、エラー形式、リトライ方針が統一されない
- 改善案:
  - 共通 API クライアントへ統一（auth header、401処理、エラーマッピングを一元化）

2. 認証フローが新旧混在（ID token 直接送信 + Code PKCE）
- 根拠: [apps/backend/src/routes/auth.ts](apps/backend/src/routes/auth.ts#L45), [apps/backend/src/routes/auth.ts](apps/backend/src/routes/auth.ts#L99), [apps/frontend/src/auth/providers/AuthProvider.tsx](apps/frontend/src/auth/providers/AuthProvider.tsx#L90)
- 問題:
  - 実際の導線は code flow なのに API・型・コメントに旧方式が残存
- 改善案:
  - 方式を code flow に一本化し、未使用 endpoint/型/関数を整理

3. ログポリシーが統一されていない
- 根拠: [apps/backend/src/routes/auth.ts](apps/backend/src/routes/auth.ts#L66), [apps/backend/src/middleware/auth.ts](apps/backend/src/middleware/auth.ts#L56), [apps/frontend/src/auth/components/AuthCallback.tsx](apps/frontend/src/auth/components/AuthCallback.tsx#L12)
- 問題:
  - 機密度に対する出力基準が揃っていない
- 改善案:
  - ログレベルとマスキング規約を明文化し、共通 logger を導入

## 4. ベストプラクティス観点

1. lint コマンドが実運用上失敗する
- 根拠: [package.json](package.json#L16)
- 確認結果:
  - pnpm type-check: 成功
  - pnpm lint: ESLint v9 で eslint.config.js 不在のため失敗
- 改善案:
  - Flat Config の eslint.config.js を追加
  - もしくは当面 ESLint 呼び出しを削除し Biome に一本化

2. テストが存在しない
- 確認結果:
  - テストファイルパターンで該当なし（test/spec）
- 問題:
  - 認証とランキング集計ロジックの回帰検知ができない
- 改善案:
  - 最低限の自動テストを追加
  - 優先: auth code flow, token validation, ranking aggregation

3. バックエンド依存に未使用の可能性があるライブラリが含まれる
- 根拠: [apps/backend/package.json](apps/backend/package.json)
- 問題:
  - 実装は hono/jwt ベースだが jsonwebtoken, google-auth-library が利用実態と乖離している可能性
- 改善案:
  - 依存実使用を棚卸しし、不要依存は削除

## 5. 優先改善ロードマップ

### 即時対応（1-2日）
- tokeninfo URL 検証の廃止と Google 署名検証方式への移行
- PKCE state のランダム化
- 認証関連デバッグログの削除・マスキング
- eslint.config.js 整備（lint を通る状態に）

### 短期対応（1週間）
- API クライアントの一本化（Dashboard から localStorage 直参照を除去）
- セキュリティヘッダー導入
- auth/status の開発限定化

### 中期対応（2-4週間）
- トークン運用の再設計（短寿命 access token + refresh token）
- Cookie ベース認証の検討
- テスト基盤導入と主要フローの自動テスト追加

## 6. まとめ
- セキュリティ上の最優先は「トークン検証方式」「PKCE state」「機密ログ」です。
- 統一感の最優先は「API呼び出し層の統一」と「認証フローの一本化」です。
- 品質運用の最優先は「lint 失敗の解消」と「最小テスト導入」です。
