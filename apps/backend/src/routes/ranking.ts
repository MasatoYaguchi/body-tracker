import type { RankingData } from '@body-tracker/shared';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { Hono } from 'hono';
import { verifyJWT } from '../auth/google';
import { bodyRecords, competitions, users } from '../db/schema';
import type { Bindings, Variables } from '../types';

const ranking = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * 0-indexedの数値を受け取り、"User A", "User B" ... のような匿名名を生成する
 */
function getAnonymousName(index: number): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const char = alphabet[index % 26];
  const loop = Math.floor(index / 26);
  const suffix = loop > 0 ? (loop + 1).toString() : '';
  return `${char}${suffix}さん`;
}

/**
 * ランキングデータ取得エンドポイント
 * GET /api/ranking
 *
 * 誰でも閲覧可能（認証不要）
 * ただし、未認証ユーザーの場合は名前を匿名化する
 */
ranking.get('/', async (c) => {
  const db = c.var.db;
  const env = c.env;

  // 0. 認証状態のチェック（オプショナル）
  let isAuthenticated = false;
  const authHeader = c.req.header('Authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      if (token) {
        // トークン検証に成功すれば認証済みとみなす
        await verifyJWT(token, env.JWT_SECRET);
        isAuthenticated = true;
      }
    } catch (e) {
      // 検証失敗時はゲストとして扱う（ログだけ残す）
      console.log('Optional auth check failed:', e);
    }
  }

  try {
    // 1. 最新のアクティブなコンペティションを取得
    const activeCompetition = await db
      .select()
      .from(competitions)
      .where(eq(competitions.isActive, true))
      .orderBy(desc(competitions.startDate))
      .limit(1)
      .then((res) => res[0]);

    if (!activeCompetition) {
      // コンペティションがない場合はデータなしとして返す（エラーにはしない）
      return c.json({
        competitionName: '開催中のコンペティションはありません',
        startDate: '',
        endDate: '',
        rankings: [],
      } satisfies RankingData);
    }

    // 2. 期間内の全記録を取得 (ユーザー情報も結合)
    // 日付の降順で取得することで、配列の先頭が「最新」、後方が「過去」となるようにする
    const records = await db
      .select({
        userId: bodyRecords.userId,
        weight: bodyRecords.weight,
        bodyFatPercentage: bodyRecords.bodyFatPercentage,
        recordedDate: bodyRecords.recordedDate,
        displayName: users.displayName,
        username: users.username,
      })
      .from(bodyRecords)
      .innerJoin(users, eq(bodyRecords.userId, users.id))
      .where(
        and(
          gte(bodyRecords.recordedDate, activeCompetition.startDate),
          lte(bodyRecords.recordedDate, activeCompetition.endDate),
        ),
      )
      .orderBy(desc(bodyRecords.recordedDate));

    // 2. ユーザーごとに集計
    // Map<userId, { current, baseline }>
    const userStats = new Map<
      string,
      {
        displayName: string | null;
        username: string;
        current: (typeof records)[0];
        baseline: (typeof records)[0];
      }
    >();

    for (const record of records) {
      if (!userStats.has(record.userId)) {
        // 初めて出現 = 最新の記録 (orderBy descのため)
        userStats.set(record.userId, {
          displayName: record.displayName,
          username: record.username,
          current: record,
          baseline: record, // 一旦ベースラインもこれにしておく
        });
      } else {
        // 既に出現済み = より古い記録 -> ベースライン候補として更新
        const stats = userStats.get(record.userId);
        if (stats) {
          stats.baseline = record;
        }
      }
    }

    // 3. スコア計算とランキング生成
    const rankings = Array.from(userStats.values())
      .map((stat) => {
        const currentWeight = Number(stat.current.weight);
        const baselineWeight = Number(stat.baseline.weight);
        const currentBodyFat = Number(stat.current.bodyFatPercentage);
        const baselineBodyFat = Number(stat.baseline.bodyFatPercentage);

        // 体重減少率 (%) = (開始 - 現在) / 開始 * 100
        const weightLossRate =
          baselineWeight > 0 ? ((baselineWeight - currentWeight) / baselineWeight) * 100 : 0;

        // 体脂肪率減少率 (%) = (開始 - 現在) / 開始 * 100
        // ※単純な引き算（ポイント減）ではなく、比率（パーセント減）で評価する仕様とする
        const bodyFatLossRate =
          baselineBodyFat > 0 ? ((baselineBodyFat - currentBodyFat) / baselineBodyFat) * 100 : 0;

        // トータルスコア (単純合算)
        const totalScore = weightLossRate + bodyFatLossRate;

        return {
          userId: stat.current.userId,
          username: stat.displayName || stat.username, // 表示名優先、なければユーザー名
          baselineWeight,
          currentWeight,
          weightLossRate: Number(weightLossRate.toFixed(1)),
          baselineBodyFat,
          currentBodyFat,
          bodyFatLossRate: Number(bodyFatLossRate.toFixed(1)),
          totalScore: Number(totalScore.toFixed(1)),
          recordedAt: stat.current.recordedDate.toISOString(),
        };
      })
      // スコアが高い順にソート
      .sort((a, b) => b.totalScore - a.totalScore)
      // ランク付け
      .map((item, index) => {
        // 未認証ユーザーの場合は名前を匿名化 (User A, User B...)
        const displayName = isAuthenticated ? item.username : getAnonymousName(index);

        return {
          rank: index + 1,
          ...item,
          username: displayName, // 名前を上書き
        };
      });

    return c.json({
      competitionName: activeCompetition.name,
      startDate: activeCompetition.startDate.toISOString().split('T')[0],
      endDate: activeCompetition.endDate.toISOString().split('T')[0],
      rankings,
    } satisfies RankingData);
  } catch (error) {
    console.error('Ranking aggregation error:', error);
    return c.json({ error: 'ランキングの集計に失敗しました' }, 500);
  }
});

export default ranking;
