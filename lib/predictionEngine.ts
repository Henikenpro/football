// lib/predictionEngine.ts
import { getFixtures } from '@/lib/apiFootball.server';

/**
 * Simple prediction engine:
 * - Fetch last N matches for each team (team-specific)
 * - Compute points per game and goals per game as strength metrics
 * - Compute head-to-head factor from recent mutual matches
 * - Apply home advantage to home team strength
 * - Derive probabilities for 1X2 by normalizing strengths with smoothing and floor/ceiling
 */

type CalculateParams = {
  homeId: number;
  awayId: number;
  leagueId?: number;
  nMatches?: number;
};

type PredictionResult = {
  probabilities: { home: number; draw: number; away: number; over?: number; under?: number };
  factors: { homeStrength: number; awayStrength: number; h2h: number; expectedGoalsHome: number; expectedGoalsAway: number };
  explanation: string;
};

function clamp(v: number, min = 0.01, max = 0.95) {
  return Math.max(min, Math.min(max, v));
}

export async function calculate(params: CalculateParams): Promise<PredictionResult> {
  const { homeId, awayId, nMatches = 10 } = params;

  // fetch recent matches for each team (most recent nMatches)
  const [homeData, awayData] = await Promise.all([
    getFixtures({ team: homeId, season: new Date().getFullYear(), page: 1 }),
    getFixtures({ team: awayId, season: new Date().getFullYear(), page: 1 }),
  ]);

  const homeMatches = (homeData?.response || []).slice(0, nMatches);
  const awayMatches = (awayData?.response || []).slice(0, nMatches);

  // helper to compute points per game and goals per game (for and against)
  function analyze(matches: any[], teamId: number) {
    if (!matches || matches.length === 0) return { ppg: 1.0, goalsFor: 1.0, goalsAgainst: 1.0, matchesCount: 0 };
    let points = 0;
    let gf = 0;
    let ga = 0;
    let played = 0;
    for (const m of matches) {
      const home = m.teams?.home?.id;
      const away = m.teams?.away?.id;
      const isHome = home === teamId;
      const scored = isHome ? (m.goals?.home ?? m.score?.fulltime?.home ?? 0) : (m.goals?.away ?? m.score?.fulltime?.away ?? 0);
      const conceded = isHome ? (m.goals?.away ?? m.score?.fulltime?.away ?? 0) : (m.goals?.home ?? m.score?.fulltime?.home ?? 0);
      if (scored == null || conceded == null) continue;
      played++;
      gf += scored;
      ga += conceded;
      if (scored > conceded) points += 3;
      else if (scored === conceded) points += 1;
    }
    if (played === 0) return { ppg: 1.0, goalsFor: 1.0, goalsAgainst: 1.0, matchesCount: 0 };
    return { ppg: points / played, goalsFor: gf / played, goalsAgainst: ga / played, matchesCount: played };
  }

  const homeStats = analyze(homeMatches, homeId);
  const awayStats = analyze(awayMatches, awayId);

  // head-to-head: look for matches in homeMatches and awayMatches where opponent is the other team
  const mutual: any[] = [];
  for (const m of homeMatches) {
    const h = m.teams?.home?.id;
    const a = m.teams?.away?.id;
    if (h === awayId || a === awayId) mutual.push(m);
  }
  for (const m of awayMatches) {
    const h = m.teams?.home?.id;
    const a = m.teams?.away?.id;
    if (h === homeId || a === homeId) {
      // avoid duplicate by checking id
      if (!mutual.find((x) => x.fixture?.id === m.fixture?.id)) mutual.push(m);
    }
  }
  // derive h2h factor: favor home if home historically better in mutual matches
  let h2h = 0;
  if (mutual.length > 0) {
    let homeWins = 0;
    let draws = 0;
    let awayWins = 0;
    for (const m of mutual) {
      const hid = m.teams?.home?.id;
      const aid = m.teams?.away?.id;
      const homeGoals = m.goals?.home ?? m.score?.fulltime?.home;
      const awayGoals = m.goals?.away ?? m.score?.fulltime?.away;
      if (homeGoals == null || awayGoals == null) continue;
      const result = homeGoals - awayGoals;
      if (result > 0) {
        if (hid === homeId) homeWins++; else awayWins++;
      } else if (result === 0) draws++;
      else {
        if (hid === homeId) awayWins++; else homeWins++;
      }
    }
    const total = homeWins + draws + awayWins || 1;
    // h2h positive favors home
    h2h = (homeWins - awayWins) / total; // range approx -1..1
  }

  // strengths: use ppg and goals for adjusted
  const baseHomeStrength = homeStats.ppg * 0.7 + homeStats.goalsFor * 0.3;
  const baseAwayStrength = awayStats.ppg * 0.7 + awayStats.goalsFor * 0.3;

  // apply home advantage (~+10%)
  const homeAdv = 1.10;
  let homeStrength = baseHomeStrength * homeAdv * (1 + (h2h * 0.05)); // small h2h influence
  let awayStrength = baseAwayStrength * (1 - (h2h * 0.05));

  // fallback if very low data
  if ((homeStats.matchesCount || 0) < 3) homeStrength = Math.max(homeStrength, 1.0);
  if ((awayStats.matchesCount || 0) < 3) awayStrength = Math.max(awayStrength, 1.0);

  // expected goals approximation (simple linear transform)
  const expectedGoalsHome = clamp((homeStrength / (homeStrength + awayStrength)) * 3, 0.2, 4);
  const expectedGoalsAway = clamp((awayStrength / (homeStrength + awayStrength)) * 3, 0.1, 4);

  // derive 1X2 probabilities heuristically
  let rawHomeProb = (homeStrength / (homeStrength + awayStrength));
  let rawAwayProb = (awayStrength / (homeStrength + awayStrength));
  // introduce draw probability baseline from expected goals closeness
  const goalDiffFactor = Math.exp(-Math.abs(expectedGoalsHome - expectedGoalsAway));
  let rawDrawProb = 0.15 + 0.35 * goalDiffFactor; // 0.15..0.5

  // adjust home/away to leave room for draw
  rawHomeProb = rawHomeProb * (1 - rawDrawProb);
  rawAwayProb = rawAwayProb * (1 - rawDrawProb);

  // small weighting with h2h
  rawHomeProb = rawHomeProb * (1 + (h2h * 0.12));
  rawAwayProb = rawAwayProb * (1 - (h2h * 0.12));

  // normalize
  let sum = rawHomeProb + rawDrawProb + rawAwayProb;
  let homeP = clamp(rawHomeProb / sum);
  let drawP = clamp(rawDrawProb / sum);
  let awayP = clamp(rawAwayProb / sum);

  // final normalize to sum 1
  const total = homeP + drawP + awayP;
  homeP /= total;
  drawP /= total;
  awayP /= total;

  // over/under 2.5 estimate from expected goals total
  const expTotal = expectedGoalsHome + expectedGoalsAway;
  // simple logistic transform for P(over 2.5)
  const overProb = clamp(1 / (1 + Math.exp(-1 * (expTotal - 2.5))), 0.05, 0.95);
  const underProb = 1 - overProb;

  const explanation = `Dự đoán dựa trên ${nMatches} trận gần nhất: home ppg=${homeStats.ppg.toFixed(2)}, away ppg=${awayStats.ppg.toFixed(2)}; h2h=${h2h.toFixed(2)}; expGoals ${expectedGoalsHome.toFixed(2)} - ${expectedGoalsAway.toFixed(2)}.`

  return {
    probabilities: {
      home: Number((homeP * 100).toFixed(2)),
      draw: Number((drawP * 100).toFixed(2)),
      away: Number((awayP * 100).toFixed(2)),
      over: Number((overProb * 100).toFixed(2)),
      under: Number((underProb * 100).toFixed(2)),
    },
    factors: {
      homeStrength: Number(homeStrength.toFixed(3)),
      awayStrength: Number(awayStrength.toFixed(3)),
      h2h: Number(h2h.toFixed(3)),
      expectedGoalsHome: Number(expectedGoalsHome.toFixed(3)),
      expectedGoalsAway: Number(expectedGoalsAway.toFixed(3)),
    },
    explanation,
  };
}