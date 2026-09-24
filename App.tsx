import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SplitScreen from './screens/SplitScreen';
import HistoryScreen from './screens/HistoryScreen';
import StatusScreen from './screens/StatusScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              if (route.name === 'Split') {
                iconName = focused ? 'camera' : 'camera-outline';
              } else if (route.name === 'History') {
                iconName = focused ? 'list' : 'list-outline';
              } else if (route.name === 'Status') {
                iconName = focused ? 'cash' : 'cash-outline';
              }
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#007AFF',
            tabBarInactiveTintColor: '#8E8E93',
            headerShown: true,
          })}
        >
          <Tab.Screen
            name="Split"
            component={SplitScreen}
            options={{ title: 'Split Bill' }}
          />
          <Tab.Screen
            name="History"
            component={HistoryScreen}
            options={{ title: 'Split History' }}
          />
          <Tab.Screen
            name="Status"
            component={StatusScreen}
            options={{ title: 'Payment Status' }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
