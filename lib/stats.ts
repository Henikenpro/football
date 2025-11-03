// lib/stats.ts
export type MappedStats = {
  possession?: { home?: number; away?: number };
  shotsOnGoal?: { home?: number; away?: number };
  shotsOffGoal?: { home?: number; away?: number };
  totalShots?: { home?: number; away?: number };
  blockedShots?: { home?: number; away?: number };
  shotsInsideBox?: { home?: number; away?: number };
  shotsOutsideBox?: { home?: number; away?: number };
  fouls?: { home?: number; away?: number };
  corners?: { home?: number; away?: number };
  offsides?: { home?: number; away?: number };
  goalkeeperSaves?: { home?: number; away?: number };
  yellowCards?: { home?: number; away?: number };
  redCards?: { home?: number; away?: number };
};

function parseValue(v: any): number | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'number') return v;
  const num = parseInt(v.toString().replace('%', ''), 10);
  return isNaN(num) ? undefined : num;
}

/**
 * Map API-Football statistics response (array) into MappedStats
 * API response typical shape: [{ team: { id, name }, statistics: [{type: 'Shots on Goal', value: '5'} ... ] }, ...]
 */
export function mapStatistics(apiResponse: any): MappedStats {
  if (!apiResponse) return {};

  // apiResponse might be { response: [ { team: {...}, statistics: [...] }, ... ] } or already the array
  const arr = Array.isArray(apiResponse) ? apiResponse : (apiResponse.response ?? apiResponse);

  if (!Array.isArray(arr)) return {};

  const result: MappedStats = {};

  // helper to set stat
  const setStat = (key: keyof MappedStats, teamSide: 'home' | 'away', value: any) => {
    if (!result[key]) result[key] = {};
    (result[key] as any)[teamSide] = parseValue(value);
  };

  // Determine which entry is home vs away by team.id matching not known here.
  // For mapping we will keep order: [0] => home, [1] => away if no other info.
  for (let i = 0; i < arr.length; i++) {
    const entry = arr[i];
    const side: 'home' | 'away' = i === 0 ? 'home' : 'away';
    const stats = entry.statistics || entry?.statistics || entry?.stats || [];

    for (const s of stats) {
      const type = (s.type || s.key || '').toString().toLowerCase();
      const valueRaw = s.value ?? s.value_home ?? s.value_away ?? s?.value;
      if (type.includes('possession')) {
        setStat('possession', side, valueRaw);
      } else if (type.includes('shots on goal') || type.includes('shots on target')) {
        setStat('shotsOnGoal', side, valueRaw);
      } else if (type.includes('shots off goal') || type.includes('shots off target')) {
        setStat('shotsOffGoal', side, valueRaw);
      } else if (type.includes('total shots') || type.includes('shots')) {
        setStat('totalShots', side, valueRaw);
      } else if (type.includes('blocked')) {
        setStat('blockedShots', side, valueRaw);
      } else if (type.includes('inside')) {
        setStat('shotsInsideBox', side, valueRaw);
      } else if (type.includes('outside')) {
        setStat('shotsOutsideBox', side, valueRaw);
      } else if (type.includes('fouls')) {
        setStat('fouls', side, valueRaw);
      } else if (type.includes('corners')) {
        setStat('corners', side, valueRaw);
      } else if (type.includes('offsides')) {
        setStat('offsides', side, valueRaw);
      } else if (type.includes('saves') || type.includes('goalkeeper saves')) {
        setStat('goalkeeperSaves', side, valueRaw);
      } else if (type.includes('yellow')) {
        setStat('yellowCards', side, valueRaw);
      } else if (type.includes('red')) {
        setStat('redCards', side, valueRaw);
      }
    }
  }

  return result;
}