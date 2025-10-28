import { registerPlugin } from "@capacitor/core"

export interface WifiPluginInterface {
  scanNetworks(): Promise<{ networks: WifiNetwork[] }>
  requestPermissions(): Promise<{ granted: boolean }>
}

export interface WifiNetwork {
  SSID: string
  BSSID: string
  level: number
  frequency: number
}

export const WifiPlugin = registerPlugin<WifiPluginInterface>("WifiPlugin")
