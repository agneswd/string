import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

function getWebStorage() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null
  }

  return window.localStorage
}

export async function getStoredValue(key: string) {
  if (Platform.OS === 'web') {
    return getWebStorage()?.getItem(key) ?? null
  }

  if (typeof SecureStore.getItemAsync === 'function') {
    return SecureStore.getItemAsync(key)
  }

  return getWebStorage()?.getItem(key) ?? null
}

export async function setStoredValue(key: string, value: string) {
  if (Platform.OS === 'web') {
    getWebStorage()?.setItem(key, value)
    return
  }

  if (typeof SecureStore.setItemAsync === 'function') {
    await SecureStore.setItemAsync(key, value)
    return
  }

  getWebStorage()?.setItem(key, value)
}

export async function deleteStoredValue(key: string) {
  if (Platform.OS === 'web') {
    getWebStorage()?.removeItem(key)
    return
  }

  if (typeof SecureStore.deleteItemAsync === 'function') {
    await SecureStore.deleteItemAsync(key)
    return
  }

  getWebStorage()?.removeItem(key)
}
