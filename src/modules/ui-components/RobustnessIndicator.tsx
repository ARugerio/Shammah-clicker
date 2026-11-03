import type { RobustnessScore } from '../letter-engine/types'

interface RobustnessIndicatorProps {
  score: RobustnessScore
}

export function RobustnessIndicator({ score }: RobustnessIndicatorProps) {
  const getColor = () => {
    if (score.classification === 'excelente') return '#00b84d'
    if (score.classification === 'buena') return '#ffa500'
    return '#ff0000'
  }

  return (
    <div className="robustness-indicator">
      <label>📊 Robustez: </label>
      <div className="progress-bar" style={{ width: '100%', height: 20, background: '#eee', borderRadius: 10 }}>
        <div
          style={{
            width: `${score.score}%`,
            height: '100%',
            background: getColor(),
            borderRadius: 10,
            transition: 'width 0.3s',
          }}
        />
      </div>
      <span>{score.score}/100 ({score.classification})</span>
      {score.issues.length > 0 && (
        <ul className="issues">
          {score.issues.map((issue, i) => (
            <li key={i}>⚠️ {issue}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
