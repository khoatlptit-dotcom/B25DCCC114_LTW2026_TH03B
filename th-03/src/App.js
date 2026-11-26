import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ROUNDS, RESULT_LABELS } from './data';
import { getTeamName, isValidGoals, calcStandings, calcMatchStats } from './utils';
import { useFetch } from './hooks/useFetch';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useDebounce } from './hooks/useDebounce';
import { useTheme } from './context/ThemeContext';
import { useNotice } from './context/NoticeContext';
import { selectMatches, setMatches, removeMatch, setGoals } from './features/matchesSlice';
import { hasSaved } from './store';
import StandingsTable from './components/StandingsTable';
import MatchRow from './components/MatchRow';
import AddMatchForm from './components/AddMatchForm';
import GoalPlanner from './components/GoalPlanner';

const BUILD_TAG = "bd-5918";

const SITE_TITLE = 'Giải bóng đá khoa';
const ROUND_VALUES = ['all', ...ROUNDS.map(String)];

const App = () => {
  const { data, loading, error } = useFetch('/data/matches.json');
  const matches = useSelector(selectMatches);
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useTheme();
  const showNotice = useNotice();
  const [storedRound, setRound] = useLocalStorage('ltw_bongda_round', 'all');
  const round = ROUND_VALUES.includes(storedRound) ? storedRound : 'all';
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const searchRef = useRef(null);

  // Chỉ nạp dữ liệu mẫu khi chưa có dữ liệu lưu
  useEffect(() => {
    if (data && !hasSaved) dispatch(setMatches(data));
  }, [data, dispatch]);

  // Phím tắt: "/" nhảy vào ô tìm kiếm, Esc xóa nội dung tìm kiếm
  useEffect(() => {
    const handleKey = (e) => {
      const target = e.target;
      if (e.key === '/') {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const tag = target && target.tagName;
        const typing =
          tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || (target && target.isContentEditable);
        if (typing) return;
        e.preventDefault();
        if (searchRef.current) searchRef.current.focus();
      } else if (e.key === 'Escape' && target === searchRef.current) {
        setSearch('');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const standings = useMemo(() => calcStandings(matches), [matches]);

  const roundMatches = useMemo(
    () => (round === 'all' ? matches : matches.filter((m) => m.round === Number(round))),
    [matches, round]
  );

  const keyword = debouncedSearch.trim().toLowerCase();
  const visible = useMemo(() => {
    if (keyword === '') return roundMatches;
    return roundMatches.filter(
      (m) =>
        getTeamName(m.home).toLowerCase().includes(keyword) ||
        getTeamName(m.away).toLowerCase().includes(keyword)
    );
  }, [roundMatches, keyword]);

  // Thống kê chỉ phụ thuộc ô lọc vòng, không phụ thuộc ô tìm kiếm
  const stats = useMemo(() => calcMatchStats(roundMatches), [roundMatches]);

  const leaderName = matches.length > 0 ? standings[0].name : null;
  const leaderText = leaderName ? `${leaderName} (${standings[0].points} điểm)` : '—';

  useEffect(() => {
    document.title = leaderName ? `${leaderName} dẫn đầu – ${SITE_TITLE}` : SITE_TITLE;
  }, [leaderName]);

  const handleTeamShift = (e) => {
    setSearch(e.target.value);
  };

  const handleGoals = useCallback(
    (match, field, n) => {
      if (!isValidGoals(n)) return;
      dispatch(
        setGoals({
          id: match.id,
          homeGoals: field === 'home' ? n : match.homeGoals,
          awayGoals: field === 'away' ? n : match.awayGoals,
        })
      );
    },
    [dispatch]
  );

  const handleRemove = useCallback(
    (match) => {
      dispatch(removeMatch(match.id));
      showNotice(`Đã xóa trận ${getTeamName(match.home)} - ${getTeamName(match.away)}`);
    },
    [dispatch, showNotice]
  );

  const handleReset = () => {
    if (!data) return;
    dispatch(setMatches(data));
    showNotice('Đã đặt lại dữ liệu mẫu');
  };

  const ready = hasSaved || (!loading && !error);

  return (
    <div className={`app ${theme}`} data-build={BUILD_TAG}>
      <h1>Giải bóng đá khoa</h1>
      <button type="button" className="theme-toggle" onClick={toggleTheme}>
        {theme === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}
      </button>

      {!hasSaved && loading && <p>Đang tải lịch thi đấu...</p>}
      {!hasSaved && error && <p>Không tải được lịch thi đấu</p>}

      {ready && (
        <>
          <StandingsTable standings={standings} />

          <section className="card stats">
            <h2>Thống kê</h2>
            <div className="stats-grid">
              <p>{`Số trận: ${stats.count}`}</p>
              <p>{`Tổng số bàn thắng: ${stats.goals}`}</p>
              <p>{`Bàn thắng mỗi trận: ${stats.average.toFixed(2)}`}</p>
              <p>{`Đội dẫn đầu: ${leaderText}`}</p>
            </div>
            <h3>Phân bố kết quả</h3>
            <ul className="distribution">
              {Object.keys(RESULT_LABELS).map((key) => (
                <li key={key}>
                  {`${RESULT_LABELS[key]}: ${stats.counts[key]}`}
                  <span
                    style={{
                      display: 'inline-block',
                      height: '10px',
                      width: `${24 * stats.counts[key]}px`,
                      background: '#1976d2',
                      marginLeft: '8px',
                      verticalAlign: 'middle',
                    }}
                  />
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <h2>Lịch thi đấu</h2>
            <div className="toolbar">
              <div>
                <label htmlFor="round-filter">Xem vòng</label>
                <select id="round-filter" value={round} onChange={(e) => setRound(e.target.value)}>
                  <option value="all">Tất cả</option>
                  {ROUNDS.map((r) => (
                    <option key={r} value={r}>{`Vòng ${r}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="team-search">Tìm đội</label>
                <input
                  id="team-search"
                  type="text"
                  ref={searchRef}
                  value={search}
                  onChange={handleTeamShift}
                />
              </div>
            </div>
            <p>{`Tìm thấy ${visible.length} trận`}</p>

            {visible.length === 0 ? (
              <p>Chưa có trận đấu nào</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Vòng</th>
                    <th>Đội nhà</th>
                    <th>BT nhà</th>
                    <th>BT khách</th>
                    <th>Đội khách</th>
                    <th>Kết quả</th>
                    <th>Số lần render</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((m) => (
                    <MatchRow key={m.id} match={m} onGoals={handleGoals} onRemove={handleRemove} />
                  ))}
                </tbody>
              </table>
            )}

            <button type="button" className="reset-button" onClick={handleReset} disabled={!data}>
              Đặt lại dữ liệu mẫu
            </button>
          </section>

          <AddMatchForm />

          <GoalPlanner standings={standings} />
        </>
      )}
    </div>
  );
};

export default App;