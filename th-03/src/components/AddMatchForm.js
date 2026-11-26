import { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TEAMS, ROUNDS } from '../data';
import { getTeamName, isValidGoals } from '../utils';
import { addMatch, selectMatches } from '../features/matchesSlice';
import { useNotice } from '../context/NoticeContext';

const EMPTY_FORM = { round: '1', home: '', away: '', homeGoals: '', awayGoals: '' };
const GOALS_ERROR = 'Số bàn thắng phải là số nguyên từ 0 đến 20';

const parseGoals = (text) => (text.trim() === '' ? NaN : Number(text));

const AddMatchForm = () => {
  const matches = useSelector(selectMatches);
  const dispatch = useDispatch();
  const showNotice = useNotice();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const homeRef = useRef(null);

  const handleField = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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

    dispatch(addMatch({ round: Number(form.round), home, away, homeGoals, awayGoals }));
    showNotice(`Đã thêm trận ${getTeamName(home)} - ${getTeamName(away)}`);
    setForm(EMPTY_FORM);
    homeRef.current.focus();
  };

  return (
    <section className="card">
      <h2>Thêm trận đấu</h2>
      <form className="add-form" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="f-round">Vòng</label>
          <select id="f-round" name="round" value={form.round} onChange={handleField}>
            {ROUNDS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="f-home">Đội nhà</label>
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
          <label htmlFor="f-away">Đội khách</label>
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
          <label htmlFor="f-home-goals">Bàn thắng đội nhà</label>
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
          <label htmlFor="f-away-goals">Bàn thắng đội khách</label>
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
  );
};

export default AddMatchForm;