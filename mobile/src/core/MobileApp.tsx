import { StatusBar } from 'expo-status-bar'

import { AppNavigator } from './navigation/AppNavigator'
import { AppProviders } from './providers/AppProviders'

export function MobileApp() {
  return (
    <AppProviders>
      <StatusBar style="light" />
      <AppNavigator />
    </AppProviders>
  )
}
