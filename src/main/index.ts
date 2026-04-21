import { app, shell, BrowserWindow, ipcMain, powerMonitor, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

// Store and activeWin will be loaded dynamically due to ESM requirements
let store: any = null
let activeWin: any = null

let mainWindow: BrowserWindow | null = null
let petWindow: BrowserWindow | null = null

// Session State
let sessionTimer: NodeJS.Timeout | null = null
let sessionRemainingTime = 0 
let currentSessionTotal = 0
let distractionWarningRemaining = 0
let isCurrentlyDistracted = false
let isPenaltyActive = false
let lastCategory = 'Uncategorized'
let lastOwner = 'None'
let lastPos: 'top' | 'center' = 'top'

// Helper to reposition pet window
function repositionPet(pos: 'top' | 'center') {
    if (!petWindow) return
    if (pos === lastPos) return
    lastPos = pos

    const primaryDisplay = screen.getPrimaryDisplay()
    const { width, height } = primaryDisplay.workAreaSize
    const winWidth = 500
    const winHeight = 500

    if (pos === 'center') {
      petWindow.setBounds({
        x: Math.floor((width / 2) - (winWidth / 2)),
        y: Math.floor((height / 2) - (winHeight / 2)),
        width: winWidth,
        height: winHeight
      })
      petWindow.setAlwaysOnTop(true, 'screen-saver')
    } else {
      petWindow.setBounds({
        x: Math.floor((width / 2) - (winWidth / 2)),
        y: 0,
        width: winWidth,
        height: winHeight
      })
      petWindow.setAlwaysOnTop(true, 'floating')
    }
}

// Helper to get active window process name (Async & Non-Blocking)
let isTracking = false
async function getActiveWindowName(): Promise<string | null> {
  const { exec } = require('child_process')
  return new Promise((resolve) => {
    const cmd = `powershell -Command "$hwnd = (Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class Win32 { [DllImport(\\\"user32.dll\\\")] public static extern IntPtr GetForegroundWindow(); [DllImport(\\\"user32.dll\\\")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId); }' -PassThru)::GetForegroundWindow(); $wid = 0; [Win32]::GetWindowThreadProcessId($hwnd, [ref]$wid); (Get-Process -Id $wid).ProcessName"`
    
    const timeout = setTimeout(() => resolve(null), 3000) // 3s safety timeout
    exec(cmd, (err, stdout) => {
      clearTimeout(timeout)
      if (err) resolve(null)
      else resolve(stdout.trim() || null)
    })
  })
}

// Helper to get running apps
function getRunningApps(statsToday: any = {}) {
  const { execSync } = require('child_process')
  const fallbackApps = ['Code', 'Chrome', 'Terminal', 'Discord', 'Slack', 'Figma', 'IntelliJ']
  
  // Get apps actually used today from stats
  const usedApps = Object.keys(statsToday?.apps || {})
  
  try {
    const cmd = `powershell -Command "(Get-Process | Where-Object {$_.MainWindowTitle -ne ''}).ProcessName | Sort-Object -Unique"`
    const output = execSync(cmd).toString()
    const running = output.split(/[\r\n]+/).map(a => a.trim()).filter(a => a && a !== 'ProcessName')
    
    return Array.from(new Set([...fallbackApps, ...usedApps, ...running])).sort()
  } catch (e) {
    return Array.from(new Set([...fallbackApps, ...usedApps])).sort()
  }
}

async function initNativeModules() {
  if (store && activeWin) return
  
  try {
    if (!store) {
      const Store = (await import('electron-store')).default
      store = new Store()
    }
    if (!activeWin) {
      activeWin = (await import('active-win')).default
    }
  } catch (err) {
    console.error('Error initializing native modules:', err)
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    // Hidden on startup as requested
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Ensure links open in the system browser, not in the app window
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Prevent accidental navigation to external sites within the Electron window
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const devUrl = process.env['ELECTRON_RENDERER_URL']
    if (devUrl && !url.startsWith(devUrl)) {
      event.preventDefault()
      shell.openExternal(url)
    } else if (!devUrl && !url.startsWith('file://')) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })
}

function createPetWindow(): void {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width } = primaryDisplay.workAreaSize
  
  const winWidth = 500
  const winHeight = 500 

  petWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: Math.floor((width / 2) - (winWidth / 2)),
    y: 0, 
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    petWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/pet`)
  } else {
    petWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'pet' })
  }

  // Pet window should never open new windows
  petWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' }
  })
}

// Activity Tracking Logic
const APP_CATEGORIES = {
  PRODUCTIVE: ['Code', 'Visual Studio Code', 'Terminal', 'iTerm', 'Word', 'Editor', 'Discord', 'Slack'],
  DISTRACTION: ['YouTube', 'Netflix', 'Facebook', 'Twitter', 'X', 'Reddit', 'Game', 'Twitch', 'Firefox', 'Chrome', 'Edge']
}

// ============================================================
// STEP 1: Detect active window + category (runs every 1-3 sec)
// ============================================================
async function trackActivity() {
  await initNativeModules()
  
  try {
    const idleTime = powerMonitor.getSystemIdleTime()
    const idleState = powerMonitor.getSystemIdleState(60)
    
    let stats: any = {}
    if (store) {
      stats = store.get('stats', {}) || {}
    }
    
    const today = new Date().toISOString().split('T')[0]
    if (!stats[today]) {
        stats[today] = { active: 0, idle: 0, apps: {}, history: [], continuousWork: 0 }
    }

    let owner = 'System'
    let category = 'Uncategorized'
    let windowData = null

    if (activeWin) {
      try {
        windowData = await activeWin()
        if (windowData?.owner?.name) {
          owner = windowData.owner.name
        }
      } catch (e) {}
    }

    // Smart Fallback: Only run PowerShell if active-win failed 
    if (!windowData || !windowData.owner || !windowData.owner.name) {
        const fallbackName = await getActiveWindowName()
        if (fallbackName) {
            owner = fallbackName
            windowData = { owner: { name: fallbackName }, title: '' }
        }
    }

    const petConfig = store?.get('petConfig', { targetApp: 'Code' })
    let targetApp = petConfig.targetApp || 'Code'
    targetApp = targetApp.replace(/^\d+\s+/, '').trim()

    // Determine Category
    if (sessionRemainingTime > 0) {
        let isMatch = false
        if (windowData) {
            const title = (windowData.title || '').toLowerCase()
            const lowerOwner = (windowData.owner?.name || '').toLowerCase()
            const lowerTarget = targetApp.toLowerCase()
            
            if (lowerOwner.includes(lowerTarget) || lowerTarget.includes(lowerOwner) || title.includes(lowerTarget)) {
                isMatch = true
            }
        }
        category = isMatch ? 'Productive' : 'Distraction'
        console.log(`[JARVIS] Target: ${targetApp}, App: ${owner}, Match: ${isMatch}, Category: ${category}, Warning: ${distractionWarningRemaining}`)
    } else {
        if (windowData) {
            const title = (windowData.title || '').toLowerCase()
            const lowerOwner = (windowData.owner?.name || '').toLowerCase()

            if (APP_CATEGORIES.PRODUCTIVE.some(k => title.includes(k.toLowerCase()) || lowerOwner.includes(k.toLowerCase()))) {
                category = 'Productive'
            } else if (APP_CATEGORIES.DISTRACTION.some(k => title.includes(k.toLowerCase()) || lowerOwner.includes(k.toLowerCase()))) {
                category = 'Distraction'
            }
        }
    }

    lastOwner = owner
    lastCategory = category

    // Update isCurrentlyDistracted flag (the fast timer uses this)
    if (sessionRemainingTime > 0) {
      if (category === 'Distraction') {
        if (!isCurrentlyDistracted) {
          // NEW distraction just detected
          isCurrentlyDistracted = true
          distractionWarningRemaining = 5
          // Jarvis stays at top always
          console.log('[JARVIS] >>> DISTRACTION DETECTED! Starting 5-sec warning.')
        }
      } else {
        if (isCurrentlyDistracted) {
          // User returned to focus
          isCurrentlyDistracted = false
          isPenaltyActive = false
          distractionWarningRemaining = 0
          repositionPet('top')
          console.log('[JARVIS] >>> Focus regained! Cancelling warning/penalty.')
        }
      }
    }

    if (windowData) {
      const history = stats[today].history || []
      const lastEntry = history[history.length - 1]
      
      if (!lastEntry || lastEntry.app !== owner || (idleTime >= 5 && lastEntry.status !== 'idle')) {
        const status = idleTime >= 5 ? 'idle' : 'active'
        history.push({
          time: new Date().toLocaleTimeString(),
          app: owner,
          category,
          status
        })
        stats[today].history = history.slice(-20)
      }

      if (idleState === 'active' && idleTime < 5) {
        stats[today].active += 1
        stats[today].apps[owner] = (stats[today].apps[owner] || 0) + 1
        stats[today].continuousWork = (stats[today].continuousWork || 0) + 1
        
        if (stats[today].continuousWork >= 3600) {
          category = 'Take a Break!'
        }
      } else {
        stats[today].idle += 1
        stats[today].continuousWork = 0
      }

      if (store) store.set('stats', stats)
    } else {
      stats[today].idle += 1
      if (store) store.set('stats', stats)
    }

    sendPayload(owner, category, stats, targetApp, idleTime, idleState)

  } catch (error) {
    console.error('[JARVIS] trackActivity error:', error)
  }
}

function sendPayload(owner: string, category: string, stats: any, targetApp: string, idleTime: number, idleState: string) {
    const today = new Date().toISOString().split('T')[0]
    const payload = {
      idleTime,
      idleState,
      currentApp: owner,
      category,
      todayStats: stats[today] || { active: 0, idle: 0, apps: {}, history: [] },
      petConfig: store?.get('petConfig', { 
        scale: 1, 
        onboardingCompleted: false,
        targetApp: 'Code'
      }),
      runningApps: getRunningApps(stats[today]),
      session: {
        remaining: sessionRemainingTime,
        total: currentSessionTotal,
        isActive: sessionRemainingTime > 0,
        warning: distractionWarningRemaining,
        isPenalty: isPenaltyActive,
        target: targetApp
      }
    }

    mainWindow?.webContents.send('activity-update', payload)
    petWindow?.webContents.send('activity-update', payload)

    // Ensure interactivity during setup
    if (sessionRemainingTime <= 0) {
        petWindow?.setIgnoreMouseEvents(false)
    }
}

// ============================================================
// STEP 2: Fast 1-second timer for countdown + session tracking
// This runs independently of window detection for smooth UI
// ============================================================
function startFastTimer() {
  setInterval(() => {
    if (sessionRemainingTime <= 0) return

    // 1. Count down session timer every second
    sessionRemainingTime = Math.max(0, sessionRemainingTime - 1)
    if (sessionRemainingTime === 0) {
      petWindow?.webContents.send('session-complete')
    }

    // 2. Count down warning if active
    if (isCurrentlyDistracted && distractionWarningRemaining > 0) {
      distractionWarningRemaining--
      console.log(`[JARVIS] Warning countdown: ${distractionWarningRemaining}`)

      if (distractionWarningRemaining <= 0) {
        // PENALTY: Reset session timer but KEEP distraction state active
        // The user is STILL on the distracting app, so restart the warning immediately
        console.log('[JARVIS] >>> PENALTY APPLIED! Session reset. Warning restarting.')
        sessionRemainingTime = currentSessionTotal
        isPenaltyActive = true
        // Don't clear isCurrentlyDistracted — user is still distracted!
        // Restart warning countdown so red alert stays persistent
        distractionWarningRemaining = 5
      }
    }

    // 3. Broadcast state to renderer every second for smooth UI
    const petConfig = store?.get('petConfig', { targetApp: 'Code' })
    const today = new Date().toISOString().split('T')[0]
    const stats = store?.get('stats', {}) || {}

    const payload = {
      idleTime: 0,
      idleState: 'active',
      currentApp: lastOwner,
      category: lastCategory,
      todayStats: stats[today] || { active: 0, idle: 0, apps: {}, history: [] },
      petConfig,
      runningApps: [],
      session: {
        remaining: sessionRemainingTime,
        total: currentSessionTotal,
        isActive: sessionRemainingTime > 0,
        warning: distractionWarningRemaining,
        isPenalty: isPenaltyActive,
        target: petConfig?.targetApp || 'Code'
      }
    }

    mainWindow?.webContents.send('activity-update', payload)
    petWindow?.webContents.send('activity-update', payload)
  }, 1000) // Exactly 1 second, no dependencies on window detection
}

app.whenReady().then(async () => {
  await initNativeModules()
  electronApp.setAppUserModelId('com.electron.companion')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('set-ignore-mouse', (event, ignore, forward = true) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
        win.setIgnoreMouseEvents(ignore, { forward })
    }
  })

  ipcMain.on('reposition-pet', (event, position) => {
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width, height } = primaryDisplay.workAreaSize
    const winWidth = 500
    const winHeight = 500

    if (position === 'center') {
      petWindow?.setBounds({
        x: Math.floor((width / 2) - (winWidth / 2)),
        y: Math.floor((height / 2) - (winHeight / 2)),
        width: winWidth,
        height: winHeight
      })
    } else {
      petWindow?.setBounds({
        x: Math.floor((width / 2) - (winWidth / 2)),
        y: 0,
        width: winWidth,
        height: winHeight
      })
    }
  })

  ipcMain.on('update-pet-config', async (_, config) => {
    await initNativeModules()
    if (store) {
      store.set('petConfig', config)
      trackActivity()
    }
  })

  ipcMain.on('start-session', (_, minutes) => {
    sessionRemainingTime = minutes * 60
    currentSessionTotal = minutes * 60
    distractionWarningRemaining = 0
    isCurrentlyDistracted = false
    trackActivity()
  })

  ipcMain.on('stop-session', () => {
    sessionRemainingTime = 0
    distractionWarningRemaining = 0
    isCurrentlyDistracted = false
    isPenaltyActive = false
    repositionPet('top')
    trackActivity()
  })

  ipcMain.on('toggle-dashboard', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow?.show()
      mainWindow?.focus()
    }
  })

  ipcMain.handle('get-stats', async () => {
    await initNativeModules()
    return store ? store.get('stats') : {}
  })

  createWindow()
  createPetWindow()

  // FAST TIMER: 1-second countdown for smooth session + warning UI
  startFastTimer()

  // SLOW TIMER: Window detection every 1-3 seconds
  setInterval(async () => {
    if (isTracking) return
    isTracking = true
    try {
      await trackActivity()
    } catch (e) {
      console.error(e)
    } finally {
      isTracking = false
    }
  }, 1500) // Check window every 1.5 seconds

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
