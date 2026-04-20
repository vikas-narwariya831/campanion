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
  
  // Setup state
  const [onboardingData, setOnboardingData] = useState<any>(null)
  const [runningApps, setRunningApps] = useState<string[]>([
    'Code', 'Chrome', 'Terminal', 'Discord', 'Slack', 'Figma'
  ])
  const [setupApp, setSetupApp] = useState('Code')
  const [setupTime, setSetupTime] = useState(60)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Periodic system pulse
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(true)
      setTimeout(() => setPulse(false), 300)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Activity data tracking
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

  // Jarvis Voice Logic
  useEffect(() => {
    if ((session?.warning || 0) > 0 && session?.isActive) {
      const speak = () => {
        const phrases = [
          'Sir, return to focus immediately.',
          'Distraction detected. Resuming goal is mandatory.',
          'Penalty imminent. Sir, please stop.'
        ]
        const phrase = phrases[Math.floor(Math.random() * phrases.length)]
        const speech = new SpeechSynthesisUtterance(phrase)
        const voices = window.speechSynthesis.getVoices()
        const jarvisVoice = voices.find(v => v.name.includes('Google UK English Male')) || voices.find(v => v.lang.includes('en'))
        if (jarvisVoice) speech.voice = jarvisVoice
        speech.rate = 1.3
        window.speechSynthesis.speak(speech)
      }
      setTimeout(speak, 500)
    }
  }, [session?.warning, session?.isActive])

  // Alert Text Logic
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

  const startSession = (min: number) => {
    if (window.api?.startSession) window.api.startSession(min)
  }

  const stopSession = () => {
    if (window.api?.stopSession) window.api.stopSession()
  }

  const toggleDashboard = () => {
    if (window.api?.toggleDashboard) window.api.toggleDashboard()
  }

  const initializeJarvis = () => {
      const speech = new SpeechSynthesisUtterance('System active.')
      const voices = window.speechSynthesis.getVoices()
      const jarvisVoice = voices.find(v => v.name.includes('Google UK English Male')) || voices.find(v => v.lang.includes('en'))
      if (jarvisVoice) speech.voice = jarvisVoice
      window.speechSynthesis.speak(speech)

      if (window.api?.updatePetConfig) {
          window.api.updatePetConfig({
              ...onboardingData,
              onboardingCompleted: true,
              targetApp: setupApp
          })
          startSession(setupTime)
      }
  }

  const coreColor = isWarningMode ? '#ff0000' : (state === 'idle' ? '#0ea5e9' : '#06b6d4')
  const outerColor = isWarningMode ? '#ff3333' : (state === 'idle' ? '#38bdf8' : '#22d3ee')
  const sessionProgress = (session?.isActive && session.total > 0) ? (session.remaining / session.total) : 0

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-start pointer-events-auto select-none relative overflow-visible"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Notch Plate Visual */}
      <div className="w-24 h-4 bg-black/80 rounded-b-2xl mb-1 shadow-lg flex items-center justify-center border-x border-b border-white/5 backdrop-blur-sm z-[100]">
          <div className="w-6 h-0.5 bg-white/10 rounded-full"></div>
      </div>

      <AnimatePresence mode='wait'>
        {isSetupActive ? (
          <motion.div 
            key="setup-screen"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-[220px] bg-slate-950/95 border border-cyan-500/30 rounded-[1.2rem] p-3 shadow-2xl backdrop-blur-xl flex flex-col items-center mt-2 z-[9999]"
          >
            <div className="w-full space-y-2">
                <div className="space-y-1 relative">
                    <label className="text-[7px] text-slate-500 font-bold uppercase tracking-widest ml-1">Focus Target</label>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}
                        className="w-full bg-slate-900 border border-slate-700/50 p-1.5 rounded-lg flex items-center justify-between text-[9px] font-bold text-white"
                    >
                        <div className="flex items-center space-x-2">
                            <Target className="w-2.5 h-2.5 text-cyan-400" />
                            <span className="truncate max-w-[100px]">{setupApp}</span>
                        </div>
                        <ChevronDown className={`w-2.5 h-2.5 text-cyan-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {dropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-950 border border-slate-700 rounded-lg overflow-y-auto max-h-[120px] z-[9999] shadow-2xl">
                            {runningApps.map(app => (
                                <button key={app} onClick={() => { setSetupApp(app); setDropdownOpen(false); }} className={`w-full p-1.5 text-left text-[8px] font-bold border-b border-white/5 last:border-0 hover:bg-cyan-500/10 ${setupApp === app ? 'text-cyan-400' : 'text-slate-200'}`}>
                                    {app}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <label className="text-[7px] text-slate-500 font-bold uppercase tracking-widest ml-1">Duration</label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
                        {[15, 60, 120].map(m => (
                            <button key={m} onClick={() => setSetupTime(m)} className={`py-1 rounded-md text-[8px] font-black transition-all ${setupTime === m ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>
                                {m < 60 ? `${m}M` : `${m/60}H`}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <button onClick={initializeJarvis} className="w-full mt-4 bg-cyan-500 p-2 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                Start Session
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="jarvis-core"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: isWarningMode ? 1.5 : 1 }}
            className={`flex flex-col items-center justify-start pt-16 h-[500px] w-full relative transition-colors duration-500 ${isWarningMode ? 'bg-red-950/20' : ''}`}
          >
            
            {/* DISTRACTION COUNTDOWN - Centered within Core */}
            <AnimatePresence>
                {isWarningMode && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[500] flex flex-col items-center justify-center pointer-events-none"
                    >
                        <motion.span 
                            key={session?.warning}
                            initial={{ scale: 3, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-[180px] font-black text-red-500 leading-none drop-shadow-[0_0_30px_#ff0000] -mt-20"
                        >
                            {Math.ceil(session?.warning || 0)}
                        </motion.span>
                        
                        <div className="flex flex-col items-center -mt-8">
                            <span className="text-red-500 font-mono text-[14px] font-black drop-shadow-[0_0_10px_red] uppercase italic animate-pulse">
                                {glitchText}
                            </span>
                            <div className="text-[10px] text-white/50 bg-red-600/40 px-6 py-1 rounded-full border border-red-500/50 uppercase tracking-[0.3em] font-black mt-2">
                                System Lockdown Imminent
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Core Assembly */}
            <div className={`relative flex items-center justify-center`}>
                
                {/* TIMER READOUT - Tight mount right */}
                {session?.isActive && !isWarningMode && (
                    <motion.div 
                        className="absolute -right-20 flex flex-col items-center bg-slate-950/80 backdrop-blur-md p-2 px-3 border-l-4 border-cyan-500 rounded-r-xl shadow-xl"
                    >
                        <span className="text-[7px] text-slate-500 font-black uppercase tracking-widest leading-none">Time</span>
                        <span className="text-[16px] font-black font-mono text-white mt-1 leading-none">
                            {formatTime(session.remaining)}
                        </span>
                    </motion.div>
                )}

                {/* Main Reactor Body */}
                <div className="relative w-28 h-28 flex items-center justify-center p-4">
                    {/* Quick Menu Overlay */}
                    <AnimatePresence>
                        {showMenu && !isWarningMode && (
                            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute -top-10 flex items-center space-x-1 bg-slate-950/90 border border-slate-700 p-1.5 rounded-xl z-[999]">
                                <button onClick={stopSession} className="p-1 px-1 text-rose-400 hover:bg-rose-500/10 rounded-md"><Square size={12} fill="currentColor" /></button>
                                <button onClick={toggleDashboard} className="p-1 text-slate-400 hover:text-white"><LayoutDashboard size={12} /></button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    {/* Reactor Circles */}
                    <svg className="absolute w-24 h-24 -rotate-90">
                        <circle cx="48" cy="48" r="42" fill="transparent" stroke="rgba(34, 211, 238, 0.05)" strokeWidth="1" />
                        <motion.circle cx="48" cy="48" r="42" fill="transparent" stroke={outerColor} strokeWidth={isWarningMode ? 3 : 1.5} strokeDasharray={2 * Math.PI * 42} animate={{ strokeDashoffset: (2 * Math.PI * 42) * (1 - sessionProgress) }} strokeLinecap="round" />
                    </svg>

                    {/* Central Core */}
                    <div className="relative flex items-center justify-center z-10 transition-all duration-300">
                        <motion.div animate={{ scale: isWarningMode ? [1, 1.4, 1] : [1, 1.1, 1], opacity: [0.1, 0.4, 0.1] }} transition={{ repeat: Infinity, duration: isWarningMode ? 0.5 : 4 }} style={{ backgroundColor: coreColor }} className="absolute w-14 h-14 rounded-full blur-xl"></motion.div>
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 10, ease: "linear" }} style={{ borderColor: outerColor, borderStyle: 'dashed' }} className="absolute w-12 h-12 border rounded-full border-opacity-40"></motion.div>
                        <motion.div animate={{ scale: (pulse || isWarningMode) ? 1.2 : 1 }} style={{ backgroundColor: coreColor }} className="relative w-6 h-6 rounded-full border border-white/20 shadow-inner shadow-black/50"></motion.div>
                    </div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default JarvisCore
