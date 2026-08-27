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

  // Wake Lock ref
  const wakeLockRef = useRef<any>(null)
  const silentAudioRef = useRef<HTMLAudioElement | null>(null)

  // Request wake lock to keep screen on during countdown
  const requestWakeLock = async () => {
    try {
      // Try native Wake Lock API (Chrome, Edge, Android)
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen')
        console.log('Wake Lock acquired (native)')
        return
      }
    } catch (error) {
      console.error('Failed to acquire native wake lock:', error)
    }

    // iOS fallback: use silent audio to prevent sleep
    // This is a known technique to keep iOS screen on during timer
    try {
      if (!silentAudioRef.current) {
        // Create a silent audio element
        const audio = new Audio()
        audio.src = 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA=='
        audio.loop = true
        audio.volume = 0
        audio.play().catch(err => console.log('Could not auto-play silent audio:', err))
        silentAudioRef.current = audio
        console.log('Wake Lock fallback activated (silent audio)')
      }
    } catch (error) {
      console.error('Failed to activate wake lock fallback:', error)
    }
  }

  // Release wake lock
  const releaseWakeLock = async () => {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release()
        wakeLockRef.current = null
        console.log('Wake Lock released (native)')
      }
    } catch (error) {
      console.error('Failed to release native wake lock:', error)
    }

    // Stop silent audio fallback
    if (silentAudioRef.current) {
      silentAudioRef.current.pause()
      silentAudioRef.current = null
      console.log('Wake Lock fallback stopped')
    }
  }

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
    let interval: ReturnType<typeof setInterval>
    
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

  // Secondary timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    
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

  // Play chime when main timer ends
  useEffect(() => {
    if (timeLeft === 1 && isRunning && isInitialized) {
      const now = Date.now()
      if (now - lastChimeTimeRef.current > 500) {
        lastChimeTimeRef.current = now
        playTimerChime()
      }
    }
  }, [timeLeft, isRunning, isInitialized])

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

  // Manage wake lock for main timer
  useEffect(() => {
    if (isRunning) {
      requestWakeLock()
    } else {
      releaseWakeLock()
    }
  }, [isRunning])

  // Manage wake lock for secondary timer
  useEffect(() => {
    if (isSecondaryRunning) {
      requestWakeLock()
    } else if (!isRunning) {
      releaseWakeLock()
    }
  }, [isSecondaryRunning, isRunning])

  // Handle page visibility change - reacquire wake lock if needed
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        await releaseWakeLock()
      } else if (isRunning || isSecondaryRunning) {
        await requestWakeLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isRunning, isSecondaryRunning])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const handleStart = () => setIsRunning(true)
  const handlePause = () => setIsRunning(false)
  const handleReset = () => {
    setIsRunning(false)
    setCurrentTimerIndex(0)
    setTimeLeft(timers[0]?.duration || 20 * 60)
  }

  const handleSkipTimer = () => {
    if (currentTimerIndex < timers.length - 1) {
      setCurrentTimerIndex(currentTimerIndex + 1)
      setTimeLeft(timers[currentTimerIndex + 1].duration)
      // Keep running if we were already running
    } else {
      // Already on last timer, stop and end it
      setIsRunning(false)
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
