import React, { useState, useEffect, useRef } from 'react'
import './App.css'
import Leaderboard from './components/Leaderboard'
import ScoreSubmission from './components/ScoreSubmission'

interface PlayerState {
  isJumping: boolean
  isMoving: boolean
  position: { x: number; y: number }
  velocity: { x: number; y: number }
}

interface Obstacle {
  id: number
  type: 'shark' | 'bird'
  position: { x: number; y: number }
  speed: number
  hasBeenScored?: boolean
  isDead?: boolean
  swimPhase?: number // For shark swimming animation
}

function App() {
  // Calculate water height for 600px game height (20% of 600px = 120px)
  const getWaterHeight = () => {
    return 120
  }

  const [player, setPlayer] = useState<PlayerState>({
    isJumping: false,
    isMoving: true,
    position: { x: 0, y: getWaterHeight() },
    velocity: { x: 0, y: 0 }
  })

  const [obstacles, setObstacles] = useState<Obstacle[]>([])
  const [obstacleIdCounter, setObstacleIdCounter] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [waterHeight] = useState(getWaterHeight())
  const [timeRemaining, setTimeRemaining] = useState(180) // 3 minutes in seconds
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showScoreSubmission, setShowScoreSubmission] = useState(false)
  const [finalScore, setFinalScore] = useState(0)
  const [finalGameTime, setFinalGameTime] = useState(0)

  const gameRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const lastObstacleSpawn = useRef<number>(Date.now())
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  // Fixed size game - no resize handling needed

  // Handle jump
  const handleJump = () => {
    if (gameOver) {
      // Restart game
      setGameOver(false)
      setPlayer({
        isJumping: false,
        isMoving: true,
        position: { x: 0, y: waterHeight },
        velocity: { x: 0, y: 0 }
      })
      setObstacles([])
      setScore(0)
      setObstacleIdCounter(0)
      setTimeRemaining(180) // Reset timer to 3 minutes
      lastObstacleSpawn.current = Date.now()
      return
    }

    if (!player.isJumping) {
      setPlayer(prev => ({
        ...prev,
        isJumping: true,
        velocity: { ...prev.velocity, y: 15 } // Realistic initial jump velocity
      }))
    }
  }

  // Spawn obstacles
  const spawnObstacle = () => {
    const now = Date.now()
    
    // Random spawn interval between 1 to 5 seconds
    const randomInterval = 1000 + Math.random() * 4000 // 1000ms to 5000ms
    
    if (now - lastObstacleSpawn.current > randomInterval) {
      // Randomly choose between shark and bird
      const obstacleType = Math.random() < 0.7 ? 'shark' : 'bird'
      
      // Calculate spawn position
      let spawnY = waterHeight - 25 // Sharks swim deeper underwater
      if (obstacleType === 'bird') {
        // Birds fly at maximum jump height (approximately 100px above water)
        spawnY = waterHeight + 100
      }
      
      const newObstacle: Obstacle = {
        id: obstacleIdCounter,
        type: obstacleType,
        position: { x: 800 + 50, y: spawnY }, // Spawn off the right edge of 800px game
        speed: obstacleType === 'bird' ? 2 : 3, // Birds fly slightly slower than sharks
        swimPhase: obstacleType === 'shark' ? Math.random() * Math.PI * 2 : undefined // Random starting phase for shark swimming
      }
      
      console.log('Spawning obstacle:', {
        type: obstacleType,
        position: newObstacle.position,
        spawnY: spawnY,
        waterHeight: waterHeight
      })
      
      setObstacles(prev => [...prev, newObstacle])
      setObstacleIdCounter(prev => prev + 1)
      lastObstacleSpawn.current = now
    }
  }

  // Check collision between player and obstacles using rectangular collision detection
  const checkCollision = (playerPos: { x: number; y: number }, obstaclePos: { x: number; y: number }, obstacleType: string) => {
    // Rectangular collision detection for speedy boat - tighter fit
    const playerWidth = 60 // Reduced from 80 to match actual boat image
    const playerHeight = 30 // Reduced from 40 to match actual boat image
    const playerOffsetX = 10 // Center the collision box within the 80px container
    const playerOffsetY = 5 // Center the collision box within the 40px container
    
    // Different sizes for different obstacles
    const obstacleWidth = obstacleType === 'bird' ? 25 : 40 // Bird is smaller, shark is larger
    const obstacleHeight = obstacleType === 'bird' ? 20 : 35 // Bird is shorter, shark is taller and extends upward
    
    // Player bounding box
    const playerLeft = playerPos.x + playerOffsetX
    const playerRight = playerLeft + playerWidth
    const playerBottom = playerPos.y + playerOffsetY
    const playerTop = playerBottom + playerHeight
    
    // Obstacle bounding box
    const obstacleLeft = obstaclePos.x
    const obstacleRight = obstacleLeft + obstacleWidth
    const obstacleBottom = obstaclePos.y
    const obstacleTop = obstacleBottom + obstacleHeight
    
    // Check if bounding boxes intersect
    const horizontalOverlap = playerLeft < obstacleRight && playerRight > obstacleLeft
    const verticalOverlap = playerBottom < obstacleTop && playerTop > obstacleBottom
    
    return horizontalOverlap && verticalOverlap
  }

  // Update obstacles
  const updateObstacles = (currentPlayer: PlayerState) => {
    setObstacles(prev => 
      prev
        .map(obstacle => {
          let newPosition = {
            ...obstacle.position,
            x: obstacle.position.x - obstacle.speed
          }
          
          // Add realistic swimming motion for sharks
          if (obstacle.type === 'shark' && obstacle.swimPhase !== undefined) {
            // Update swim phase for continuous swimming motion
            const newSwimPhase = obstacle.swimPhase + 0.1
            const swimAmplitude = 8 // Vertical movement range
            const baseY = waterHeight - 25 // Base depth for sharks
            const verticalOffset = Math.sin(newSwimPhase) * swimAmplitude
            
            newPosition = {
              ...newPosition,
              y: baseY + verticalOffset
            }
          }
          
          // If bird is dead, make it fall down
          if (obstacle.type === 'bird' && obstacle.isDead) {
            newPosition = {
              ...newPosition,
              y: obstacle.position.y - obstacle.speed // Fall down (decrease Y since bottom positioning)
            }
          }
          
          // Check if player successfully jumped over the shark (scoring logic)
          if (obstacle.type === 'shark' && 
              !obstacle.hasBeenScored && 
              newPosition.x + 40 < currentPlayer.position.x + 80) {
            console.log('Player jumped over shark! Score +1', {
              obstacleId: obstacle.id,
              sharkX: newPosition.x,
              playerX: currentPlayer.position.x
            })
            setScore(prev => prev + 1)
            
            return {
              ...obstacle,
              position: newPosition,
              hasBeenScored: true // Mark as scored to prevent duplicate scoring
            }
          }
          
          return {
            ...obstacle,
            position: newPosition,
            swimPhase: obstacle.type === 'shark' && obstacle.swimPhase !== undefined ? 
              obstacle.swimPhase + 0.1 : obstacle.swimPhase
          }
        })
        .map(obstacle => {
          // Check collision using proper bounding box algorithm with current player state
          const isColliding = checkCollision(currentPlayer.position, obstacle.position, obstacle.type)
            if (isColliding) {
              if (obstacle.type === 'shark') {
                // Shark collision = game over
                console.log('SHARK COLLISION! Game Over!', {
                  playerPos: currentPlayer.position,
                  obstaclePos: obstacle.position,
                  playerY: currentPlayer.position.y,
                  obstacleY: obstacle.position.y,
                  isJumping: currentPlayer.isJumping
                })
                setGameOver(true)
                setFinalScore(score)
                setFinalGameTime(timeRemaining)
                setShowScoreSubmission(true)
                return obstacle // Keep the obstacle visible for debugging
            } else if (obstacle.type === 'bird' && !obstacle.isDead) {
              // Bird collision = increase score, bird dies, player lives
              console.log('BIRD COLLISION! Score +1, Bird dies!', {
                playerPos: currentPlayer.position,
                obstaclePos: obstacle.position,
                playerY: currentPlayer.position.y,
                obstacleY: obstacle.position.y,
                isJumping: currentPlayer.isJumping
              })
              setScore(prev => prev + 1) // Increase score
              
              // Mark bird as dead and make it fall
              return {
                ...obstacle,
                isDead: true,
                speed: 5 // Fall speed
              }
            }
          }
          return obstacle
        })
        .filter(obstacle => {
          
          // Check if obstacle is being destroyed (off screen)
          const shouldKeep = obstacle.position.x > -100
          if (!shouldKeep && obstacle.type === 'shark') {
            console.log('Shark destroyed!', {
              obstacleId: obstacle.id,
              position: obstacle.position.x,
              wasScored: obstacle.hasBeenScored
            })
          }
          
          return shouldKeep // Remove obstacles that are off screen
        })
    )
  }

  // Timer countdown
  useEffect(() => {
    if (gameOver || timeRemaining <= 0) return

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setGameOver(true)
          setFinalScore(score)
          setFinalGameTime(timeRemaining)
          setShowScoreSubmission(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [gameOver, timeRemaining, score])

  // Game loop
  useEffect(() => {
    const gameLoop = () => {
      if (gameOver) return

      setPlayer(prev => {
        let newY = prev.position.y + prev.velocity.y
        let newVelocityY = prev.velocity.y - 0.6 // Slower, more realistic gravity

        let currentPlayer: PlayerState

        // Ground collision
        if (newY <= waterHeight) {
          newY = waterHeight
          newVelocityY = 0
          currentPlayer = {
            ...prev,
            isJumping: false,
            position: { ...prev.position, y: newY },
            velocity: { ...prev.velocity, y: newVelocityY }
          }
        } else {
          currentPlayer = {
            ...prev,
            position: { ...prev.position, y: newY },
            velocity: { ...prev.velocity, y: newVelocityY }
          }
        }

        // Spawn and update obstacles with current player state
        spawnObstacle()
        updateObstacles(currentPlayer)

        return currentPlayer
      })

      animationRef.current = requestAnimationFrame(gameLoop)
    }

    if (!gameOver) {
      animationRef.current = requestAnimationFrame(gameLoop)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [obstacleIdCounter, gameOver])

  // Touch/click handlers
  const handleTouch = (e: React.TouchEvent) => {
    e.preventDefault()
    handleJump()
  }

  const handleClick = () => {
    handleJump()
  }

  return (
    <div className="App">
      <div className="game-container" ref={gameRef}>
        <div className="beach-background">
          <div className="water"></div>
          <div className="sky">
            <div className="sun"></div>
            <div className="cloud cloud1"></div>
            <div className="cloud cloud2"></div>
            <div className="cloud cloud3"></div>
            <div className="sky-bird sky-bird1">🐦</div>
            <div className="sky-bird sky-bird2">🕊️</div>
            <div className="sky-bird sky-bird3">🐦</div>
          </div>
        </div>
        
        <div className="player-container">
          <div 
            className={`player ${player.isJumping ? 'jumping' : ''} ${player.isMoving ? 'moving' : ''}`}
            style={{
              left: `${player.position.x}px`,
              bottom: `${player.position.y}px`
            }}
          >
            <div className="bike"></div>
          </div>
        </div>

        {/* Obstacles */}
        {obstacles.map(obstacle => (
          <div
            key={obstacle.id}
            className={`obstacle ${obstacle.type} ${obstacle.isDead ? 'dead' : ''}`}
            style={{
              position: 'absolute',
              left: `${obstacle.position.x}px`,
              bottom: `${obstacle.position.y}px`,
              width: obstacle.type === 'bird' ? '25px' : '40px',
              height: obstacle.type === 'bird' ? '20px' : '30px',
              pointerEvents: 'none'
            }}
          >
            {obstacle.type === 'shark' && (
              <div className="shark-obstacle">
                <div className="shark-body"></div>
                <div className="shark-tail"></div>
                <div className="shark-fin"></div>
                <div className="shark-eye"></div>
              </div>
            )}
            {obstacle.type === 'bird' && (
              <div className="bird-obstacle">
                {obstacle.isDead ? '💀' : '🐦'}
              </div>
            )}
          </div>
        ))}


        <div className="instructions">
          <p>Touch the screen to jump!</p>
          <button 
            onClick={() => setShowLeaderboard(true)}
            className="leaderboard-button"
          >
            🏆 Leaderboard
          </button>
        </div>

        {/* Timer Display */}
        {!gameOver && (
          <div className="timer-display">
            <div className="timer-text">
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameOver && (
          <div 
            className="game-over-screen"
            onTouchStart={handleTouch}
            onClick={handleClick}
          >
            <div className="game-over-content">
              <h1>Game Over</h1>
              <p>Score: {score}</p>
              <p>Touch the screen to restart</p>
            </div>
          </div>
        )}

        {/* Score Display */}
        {!gameOver && (
          <div className="score-display">
            <h1>Score: {score}</h1>
          </div>
        )}
      </div>
      
      <div 
        className="jump-area"
        onTouchStart={handleTouch}
        onClick={handleClick}
      ></div>

      {/* Leaderboard Modal */}
      <Leaderboard 
        isVisible={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />

      {/* Score Submission Modal */}
      <ScoreSubmission
        isVisible={showScoreSubmission}
        score={finalScore}
        gameTime={finalGameTime}
        onSubmit={() => {
          setShowScoreSubmission(false)
          setShowLeaderboard(true)
        }}
        onCancel={() => setShowScoreSubmission(false)}
      />
    </div>
  )
}

export default App
