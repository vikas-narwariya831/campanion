import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  setIgnoreMouse: (ignore: boolean, forward?: boolean) => ipcRenderer.send('set-ignore-mouse', ignore, forward),
  onActivityUpdate: (callback: (data: any) => void) => {
    const listener = (_event: any, data: any) => callback(data)
    ipcRenderer.on('activity-update', listener)
    return () => ipcRenderer.removeListener('activity-update', listener)
  },
  updatePetConfig: (config: any) => ipcRenderer.send('update-pet-config', config),
  startSession: (minutes: number) => ipcRenderer.send('start-session', minutes),
  stopSession: () => ipcRenderer.send('stop-session'),
  toggleDashboard: () => ipcRenderer.send('toggle-dashboard')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in d.ts)
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
