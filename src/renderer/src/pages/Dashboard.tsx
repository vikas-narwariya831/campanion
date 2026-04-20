import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity, 
  Clock, 
  BarChart3, 
  Zap, 
  AlertTriangle, 
  History, 
  Monitor,
  Settings2,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts'

const Dashboard: React.FC = () => {
  const [activity, setActivity] = useState<any>({
    idleTime: 0,
    idleState: 'active',
    currentApp: 'Initializing...',
    category: 'Productive',
    todayStats: { active: 0, idle: 0, apps: {}, history: [] },
    petConfig: { scale: 1 },
    session: { remaining: 0, total: 0, isActive: false }
  })

  useEffect(() => {
    if (window.api && window.api.onActivityUpdate) {
      const cleanup = window.api.onActivityUpdate((data: any) => {
        setActivity(data)
      })
      return cleanup
    }
    return () => {}
  }, [])

  const updateScale = (scale: number) => {
     const config = { scale }
     if (window.api && (window.api as any).updatePetConfig) {
        (window.api as any).updatePetConfig(config)
     } else {
        const ipc = (window as any).electron?.ipcRenderer
        if (ipc) ipc.send('update-pet-config', config)
     }
  }

  const startSession = (min: number) => {
    if (window.api && window.api.startSession) {
      window.api.startSession(min)
    }
  }

  const stopSession = () => {
    if (window.api && window.api.stopSession) {
      window.api.stopSession()
    }
  }

  const chartData = [
    { name: 'Active', value: activity.todayStats.active, color: '#22d3ee' },
    { name: 'Idle', value: activity.todayStats.idle, color: '#94a3b8' }
  ]

  const efficiency = Math.round(
    (activity.todayStats.active / (activity.todayStats.active + activity.todayStats.idle || 1)) * 100
  )

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      {/* Header */}
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            CAMPANION CORE
          </h1>
          <p className="text-slate-400 mt-1 flex items-center">
            <span className={`w-2 h-2 rounded-full mr-2 ${activity.idleState === 'active' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></span>
            System Status: {activity.idleState.toUpperCase()}
          </p>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-4 rounded-2xl flex items-center space-x-4">
          <Zap className="text-cyan-400 w-6 h-6" />
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest">Efficiency</p>
            <p className="text-2xl font-bold text-cyan-400">{efficiency}%</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        
        {/* Real-time Tracking & Settings Row */}
        <div className="col-span-12 lg:col-span-8 flex flex-col space-y-6">
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm">
                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center space-x-4">
                    <div className="p-3 bg-cyan-500/10 rounded-2xl">
                        <Monitor className="text-cyan-400 w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Current Focus</h2>
                        <p className="text-slate-400 text-sm">Real-time application monitoring</p>
                    </div>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-tight ${
                    activity.category === 'Productive' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                    activity.category === 'Distraction' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
                    'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                    {activity.category}
                    </div>
                </div>

                <div className="flex flex-col space-y-4">
                    <div className="text-5xl font-black text-slate-100 truncate">
                    {activity.currentApp}
                    </div>
                </div>
            </div>

            {/* Session Controller */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        <Clock className="text-cyan-400 w-5 h-5" />
                        <h2 className="text-lg font-bold">Focus Session</h2>
                    </div>
                    {activity.session?.isActive && (
                        <div className="flex items-center space-x-2 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">
                            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] text-rose-400 font-bold uppercase tracking-widest">Active</span>
                        </div>
                    )}
                </div>

                {!activity.session?.isActive ? (
                    <div className="grid grid-cols-3 gap-4">
                        {[15, 30, 60].map((min) => (
                            <button
                                key={min}
                                onClick={() => startSession(min)}
                                className="group relative overflow-hidden bg-slate-950/50 border border-slate-800 py-4 rounded-2xl hover:border-cyan-500/50 transition-all duration-300"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <span className="text-xl font-black block group-hover:scale-110 transition-transform">{min}</span>
                                <span className="text-[10px] text-slate-500 uppercase font-bold">Minutes</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center space-x-6">
                        <div className="relative w-20 h-20 flex-shrink-0">
                            <svg className="w-full h-full -rotate-90">
                                <circle cx="40" cy="40" r="36" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                                <motion.circle 
                                    cx="40" cy="40" r="36" 
                                    fill="transparent" 
                                    stroke="#22d3ee" 
                                    strokeWidth="6"
                                    strokeDasharray={2 * Math.PI * 36}
                                    initial={{ strokeDashoffset: 2 * Math.PI * 36 }}
                                    animate={{ strokeDashoffset: (2 * Math.PI * 36) * (1 - (activity.session.remaining / activity.session.total)) }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold">
                                {Math.floor(activity.session.remaining / 60)}:{(activity.session.remaining % 60).toString().padStart(2, '0')}
                            </div>
                        </div>
                        <div className="flex-grow">
                            <h3 className="text-slate-100 font-bold">Stay Productive, Sir.</h3>
                            <p className="text-xs text-slate-500">Companion is monitoring your environment.</p>
                            <button 
                                onClick={stopSession}
                                className="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-400 transition-colors"
                            >
                                [ Terminate Session ]
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Jarvis Settings */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        <Settings2 className="text-blue-400 w-5 h-5" />
                        <h2 className="text-lg font-bold">Jarvis Configuration</h2>
                    </div>
                    <div className="text-cyan-400 font-mono font-bold bg-cyan-400/10 px-3 py-1 rounded-lg border border-cyan-400/20">
                        {Math.round((activity.petConfig?.scale || 1) * 100)}%
                    </div>
                </div>
                
                <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                        <Minimize2 className="text-slate-500 w-4 h-4" />
                        <input 
                            type="range" 
                            min="0.5" 
                            max="2.5" 
                            step="0.1"
                            value={activity.petConfig?.scale || 1}
                            onChange={(e) => updateScale(parseFloat(e.target.value))}
                            className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                        />
                        <Maximize2 className="text-slate-500 w-4 h-4" />
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center">
                        Drag to adjust Companion size • Changes apply in real-time
                    </p>
                </div>
            </div>
        </div>

        {/* Daily Summary Chart */}
        <motion.div 
          className="col-span-12 lg:col-span-4 bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm flex flex-col"
        >
          <div className="flex items-center space-x-3 mb-6">
            <BarChart3 className="text-slate-400 w-5 h-5" />
            <h2 className="font-bold">Daily Allocation</h2>
          </div>
          
          <div className="flex-grow min-h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
             </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Focus Timeline */}
        <div className="col-span-12 lg:col-span-12 bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm mt-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <History className="text-slate-400 w-5 h-5" />
              <h2 className="font-bold">Focus Timeline & Activity</h2>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest">Real-time intervals</div>
          </div>

          <div className="relative space-y-4 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-800">
            {activity.todayStats.history && activity.todayStats.history.slice(-10).reverse().map((event: any, i: number) => (
                <div key={i} className="relative pl-8 group">
                  <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-2 border-slate-950 flex items-center justify-center z-10 
                    ${event.type === 'DISTRACTION_START' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]' : 
                      event.type === 'FOCUS_REGAINED' ? 'bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.4)]' : 'bg-slate-700'}`}>
                    {event.type === 'DISTRACTION_START' ? <AlertTriangle className="w-3 h-3 text-white" /> : 
                     event.type === 'FOCUS_REGAINED' ? <Zap className="w-3 h-3 text-white" /> : <Clock className="w-3 h-3 text-white" />}
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-950/30 rounded-2xl border border-slate-800/40 group-hover:border-slate-700 transition-colors">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-100">
                        {event.type === 'DISTRACTION_START' ? `Lost Focus to ${event.app}` : 
                         event.type === 'FOCUS_REGAINED' ? `Regained Focus` : `State Change`}
                      </p>
                      <p className="text-xs text-slate-400">
                        {event.message || `App: ${event.app || 'System'}`}
                      </p>
                    </div>
                    <div className="text-right mt-2 md:mt-0">
                      <p className="text-xs font-mono text-cyan-400 font-bold">{event.time}</p>
                      {event.duration && (
                        <p className="text-[10px] text-rose-400 font-bold uppercase mt-1">
                          Duration: {Math.floor(event.duration / 60)}m {event.duration % 60}s
                        </p>
                      )}
                    </div>
                  </div>
                </div>
            ))}
            
            {(!activity.todayStats.history || activity.todayStats.history.length === 0) && (
              <div className="text-center py-10 text-slate-500 italic text-sm">
                No activity recorded for today yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
