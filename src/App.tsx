import { useState, useEffect, useRef } from 'react'
import './App.css'

interface Timer {
  id: string
  name: string
  duration: number // in seconds
}

function App() {
  const [view, setView] = useState<'settings' | 'timer'>('timer')
  const [timers, setTimers] = useState<Timer[]>([
    { id: '1', name: 'Round 1', duration: 20 * 60 }
  ])
  const [isInitialized, setIsInitialized] = useState(false)
  
  const [currentTimerIndex, setCurrentTimerIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(timers[0]?.duration || 20 * 60)
  const [isRunning, setIsRunning] = useState(false)
  
  // Secondary timer state
  const [secondaryTimeLeft, setSecondaryTimeLeft] = useState(30)
  const [isSecondaryRunning, setIsSecondaryRunning] = useState(false)
  
  // New timer form state
  const [newTimerName, setNewTimerName] = useState('')
  const [newTimerMinutes, setNewTimerMinutes] = useState('1')

  // Refs to prevent chime from playing multiple times
  const lastChimeTimeRef = useRef(0)
  const lastSecondaryChimeTimeRef = useRef(0)
  const lastChimeTimerIndexRef = useRef(-1)

  // Play chime sound at timer end
  const playTimerChime = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const now = audioContext.currentTime
      const frequency = 1000
      const volume = 0.5

      // Create oscillator and gain
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = frequency
      gainNode.gain.setValueAtTime(volume, now)

      // Three short beeps
      for (let i = 0; i < 3; i++) {
        const beepStart = now + i * 0.55
        gainNode.gain.setValueAtTime(volume, beepStart)
        gainNode.gain.setValueAtTime(0, beepStart + 0.2)
      }

      // One long beep
      const longBeepStart = now + 3 * 0.55
      gainNode.gain.setValueAtTime(volume, longBeepStart)
      gainNode.gain.setValueAtTime(0, longBeepStart + 0.7)

      oscillator.start(now)
      oscillator.stop(longBeepStart + 0.6)
    } catch (error) {
      console.error('Failed to play timer chime:', error)
    }
  }

  // Load timers from localStorage on mount
  useEffect(() => {
    const storedTimers = localStorage.getItem('poker-clock-timers')
    if (storedTimers) {
      try {
        const parsedTimers = JSON.parse(storedTimers)
        setTimers(parsedTimers)
        setTimeLeft(parsedTimers[0]?.duration || 20 * 60)
      } catch (error) {
        console.error('Failed to load timers from storage:', error)
      }
    }
    setIsInitialized(true)
  }, [])

  // Save timers to localStorage whenever they change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('poker-clock-timers', JSON.stringify(timers))
    }
  }, [timers, isInitialized])

  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Move to next timer
            if (currentTimerIndex < timers.length - 1) {
              setCurrentTimerIndex(currentTimerIndex + 1)
              return timers[currentTimerIndex + 1].duration
            } else {
              // All timers complete
              setIsRunning(false)
              return 0
            }
          }
          return prev - 1
        })
      }, 1000)
    }
    
    return () => clearInterval(interval)
  }, [isRunning, timeLeft, currentTimerIndex, timers])

  // Play chime when timer ends and transitions to next
  useEffect(() => {
    if (isInitialized && currentTimerIndex > lastChimeTimerIndexRef.current) {
      const now = Date.now()
      if (now - lastChimeTimeRef.current > 500) {
        lastChimeTimeRef.current = now
        lastChimeTimerIndexRef.current = currentTimerIndex
        playTimerChime()
      }
    }
  }, [currentTimerIndex, isInitialized])

  // Play chime when final timer ends
  useEffect(() => {
    if (timeLeft === 0 && currentTimerIndex === timers.length - 1 && isInitialized) {
      const now = Date.now()
      if (now - lastChimeTimeRef.current > 500) {
        lastChimeTimeRef.current = now
        playTimerChime()
      }
    }
  }, [timeLeft, currentTimerIndex, timers.length, isInitialized])

  // Secondary timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (isSecondaryRunning && secondaryTimeLeft > 0) {
      interval = setInterval(() => {
        setSecondaryTimeLeft(prev => {
          if (prev <= 1) {
            setIsSecondaryRunning(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    
    return () => clearInterval(interval)
  }, [isSecondaryRunning, secondaryTimeLeft])

  // Play chime when secondary timer ends
  useEffect(() => {
    if (secondaryTimeLeft === 0 && isSecondaryRunning === false && isInitialized) {
      const now = Date.now()
      if (now - lastSecondaryChimeTimeRef.current > 500) {
        lastSecondaryChimeTimeRef.current = now
        playTimerChime()
      }
    }
  }, [secondaryTimeLeft, isSecondaryRunning, isInitialized])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const handleStart = () => setIsRunning(true)
  const handlePause = () => setIsRunning(false)
  const handleReset = () => {
    setIsRunning(false)
    setCurrentTimerIndex(0)
    setTimeLeft(timers[0]?.duration || 20 * 60)
    lastChimeTimerIndexRef.current = -1
  }

  const handleSkipTimer = () => {
    setIsRunning(false)
    if (currentTimerIndex < timers.length - 1) {
      setCurrentTimerIndex(currentTimerIndex + 1)
      setTimeLeft(timers[currentTimerIndex + 1].duration)
    } else {
      // Already on last timer, just end it
      setTimeLeft(0)
    }
  }

  const handleRestartTimer = () => {
    setIsRunning(false)
    setTimeLeft(timers[currentTimerIndex].duration)
  }

  const handleToggleSecondaryTimer = () => {
    setIsSecondaryRunning(true)
    setSecondaryTimeLeft(30)
  }

  const handleAddTimer = () => {
    if (!newTimerName.trim()) return
    
    const durationInSeconds = parseInt(newTimerMinutes) * 60
    const newTimer: Timer = {
      id: Date.now().toString(),
      name: newTimerName,
      duration: durationInSeconds
    }
    
    setTimers([...timers, newTimer])
    setNewTimerName('')
    setNewTimerMinutes('1')
  }

  const handleDeleteTimer = (id: string) => {
    const newTimers = timers.filter(t => t.id !== id)
    if (newTimers.length === 0) return
    
    setTimers(newTimers)
    
    if (currentTimerIndex >= newTimers.length) {
      setCurrentTimerIndex(newTimers.length - 1)
    }
    
    setTimeLeft(newTimers[currentTimerIndex]?.duration || 20 * 60)
  }

  const handleMoveTimer = (fromIndex: number, toIndex: number) => {
    const newTimers = [...timers]
    const [movedTimer] = newTimers.splice(fromIndex, 1)
    newTimers.splice(toIndex, 0, movedTimer)
    setTimers(newTimers)
  }

  if (view === 'settings') {
    return (
      <div className="settings-container">
        <div className="settings">
          <h1>Timer Settings</h1>
          
          <div className="settings-form">
            <h2>Add New Timer</h2>
            <div className="form-group">
              <label htmlFor="timer-name">Timer Name:</label>
              <input
                id="timer-name"
                type="text"
                value={newTimerName}
                onChange={(e) => setNewTimerName(e.target.value)}
                placeholder="e.g., Round 1"
              />
            </div>
            <div className="form-group">
              <label htmlFor="timer-minutes">Duration (minutes):</label>
              <input
                id="timer-minutes"
                type="number"
                value={newTimerMinutes}
                onChange={(e) => setNewTimerMinutes(e.target.value)}
                min="1"
                max="180"
              />
            </div>
            <button className="btn btn-primary" onClick={handleAddTimer}>
              Add Timer
            </button>
          </div>

          <div className="timers-list">
            <h2>Configured Timers ({timers.length})</h2>
            {timers.length === 0 ? (
              <p className="empty-message">No timers configured yet</p>
            ) : (
              <div className="timers">
                {timers.map((timer, index) => (
                  <div key={timer.id} className="timer-item">
                    <div className="timer-info">
                      <span className="timer-order">#{index + 1}</span>
                      <div>
                        <div className="timer-name">{timer.name}</div>
                        <div className="timer-duration">
                          {Math.floor(timer.duration / 60)} minutes {timer.duration % 60} seconds
                        </div>
                      </div>
                    </div>
                    <div className="timer-actions">
                      {index > 0 && (
                        <button
                          className="btn btn-small"
                          onClick={() => handleMoveTimer(index, index - 1)}
                          title="Move up"
                        >
                          ↑
                        </button>
                      )}
                      {index < timers.length - 1 && (
                        <button
                          className="btn btn-small"
                          onClick={() => handleMoveTimer(index, index + 1)}
                          title="Move down"
                        >
                          ↓
                        </button>
                      )}
                      <button
                        className="btn btn-small btn-danger"
                        onClick={() => handleDeleteTimer(timer.id)}
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="btn btn-primary btn-large" onClick={() => setView('timer')}>
            Start Countdown
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="timer-container">
      <div className="timer">
        <div className="timer-header">
          <h1>{timers[currentTimerIndex]?.name || 'Timer'}</h1>
          <div className="timer-progress">
            Timer {currentTimerIndex + 1} of {timers.length}
          </div>
        </div>
        
        <div className="timer-display">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>

        {isSecondaryRunning && (
          <div className="secondary-timer-overlay">
            <div className="secondary-timer-display">
              {String(secondaryTimeLeft).padStart(2, '0')}s
            </div>
          </div>
        )}

        {timers.length > 1 && (
          <div className="upcoming-timers">
            <div className="upcoming-label">Next:</div>
            <div className="upcoming-list">
              {timers.slice(currentTimerIndex + 1, currentTimerIndex + 3).map((t) => (
                <div key={t.id} className="upcoming-item">
                  {t.name} ({Math.floor(t.duration / 60)}m)
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="timer-controls">
          <button 
            className="timer-button"
            onClick={handleStart}
            disabled={isRunning}
          >
            Start
          </button>
          <button 
            className="timer-button"
            onClick={handlePause}
            disabled={!isRunning}
          >
            Pause
          </button>
          <button 
            className="timer-button control-icon"
            onClick={handleRestartTimer}
            title="Restart current timer"
          >
            |&lt;
          </button>
          <button 
            className="timer-button control-icon"
            onClick={handleSkipTimer}
            title="Skip to next timer"
          >
            &gt;|
          </button>
          <button 
            className="timer-button secondary-timer-btn"
            onClick={handleToggleSecondaryTimer}
            title="Start 30 second timer"
          >
            <span className="secondary-timer-icon">↻</span>
            <span>30</span>
          </button>
          <button 
            className="timer-button reset"
            onClick={handleReset}
          >
            Reset
          </button>
          <button 
            className="timer-button settings-cog"
            onClick={() => setView('settings')}
            title="Settings"
          >
            ⚙
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
