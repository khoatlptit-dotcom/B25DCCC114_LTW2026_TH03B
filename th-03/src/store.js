import { configureStore } from '@reduxjs/toolkit';
import matchesReducer from './features/matchesSlice';
import goalReducer from './features/goalSlice';
import { loadSaved, saveMatches } from './storage';

const saved = loadSaved();

// Đã có dữ liệu lưu từ lần trước chưa (chỉ khi chưa có thì App mới nạp dữ liệu mẫu)
export const hasSaved = saved !== null;

export const store = configureStore({
  reducer: {
    matches: matchesReducer,
    goal: goalReducer,
  },
  preloadedState: { matches: saved ?? [] },
});

// Chỉ lưu khi mảng trận đấu đổi tham chiếu
let previousMatches = store.getState().matches;
store.subscribe(() => {
  const currentMatches = store.getState().matches;
  if (currentMatches !== previousMatches) {
    previousMatches = currentMatches;
    saveMatches(currentMatches);
  }
});