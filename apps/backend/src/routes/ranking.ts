import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { Hono } from 'hono';
import { bodyRecords, competitions, users } from '../db/schema';
import { authMiddleware } from '../middleware/auth';
import type { Bindings, Variables } from '../types';

const ranking = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * ランキングデータ取得エンドポイント
 * GET /api/ranking
 */
ranking.get('/', authMiddleware, async (c) => {
  const db = c.var.db;

  try {
    // アクティブなコンペティションを取得
    const activeCompetition = await db.query.competitions.findFirst({
      where: eq(competitions.isActive, true),
    });

    if (!activeCompetition) {
      return c.json({ error: '開催中のランキングはありません' }, 404);
    }

    // 1. 期間内の全記録を取得 (ユーザー情報も結合)
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
          eq(users.isParticipatingRanking, true),
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
      .map((item, index) => ({
        rank: index + 1,
        ...item,
      }));

    return c.json({
      competitionName: activeCompetition.name,
      startDate: activeCompetition.startDate.toISOString().split('T')[0],
      endDate: activeCompetition.endDate.toISOString().split('T')[0],
      rankings,
    });
  } catch (error) {
    console.error('Ranking aggregation error:', error);
    return c.json({ error: 'ランキングの集計に失敗しました' }, 500);
  }
});

export default ranking;
