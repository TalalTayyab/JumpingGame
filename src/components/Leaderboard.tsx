import React, { useState, useEffect } from 'react'
import { getLeaderboard, LeaderboardEntry } from '../lib/supabase'
import './Leaderboard.css'

interface LeaderboardProps {
  isVisible: boolean
  onClose: () => void
}

const Leaderboard: React.FC<LeaderboardProps> = ({ isVisible, onClose }) => {
  const [scores, setScores] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isVisible) {
      fetchLeaderboard()
    }
  }, [isVisible])

  const fetchLeaderboard = async () => {
    setLoading(true)
    setError(null)
    try {
      const leaderboardData = await getLeaderboard(10)
      setScores(leaderboardData)
    } catch (err) {
      setError('Failed to load leaderboard')
      console.error('Leaderboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (!isVisible) return null

  return (
    <div className="leaderboard-overlay">
      <div className="leaderboard-modal">
        <div className="leaderboard-header">
          <h2>🏆 Leaderboard</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="leaderboard-content">
          {loading && (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading leaderboard...</p>
            </div>
          )}
          
          {error && (
            <div className="error">
              <p>{error}</p>
              <button onClick={fetchLeaderboard} className="retry-button">
                Try Again
              </button>
            </div>
          )}
          
          {!loading && !error && scores.length === 0 && (
            <div className="no-scores">
              <p>No scores yet! Be the first to play!</p>
            </div>
          )}
          
          {!loading && !error && scores.length > 0 && (
            <div className="scores-list">
              {scores.map((entry, index) => (
                <div key={entry.id} className={`score-entry ${index < 3 ? `rank-${index + 1}` : ''}`}>
                  <div className="rank">
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && `#${index + 1}`}
                  </div>
                  <div className="player-info">
                    <div className="player-name">{entry.player_name}</div>
                    <div className="game-time">Time: {formatTime(entry.game_time)}</div>
                    <div className="date">{formatDate(entry.created_at)}</div>
                  </div>
                  <div className="score">{entry.score}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="leaderboard-footer">
          <button onClick={fetchLeaderboard} className="refresh-button">
            🔄 Refresh
          </button>
        </div>
      </div>
    </div>
  )
}

export default Leaderboard
