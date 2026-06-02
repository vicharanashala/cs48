import { Request, Response } from 'express';
import { Question } from '../../models/Question';
import { SearchLog, UnansweredSearch } from '../../models/SearchLog';
import { successResponse, getPagination, buildPaginationMeta } from '../../utils/helpers';
import { AppError } from '../../middlewares/error.middleware';

type SearchCandidate = Record<string, unknown> & { score?: number };

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const levenshteinDistance = (a: string, b: string): number => {
  const alen = a.length;
  const blen = b.length;
  if (!alen) return blen;
  if (!blen) return alen;

  const dp: number[][] = Array.from({ length: alen + 1 }, () => Array(blen + 1).fill(0));
  for (let i = 0; i <= alen; i += 1) dp[i][0] = i;
  for (let j = 0; j <= blen; j += 1) dp[0][j] = j;

  for (let i = 1; i <= alen; i += 1) {
    for (let j = 1; j <= blen; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[alen][blen];
};

const similarityScore = (source: string, target: string): number => {
  if (!source || !target) return 0;
  const distance = levenshteinDistance(source, target);
  return Math.max(0, 1 - distance / Math.max(source.length, target.length, 1));
};

const buildRelevanceScore = (question: any, tokens: string[], queryLower: string, textScore = 0) => {
  let score = textScore * 100;
  const title = String(question.title).toLowerCase();
  const description = String(question.description).toLowerCase();
  const tags: string[] = Array.isArray(question.tags)
    ? question.tags.map((tag: unknown) => String(tag).toLowerCase())
    : [];

  if (title.includes(queryLower)) score += 80;
  if (description.includes(queryLower)) score += 25;

  tokens.forEach((token) => {
    if (title.includes(token)) score += 30;
    else score += Math.floor(similarityScore(token, title) * 14);

    if (description.includes(token)) score += 10;
    else score += Math.floor(similarityScore(token, description) * 5);

    if (tags.some((tag) => tag === token)) score += 20;
    else if (tags.some((tag) => tag.includes(token))) score += 8;
  });

  score += (question.trendingScore ?? 0) * 0.35;
  score += (question.searchClickCount ?? 0) * 0.25;
  score += (question.answerCount ?? 0) * 2;
  score += (question.voteScore ?? 0) * 1.5;

  return score;
};

// ─── Full-text search ─────────────────────────────────────────────────────────
export const search = async (req: Request, res: Response): Promise<void> => {
  const query = String(req.query.q || '').trim();
  if (!query) {
    res.json(successResponse([], 'No query provided'));
    return;
  }

  const { page, limit, skip } = getPagination(req.query);
  const queryLower = query.toLowerCase();
  const tokens = queryLower.split(/\s+/).filter(Boolean);
  const tokenRegex = new RegExp(tokens.map(escapeRegex).join('|'), 'i');

  // Log the search
  const searchLog = new SearchLog({ query: queryLower, userId: req.user?.userId ?? null });

  const filter: Record<string, unknown> = {
    status: { $ne: 'deleted' },
    $or: [
      { $text: { $search: query } },
      { title: tokenRegex },
      { description: tokenRegex },
      { tags: { $elemMatch: { $regex: tokenRegex } } },
    ],
  };

  // Optional category filter
  if (req.query.category) filter.category = req.query.category;

  const total = await Question.countDocuments(filter);
  const candidateLimit = Math.min(Math.max(limit * 5, 100), Math.max(total, 100));

  const rawResults = (await Question.find(filter, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' }, trendingScore: -1 })
    .limit(candidateLimit)
    .populate('author', 'username avatar')
    .populate('category', 'name slug color icon')
    .lean()) as SearchCandidate[];

  const ranked: Array<SearchCandidate & { relevanceScore: number }> = rawResults
    .map((result) => ({
      ...result,
      relevanceScore: buildRelevanceScore(result, tokens, queryLower, Number(result.score ?? 0)),
    }))
    .sort((a, b) => (b.relevanceScore as number) - (a.relevanceScore as number));

  const results = ranked.slice(skip, skip + limit).map(({ relevanceScore, ...rest }) => rest);

  // Update log with result count and save
  searchLog.resultsCount = total;
  await searchLog.save().catch(() => {}); // Non-blocking

  res.json(successResponse(results, 'Search results', buildPaginationMeta(total, page, limit)));
};

// ─── Trending search queries ──────────────────────────────────────────────────
export const getTrendingSearches = async (_req: Request, res: Response): Promise<void> => {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

  const trending = await SearchLog.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: '$query', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
    { $project: { query: '$_id', count: 1, _id: 0 } },
  ]);

  res.json(successResponse(trending));
};

// ─── Recent searches for logged-in user ──────────────────────────────────────
export const getRecentSearches = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.json(successResponse([]));
    return;
  }

  const recent = await SearchLog.find({ userId: req.user.userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('query createdAt')
    .lean();

  // Deduplicate by query
  const seen = new Set<string>();
  const unique = recent.filter((s) => {
    if (seen.has(s.query)) return false;
    seen.add(s.query);
    return true;
  });

  res.json(successResponse(unique));
};

// ─── Report an unanswered search ──────────────────────────────────────────────
export const reportUnanswered = async (req: Request, res: Response): Promise<void> => {
  const { query } = req.body;
  if (!query?.trim()) throw new AppError('Query is required', 400);

  const normalised = query.trim().toLowerCase();
  const userId = req.user?.userId;

  const existing = await UnansweredSearch.findOne({ query: normalised });

  if (existing) {
    if (userId && !existing.reportedBy.some((id) => id.toString() === userId)) {
      existing.reportedBy.push(userId as unknown as import('mongoose').Types.ObjectId);
      existing.count += 1;
      await existing.save();
    }
    res.json(successResponse(existing, 'Report updated'));
  } else {
    const report = await UnansweredSearch.create({
      query: normalised,
      reportedBy: userId ? [userId] : [],
    });
    res.status(201).json(successResponse(report, 'Search reported'));
  }
};
