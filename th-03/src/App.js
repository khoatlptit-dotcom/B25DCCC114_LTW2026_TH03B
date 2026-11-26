import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { TEAMS, ROUNDS, RESULT_LABELS, formatDiff } from './data';
import {
  getTeamName,
  getResult,
  isValidGoals,
  calcStandings,
  calcMatchStats,
} from './utils';
import { matchesReducer } from './matchesReducer';
import { useFetch } from './hooks/useFetch';

const BUILD_TAG = "bd-5918";

const EMPTY_FORM = { round: '1', home: '', away: '', homeGoals: '', awayGoals: '' };
const GOALS_ERROR = 'Số bàn thắng phải là số nguyên từ 0 đến 20';

const parseGoals = (text) => (text.trim() === '' ? NaN : Number(text));

const App = () => {
  const { data, loading, error } = useFetch('/data/matches.json');
  const [matches, dispatch] = useReducer(matchesReducer, []);
  const [round, setRound] = useState('all');
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const homeRef = useRef(null);

  useEffect(() => {
    if (data) dispatch({ type: 'LOAD', payload: data });
  }, [data]);

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

  const handleField = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGoals = (match, field, e) => {
    const n = e.target.valueAsNumber;
    if (!isValidGoals(n)) return;
    dispatch({
      type: 'SET_GOALS',
      payload: {
        id: match.id,
        homeGoals: field === 'home' ? n : match.homeGoals,
        awayGoals: field === 'away' ? n : match.awayGoals,
      },
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = {};
    const home = form.home === '' ? null : Number(form.home);
    const away = form.away === '' ? null : Number(form.away);

    if (home === null) next.home = 'Hãy chọn đội nhà';
    if (away === null) {
      next.away = 'Hãy chọn đội khách';
    } else if (home !== null && home === away) {
      next.away = 'Hai đội phải khác nhau';
    } else if (
      home !== null &&
      matches.some(
        (m) => (m.home === home && m.away === away) || (m.home === away && m.away === home)
      )
    ) {
      next.away = 'Hai đội đã đá với nhau rồi';
    }

    const homeGoals = parseGoals(form.homeGoals);
    const awayGoals = parseGoals(form.awayGoals);
    if (!isValidGoals(homeGoals)) next.homeGoals = GOALS_ERROR;
    if (!isValidGoals(awayGoals)) next.awayGoals = GOALS_ERROR;

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    dispatch({
      type: 'ADD',
      payload: { round: Number(form.round), home, away, homeGoals, awayGoals },
    });
    setForm(EMPTY_FORM);
    homeRef.current.focus();
  };

  return (
    <div className="app" data-build={BUILD_TAG}>
      <h1>Giải bóng đá khoa</h1>

      {loading && <p>Đang tải lịch thi đấu...</p>}
      {error && <p>Không tải được lịch thi đấu</p>}

      {!loading && !error && (
        <>
          <section className="card">
            <h2>Bảng xếp hạng</h2>
            <table>
              <thead>
                <tr>
                  <th>Hạng</th>
                  <th>Đội</th>
                  <th>Trận</th>
                  <th>Thắng</th>
                  <th>Hòa</th>
                  <th>Thua</th>
                  <th>BT</th>
                  <th>BB</th>
                  <th>HS</th>
                  <th>Điểm</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row, index) => (
                  <tr
                    key={row.id}
                    style={index === standings.length - 1 ? { color: '#c62828' } : undefined}
                  >
                    <td>{index + 1}</td>
                    <td>{row.name}</td>
                    <td>{row.played}</td>
                    <td>{row.won}</td>
                    <td>{row.drawn}</td>
                    <td>{row.lost}</td>
                    <td>{row.gf}</td>
                    <td>{row.ga}</td>
                    <td>{formatDiff(row.diff)}</td>
                    <td>{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

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
                          <button
                            type="button"
                            onClick={() => dispatch({ type: 'REMOVE', payload: m.id })}
                          >
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

          <section className="card">
            <h2>Thêm trận đấu</h2>
            <form className="add-form" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="f-round">Vòng</label>{' '}
                <select id="f-round" name="round" value={form.round} onChange={handleField}>
                  {ROUNDS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="f-home">Đội nhà</label>{' '}
                <select
                  id="f-home"
                  name="home"
                  ref={homeRef}
                  value={form.home}
                  onChange={handleField}
                >
                  <option value="">-- Chọn đội --</option>
                  {TEAMS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {errors.home && <div role="alert">{errors.home}</div>}
              </div>

              <div>
                <label htmlFor="f-away">Đội khách</label>{' '}
                <select id="f-away" name="away" value={form.away} onChange={handleField}>
                  <option value="">-- Chọn đội --</option>
                  {TEAMS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {errors.away && <div role="alert">{errors.away}</div>}
              </div>

              <div>
                <label htmlFor="f-home-goals">Bàn thắng đội nhà</label>{' '}
                <input
                  id="f-home-goals"
                  name="homeGoals"
                  type="number"
                  value={form.homeGoals}
                  onChange={handleField}
                />
                {errors.homeGoals && <div role="alert">{errors.homeGoals}</div>}
              </div>

              <div>
                <label htmlFor="f-away-goals">Bàn thắng đội khách</label>{' '}
                <input
                  id="f-away-goals"
                  name="awayGoals"
                  type="number"
                  value={form.awayGoals}
                  onChange={handleField}
                />
                {errors.awayGoals && <div role="alert">{errors.awayGoals}</div>}
              </div>

              <button type="submit">Thêm trận</button>
            </form>
          </section>
        </>
      )}
    </div>
  );
};

export default App;