-- データベース初期化スクリプト

-- 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ユーザーテーブル（将来の認証用）
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 体重記録テーブル
CREATE TABLE body_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weight DECIMAL(5,2) NOT NULL CHECK (weight > 0 AND weight <= 1000),
    body_fat_percentage DECIMAL(4,2) NOT NULL CHECK (body_fat_percentage >= 0 AND body_fat_percentage <= 100),
    recorded_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX idx_body_records_user_date ON body_records(user_id, recorded_date DESC);
CREATE INDEX idx_body_records_created_at ON body_records(created_at DESC);

-- 更新日時の自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 更新日時トリガー
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_body_records_updated_at BEFORE UPDATE ON body_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 開発用サンプルデータ
INSERT INTO users (username, email) VALUES 
('demo_user', 'demo@example.com'),
('test_user', 'test@example.com');

-- サンプル体重記録（demo_userのデータ）
INSERT INTO body_records (user_id, weight, body_fat_percentage, recorded_date, notes) 
SELECT 
    u.id,
    70.5 + (random() * 5 - 2.5), -- 68〜73kg範囲でランダム
    15.0 + (random() * 3 - 1.5), -- 13.5〜16.5%範囲でランダム
    CURRENT_DATE - (generate_series(1, 30) || ' days')::interval,
    CASE 
        WHEN random() < 0.3 THEN '今日は調子が良い'
        WHEN random() < 0.6 THEN '少し増えた'
        ELSE NULL
    END
FROM users u 
WHERE u.username = 'demo_user';