import React, { useState } from 'react'
import { saveScore } from '../lib/supabase'
import './ScoreSubmission.css'

interface ScoreSubmissionProps {
  isVisible: boolean
  score: number
  gameTime: number
  onSubmit: () => void
  onCancel: () => void
}

const ScoreSubmission: React.FC<ScoreSubmissionProps> = ({ 
  isVisible, 
  score, 
  gameTime, 
  onSubmit, 
  onCancel 
}) => {
  const [playerName, setPlayerName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!playerName.trim()) {
      setError('Please enter your name')
      return
    }

    if (playerName.length > 20) {
      setError('Name must be 20 characters or less')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await saveScore(playerName.trim(), score, gameTime)
      onSubmit()
    } catch (err) {
      setError('Failed to save score. Please try again.')
      console.error('Score submission error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isVisible) return null

  return (
    <div className="score-submission-overlay">
      <div className="score-submission-modal">
        <div className="score-submission-header">
          <h2>🎉 Game Over!</h2>
          <p>Submit your score to the leaderboard</p>
        </div>
        
        <div className="score-submission-content">
          <div className="score-display">
            <div className="score-item">
              <span className="label">Score:</span>
              <span className="value">{score}</span>
            </div>
            <div className="score-item">
              <span className="label">Time Remaining:</span>
              <span className="value">{formatTime(gameTime)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="score-form">
            <div className="input-group">
              <label htmlFor="playerName">Your Name:</label>
              <input
                id="playerName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                disabled={isSubmitting}
                className={error ? 'error' : ''}
              />
              {error && <div className="error-message">{error}</div>}
            </div>

            <div className="button-group">
              <button
                type="button"
                onClick={onCancel}
                className="cancel-button"
                disabled={isSubmitting}
              >
                Skip
              </button>
              <button
                type="submit"
                className="submit-button"
                disabled={isSubmitting || !playerName.trim()}
              >
                {isSubmitting ? 'Saving...' : 'Submit Score'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ScoreSubmission
