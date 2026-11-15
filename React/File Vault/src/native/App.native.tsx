import React from 'react';
import { StatusBar, StyleSheet, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CloudVaultScreen from './screens/CloudVaultScreen.native';
import UploadsTransferScreen from './screens/UploadsTransferScreen.native';
import MediaInspectorScreen from './screens/MediaInspectorScreen.native';
import SecurityAnalyticsScreen from './screens/SecurityAnalyticsScreen.native';
import DocumentScannerScreen from './screens/DocumentScannerScreen.native';
import DocumentCropReviewScreen from './screens/DocumentCropReviewScreen.native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Design tokens
const THEME = {
  primary: '#001026',
  primaryContainer: '#0b2545',
  secondary: '#395f95',
  tertiaryContainer: '#002b1b',
  tertiaryFixed: '#85f8c4',
  surface: '#f7f9ff',
  surfaceCard: '#ffffff',
  outline: '#74777f',
  emerald: '#059669',
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: 'rgba(116, 119, 127, 0.2)',
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 8,
        },
        tabBarActiveTintColor: THEME.primary,
        tabBarInactiveTintColor: THEME.outline,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Files"
        component={CloudVaultScreen}
        options={{
          tabBarLabel: 'Files',
        }}
      />
      <Tab.Screen
        name="Uploads"
        component={UploadsTransferScreen}
        options={{
          tabBarLabel: 'Uploads',
          tabBarBadge: 3,
          tabBarBadgeStyle: {
            backgroundColor: THEME.secondary,
            fontSize: 10,
          },
        }}
      />
      <Tab.Screen
        name="Inspector"
        component={MediaInspectorScreen}
        options={{
          tabBarLabel: 'Inspector',
        }}
      />
      <Tab.Screen
        name="Security"
        component={SecurityAnalyticsScreen}
        options={{
          tabBarLabel: 'Security',
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNative() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f9ff" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
          name="DocumentScanner"
          component={DocumentScannerScreen}
          options={{
            animation: 'slide_from_bottom',
            navigationBarHidden: true,
          }}
        />
        <Stack.Screen
          name="DocumentCropReview"
          component={DocumentCropReviewScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

