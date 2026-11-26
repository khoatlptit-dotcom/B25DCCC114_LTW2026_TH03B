import { memo, useRef } from 'react';
import { RESULT_LABELS } from '../data';
import { getResult, getTeamName } from '../utils';

const MatchRow = ({ match, onGoals, onRemove }) => {
  const renderCount = useRef(0);
  renderCount.current += 1;

  const result = getResult(match);
  const homeName = getTeamName(match.home);
  const awayName = getTeamName(match.away);

  return (
    <tr style={result === 'draw' ? { background: 'rgba(255, 193, 7, 0.25)' } : undefined}>
      <td>{match.round}</td>
      <td>{homeName}</td>
      <td>
        <input
          type="number"
          min="0"
          max="20"
          aria-label={`Bàn thắng nhà ${homeName} - ${awayName}`}
          value={match.homeGoals}
          onChange={(e) => onGoals(match, 'home', e.target.valueAsNumber)}
        />
      </td>
      <td>
        <input
          type="number"
          min="0"
          max="20"
          aria-label={`Bàn thắng khách ${homeName} - ${awayName}`}
          value={match.awayGoals}
          onChange={(e) => onGoals(match, 'away', e.target.valueAsNumber)}
        />
      </td>
      <td>{awayName}</td>
      <td>{RESULT_LABELS[result]}</td>
      <td>{renderCount.current}</td>
      <td>
        <button type="button" onClick={() => onRemove(match)}>
          Xóa
        </button>
      </td>
    </tr>
  );
};

export default memo(MatchRow);