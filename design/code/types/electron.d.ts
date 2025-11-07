import type { api } from '../../preload'

export type ElectronAPI = typeof api

declare global {
  interface Window {
    electron: ElectronAPI
  }
}

export {}
