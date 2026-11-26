import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ROUNDS, RESULT_LABELS } from './data';
import {
  getTeamName,
  getResult,
  isValidGoals,
  calcStandings,
  calcMatchStats,
} from './utils';
import { useFetch } from './hooks/useFetch';
import { useTheme } from './context/ThemeContext';
import { useNotice } from './context/NoticeContext';
import { selectMatches, setMatches, removeMatch, setGoals } from './features/matchesSlice';
import StandingsTable from './components/StandingsTable';
import AddMatchForm from './components/AddMatchForm';
import GoalPlanner from './components/GoalPlanner';

const BUILD_TAG = "bd-5918";

const App = () => {
  const { data, loading, error } = useFetch('/data/matches.json');
  const matches = useSelector(selectMatches);
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useTheme();
  const showNotice = useNotice();
  const [round, setRound] = useState('all');

  useEffect(() => {
    if (data) dispatch(setMatches(data));
  }, [data, dispatch]);

  const standings = useMemo(() => calcStandings(matches), [matches]);

  const visible = useMemo(
    () => (round === 'all' ? matches : matches.filter((m) => m.round === Number(round))),
    [matches, round]
  );

  const stats = useMemo(() => calcMatchStats(visible), [visible]);

  const leaderText = useMemo(() => {
    if (matches.length === 0) return '—';
    return `${standings[0].name} (${standings[0].points} điểm)`;
  }, [matches, standings]);

  const handleGoals = (match, field, e) => {
    const n = e.target.valueAsNumber;
    if (!isValidGoals(n)) return;
    dispatch(
      setGoals({
        id: match.id,
        homeGoals: field === 'home' ? n : match.homeGoals,
        awayGoals: field === 'away' ? n : match.awayGoals,
      })
    );
  };

  const handleRemove = (match) => {
    dispatch(removeMatch(match.id));
    showNotice(`Đã xóa trận ${getTeamName(match.home)} - ${getTeamName(match.away)}`);
  };

  return (
    <div className={`app ${theme}`} data-build={BUILD_TAG}>
      <h1>Giải bóng đá khoa</h1>
      <button type="button" className="theme-toggle" onClick={toggleTheme}>
        {theme === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}
      </button>

      {loading && <p>Đang tải lịch thi đấu...</p>}
      {error && <p>Không tải được lịch thi đấu</p>}

      {!loading && !error && (
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
          </section>

          <section className="card">
            <h2>Lịch thi đấu</h2>
            <label htmlFor="round-filter">Xem vòng</label>{' '}
            <select id="round-filter" value={round} onChange={(e) => setRound(e.target.value)}>
              <option value="all">Tất cả</option>
              {ROUNDS.map((r) => (
                <option key={r} value={r}>{`Vòng ${r}`}</option>
              ))}
            </select>

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
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((m) => {
                    const result = getResult(m);
                    const homeName = getTeamName(m.home);
                    const awayName = getTeamName(m.away);
                    return (
                      <tr
                        key={m.id}
                        style={
                          result === 'draw'
                            ? { background: 'rgba(255, 193, 7, 0.25)' }
                            : undefined
                        }
                      >
                        <td>{m.round}</td>
                        <td>{homeName}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            aria-label={`Bàn thắng nhà ${homeName} - ${awayName}`}
                            value={m.homeGoals}
                            onChange={(e) => handleGoals(m, 'home', e)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            aria-label={`Bàn thắng khách ${homeName} - ${awayName}`}
                            value={m.awayGoals}
                            onChange={(e) => handleGoals(m, 'away', e)}
                          />
                        </td>
                        <td>{awayName}</td>
                        <td>{RESULT_LABELS[result]}</td>
                        <td>
                          <button type="button" onClick={() => handleRemove(m)}>
                            Xóa
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>

          <AddMatchForm />

          <GoalPlanner standings={standings} />
        </>
      )}
    </div>
  );
};

export default App;