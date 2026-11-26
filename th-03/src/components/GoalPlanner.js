import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TEAMS } from '../data';
import { calcNeeded } from '../utils';
import { selectGoal, setTeamId, setTarget, setRemaining } from '../features/goalSlice';

const GoalPlanner = ({ standings }) => {
  const dispatch = useDispatch();
  const { teamId, target, remaining } = useSelector(selectGoal);

  const message = useMemo(
    () => calcNeeded(standings, teamId, target, remaining),
    [standings, teamId, target, remaining]
  );

  return (
    <section className="card">
      <h2>Mục tiêu điểm</h2>
      <div className="goal-grid">
        <div>
          <label htmlFor="g-team">Đội của bạn</label>
          <select id="g-team" value={teamId} onChange={(e) => dispatch(setTeamId(e.target.value))}>
            {TEAMS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="g-target">Số điểm mục tiêu</label>
          <input
            id="g-target"
            type="number"
            min="0"
            value={target}
            onChange={(e) => dispatch(setTarget(e.target.value))}
          />
        </div>
        <div>
          <label htmlFor="g-remaining">Số trận còn lại</label>
          <input
            id="g-remaining"
            type="number"
            min="1"
            value={remaining}
            onChange={(e) => dispatch(setRemaining(e.target.value))}
          />
        </div>
      </div>
      <p className="goal-result">{message}</p>
    </section>
  );
};

export default GoalPlanner;