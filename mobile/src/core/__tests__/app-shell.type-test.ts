import type { AppTabParamList } from '../navigation/types'
import { AppNavigator } from '../navigation/AppNavigator'
import { HomeScreen } from '../../features/home/screens/HomeScreen'
import { MessagesScreen } from '../../features/messages/screens/MessagesScreen'
import { CallsScreen } from '../../features/calls/screens/CallsScreen'
import { SettingsScreen } from '../../features/settings/screens/SettingsScreen'

const routes: Array<keyof AppTabParamList> = ['Home', 'Messages', 'Calls', 'Settings']

void AppNavigator
void HomeScreen
void MessagesScreen
void CallsScreen
void SettingsScreen
void routes
