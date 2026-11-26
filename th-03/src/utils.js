import { TEAMS, POINTS, MAX_GOALS } from './data';

export const getTeamName = (id) => {
  const team = TEAMS.find((t) => t.id === id);
  return team ? team.name : '';
};

export const getResult = ({ homeGoals, awayGoals }) => {
  if (homeGoals > awayGoals) return 'home';
  if (homeGoals < awayGoals) return 'away';
  return 'draw';
};

export const isValidGoals = (n) =>
  Number.isInteger(n) && n >= 0 && n <= MAX_GOALS;

export const calcStandings = (matches) => {
  const table = TEAMS.map((t) => ({
    id: t.id,
    name: t.name,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    diff: 0,
    points: 0,
  }));
  const byId = {};
  table.forEach((row) => {
    byId[row.id] = row;
  });

  const apply = (row, gf, ga) => {
    row.played += 1;
    row.gf += gf;
    row.ga += ga;
    if (gf > ga) {
      row.won += 1;
      row.points += POINTS.win;
    } else if (gf === ga) {
      row.drawn += 1;
      row.points += POINTS.draw;
    } else {
      row.lost += 1;
      row.points += POINTS.loss;
    }
  };

  matches.forEach((m) => {
    const home = byId[m.home];
    const away = byId[m.away];
    if (!home || !away) return;
    apply(home, m.homeGoals, m.awayGoals);
    apply(away, m.awayGoals, m.homeGoals);
  });

  table.forEach((row) => {
    row.diff = row.gf - row.ga;
  });

  return [...table].sort(
    (a, b) =>
      b.points - a.points ||
      b.diff - a.diff ||
      b.gf - a.gf ||
      a.name.localeCompare(b.name, 'vi')
  );
};

export const calcMatchStats = (matches) => {
  const counts = { home: 0, draw: 0, away: 0 };
  let goals = 0;
  matches.forEach((m) => {
    goals += m.homeGoals + m.awayGoals;
    counts[getResult(m)] += 1;
  });
  const count = matches.length;
  const average = count === 0 ? 0 : Math.round((goals / count) * 100) / 100;
  return { count, goals, average, counts };
};

const GOAL_INVALID = 'Hãy chọn đội, nhập số điểm mục tiêu (từ 0) và số trận còn lại (từ 1)';

const toNumber = (text) => (String(text).trim() === '' ? NaN : Number(text));

export const calcNeeded = (standings, teamId, target, remaining) => {
  const row = standings.find((r) => r.id === Number(teamId));
  const goal = toNumber(target);
  const left = toNumber(remaining);

  if (!row || !Number.isInteger(goal) || goal < 0 || !Number.isInteger(left) || left < 1) {
    return GOAL_INVALID;
  }

  const need = goal - row.points;
  if (need <= 0) return 'Đội đã đạt mục tiêu';
  if (need > 3 * left) return 'Không thể đạt mục tiêu này';

  const wins = Math.max(0, Math.ceil((need - left) / 2));
  return `Cần thêm ${need} điểm ở ${left} trận còn lại, tối thiểu ${wins} trận thắng`;
};