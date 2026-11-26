const MATCHES_KEY = 'ltw_bongda_matches';
const FIELDS = ['id', 'round', 'home', 'away', 'homeGoals', 'awayGoals'];

const isMatch = (m) =>
  m !== null && typeof m === 'object' && FIELDS.every((field) => Number.isFinite(m[field]));

// Trả mảng trận đã lưu, hoặc null nếu chưa có / dữ liệu hỏng
export const loadSaved = () => {
  try {
    const raw = window.localStorage.getItem(MATCHES_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.every(isMatch) ? parsed : null;
  } catch (err) {
    return null;
  }
};

export const saveMatches = (matches) => {
  try {
    window.localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
  } catch (err) {
    // Bỏ qua: localStorage bị chặn hoặc đầy
  }
};