export interface IElectronAPI {
  // Add electron-toolkit/preload methods if needed
}

export interface ICompanionAPI {
  setIgnoreMouse: (ignore: boolean, forward?: boolean) => void
  onActivityUpdate: (callback: (data: any) => void) => () => void
}

declare global {
  interface Window {
    electron: IElectronAPI
    api: ICompanionAPI
  }
}
