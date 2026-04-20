import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Square, 
  LayoutDashboard, 
  ChevronDown, 
  Target,
} from 'lucide-react'

interface PetProps {
  state: 'active' | 'idle' | 'warning'
  idleTime: number
  scale?: number
  session?: {
    remaining: number
    total: number
    isActive: boolean
    warning: number
    target?: string
  }
}

const JarvisCore: React.FC<PetProps> = ({ state, idleTime, scale = 1, session }) => {
  const [pulse, setPulse] = useState(false)
  const [glitchText, setGlitchText] = useState('SYSTEM SECURE')
  const [showMenu, setShowMenu] = useState(false)
  
  const [onboardingData, setOnboardingData] = useState<any>(null)
  const [runningApps, setRunningApps] = useState<string[]>([
    'Code', 'Chrome', 'Terminal', 'Discord', 'Slack', 'Figma'
  ])
  const [setupApp, setSetupApp] = useState('Code')
  const [setupTime, setSetupTime] = useState(60)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(true)
      setTimeout(() => setPulse(false), 300)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const cleanup = window.api?.onActivityUpdate((data: any) => {
        setOnboardingData(prev => ({
            ...prev,
            ...data.petConfig,
            currentApp: data.currentApp,
            category: data.category
        }))
        if (data.runningApps && data.runningApps.length > 0) {
            setRunningApps(data.runningApps)
        }
    })
    return () => cleanup && cleanup()
  }, [])

  useEffect(() => {
    if ((session?.warning || 0) > 0 && session?.isActive) {
      const speak = () => {
        const phrases = ['Sir, return to focus.', 'Distraction detected.', 'Penalty imminent.']
        const phrase = phrases[Math.floor(Math.random() * phrases.length)]
        const speech = new SpeechSynthesisUtterance(phrase)
        const voices = window.speechSynthesis.getVoices()
        const jarvisVoice = voices.find(v => v.name.includes('Google UK English Male')) || voices.find(v => v.lang.includes('en'))
        if (jarvisVoice) speech.voice = jarvisVoice
        speech.rate = 1.3
        window.speechSynthesis.speak(speech)
      }
      setTimeout(speak, 300)
    }
  }, [session?.warning, session?.isActive])

  useEffect(() => {
    if ((session?.warning || 0) > 0) {
      const texts = ['ACCESS DENIED', 'SYSTEM LOCKDOWN', 'ALERT']
      const interval = setInterval(() => {
        setGlitchText(texts[Math.floor(Math.random() * texts.length)])
      }, 100)
      return () => clearInterval(interval)
    } else {
      setGlitchText('SYSTEM SECURE')
    }
  }, [session?.warning])

  const isSetupActive = !session?.isActive
  const isWarningMode = (session?.warning || 0) > 0
  
  const handleMouseEnter = () => {
    if (window.api?.setIgnoreMouse) window.api.setIgnoreMouse(false)
    if (session?.isActive) setShowMenu(true)
  }

  const handleMouseLeave = () => {
    if (!isSetupActive) {
        if (window.api?.setIgnoreMouse) window.api.setIgnoreMouse(true)
        setShowMenu(false)
    }
    setDropdownOpen(false)
  }

  const startSession = (min: number) => { if (window.api?.startSession) window.api.startSession(min) }
  const stopSession = () => { if (window.api?.stopSession) window.api.stopSession() }
  const toggleDashboard = () => { if (window.api?.toggleDashboard) window.api.toggleDashboard() }

  const initializeJarvis = () => {
      const speech = new SpeechSynthesisUtterance('System active.')
      const voices = window.speechSynthesis.getVoices()
      const jarvisVoice = voices.find(v => v.name.includes('Google UK English Male')) || voices.find(v => v.lang.includes('en'))
      if (jarvisVoice) speech.voice = jarvisVoice
      window.speechSynthesis.speak(speech)
      if (window.api?.updatePetConfig) {
          window.api.updatePetConfig({ ...onboardingData, onboardingCompleted: true, targetApp: setupApp })
          startSession(setupTime)
      }
  }

  const coreColor = isWarningMode ? '#ff0000' : '#06b6d4'
  const outerColor = isWarningMode ? '#ff3333' : '#22d3ee'
  const sessionProgress = (session?.isActive && session.total > 0) ? (session.remaining / session.total) : 0

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-start pointer-events-auto select-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Notch - Always visible at top */}
      <div className="w-24 h-4 bg-black/80 rounded-b-2xl mb-1 shadow-lg flex items-center justify-center border-x border-b border-white/5">
        <div className="w-6 h-0.5 bg-white/10 rounded-full"></div>
      </div>

      <AnimatePresence mode='wait'>
        {isSetupActive ? (
          /* ==================== SETUP ==================== */
          <motion.div 
            key="setup"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-[220px] bg-slate-950/95 border border-cyan-500/30 rounded-[1.2rem] p-3 shadow-2xl backdrop-blur-xl flex flex-col items-center mt-2 z-[9999]"
          >
            <div className="w-full space-y-2">
                <div className="space-y-1 relative">
                    <label className="text-[7px] text-slate-500 font-bold uppercase tracking-widest ml-1">Focus Target</label>
                    <button onClick={(e) => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }} className="w-full bg-slate-900 border border-slate-700/50 p-1.5 rounded-lg flex items-center justify-between text-[9px] font-bold text-white">
                        <div className="flex items-center space-x-2">
                            <Target className="w-2.5 h-2.5 text-cyan-400" />
                            <span className="truncate max-w-[100px]">{setupApp}</span>
                        </div>
                        <ChevronDown className={`w-2.5 h-2.5 text-cyan-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {dropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-950 border border-slate-700 rounded-lg overflow-y-auto max-h-[120px] z-[9999] shadow-2xl">
                            {runningApps.map(app => (
                                <button key={app} onClick={() => { setSetupApp(app); setDropdownOpen(false); }} className={`w-full p-1.5 text-left text-[8px] font-bold border-b border-white/5 last:border-0 hover:bg-cyan-500/10 ${setupApp === app ? 'text-cyan-400' : 'text-slate-200'}`}>{app}</button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="space-y-1">
                    <label className="text-[7px] text-slate-500 font-bold uppercase tracking-widest ml-1">Duration</label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
                        {[15, 60, 120].map(m => (
                            <button key={m} onClick={() => setSetupTime(m)} className={`py-1 rounded-md text-[8px] font-black transition-all ${setupTime === m ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>{m < 60 ? `${m}M` : `${m/60}H`}</button>
                        ))}
                    </div>
                </div>
            </div>
            <button onClick={initializeJarvis} className="w-full mt-4 bg-cyan-500 p-2 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] text-slate-950">Start Session</button>
          </motion.div>
        ) : (
          /* ==================== ACTIVE SESSION (Reactor always at top) ==================== */
          <motion.div 
            key="active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center mt-2"
          >
            {/* Reactor + Timer Row */}
            <div className="relative flex items-center justify-center">
              {/* Timer Badge Right */}
              {session?.isActive && !isWarningMode && (
                <motion.div 
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="absolute -right-[72px] bg-slate-950/90 backdrop-blur-md p-2 px-3 border-l-4 border-cyan-500 rounded-r-xl shadow-xl"
                >
                  <span className="text-[6px] text-slate-500 font-black uppercase tracking-widest block leading-none">Time</span>
                  <span className="text-[15px] font-black font-mono text-white leading-none mt-1 block">
                    {formatTime(session.remaining)}
                  </span>
                </motion.div>
              )}

              {/* Reactor Core - Always here at top */}
              <div className="relative w-24 h-24 flex items-center justify-center">
                {/* Quick Menu */}
                <AnimatePresence>
                  {showMenu && !isWarningMode && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute -top-8 flex items-center space-x-1 bg-slate-950/90 border border-slate-700 p-1 rounded-xl z-[999]">
                      <button onClick={stopSession} className="p-1 text-rose-400 hover:bg-rose-500/10 rounded-md"><Square size={10} fill="currentColor" /></button>
                      <button onClick={toggleDashboard} className="p-1 text-slate-400 hover:text-white"><LayoutDashboard size={10} /></button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Circle Progress */}
                <svg className="absolute w-20 h-20 -rotate-90">
                  <circle cx="40" cy="40" r="36" fill="transparent" stroke={isWarningMode ? 'rgba(255,0,0,0.1)' : 'rgba(34,211,238,0.05)'} strokeWidth="1" />
                  <motion.circle cx="40" cy="40" r="36" fill="transparent" stroke={outerColor} strokeWidth={isWarningMode ? 3 : 1.5} strokeDasharray={2 * Math.PI * 36} animate={{ strokeDashoffset: (2 * Math.PI * 36) * (1 - sessionProgress) }} strokeLinecap="round" />
                </svg>

                {/* Glow */}
                <motion.div 
                  animate={{ scale: isWarningMode ? [1, 1.4, 1] : [1, 1.1, 1], opacity: [0.1, 0.4, 0.1] }} 
                  transition={{ repeat: Infinity, duration: isWarningMode ? 0.4 : 4 }} 
                  style={{ backgroundColor: coreColor }}
                  className="absolute w-12 h-12 rounded-full blur-xl" 
                />
                {/* Dashed Ring */}
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: isWarningMode ? 2 : 10, ease: "linear" }} style={{ borderColor: outerColor }} className="absolute w-10 h-10 border border-dashed rounded-full" />
                {/* Core Dot */}
                <motion.div 
                  animate={{ scale: pulse || isWarningMode ? 1.3 : 1 }} 
                  style={{ backgroundColor: coreColor }} 
                  className="relative w-5 h-5 rounded-full border border-white/20 shadow-inner" 
                />
              </div>
            </div>

            {/* WARNING PANEL - Drops below reactor when distraction detected */}
            <AnimatePresence>
              {isWarningMode && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scaleY: 0 }}
                  animate={{ opacity: 1, y: 0, scaleY: 1 }}
                  exit={{ opacity: 0, y: -10, scaleY: 0 }}
                  className="flex flex-col items-center mt-4 origin-top"
                >
                  {/* Big Countdown Number */}
                  <motion.span 
                    key={session?.warning}
                    initial={{ scale: 2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-[80px] font-black text-red-500 leading-none drop-shadow-[0_0_20px_rgba(255,0,0,0.6)]"
                  >
                    {Math.ceil(session?.warning || 0)}
                  </motion.span>

                  {/* Glitch Text Badge */}
                  <motion.div 
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ repeat: Infinity, duration: 0.3 }}
                    className="bg-red-600 px-5 py-1 rounded-full shadow-[0_0_15px_rgba(255,0,0,0.4)] mt-2"
                  >
                    <span className="text-[9px] font-black text-white tracking-[0.4em] uppercase">
                      {glitchText}
                    </span>
                  </motion.div>

                  {/* Return Message */}
                  <span className="text-[8px] text-red-400/50 font-bold mt-3 uppercase tracking-wider">
                    Return to {session?.target || 'Focus'} immediately
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default JarvisCore
