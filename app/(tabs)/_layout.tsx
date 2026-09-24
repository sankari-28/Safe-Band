import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Camera, Clock, User, ShieldAlert, Users, Activity, Bell } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function TabsLayout() {
  const { colors } = useTheme();
  const { role } = useAuth();

  const isWorker = role === 'worker' || !role;
  const isSafetyOfficer = role === 'safetyOfficer';
  const isAdmin = role === 'admin';

  const activeBgColor = colors.isDark ? '#3A2A1E' : '#FFF1E6';

  const renderIcon = (IconComponent: any, focused: boolean, color: any) => (
    <View
      style={[
        styles.iconContainer,
        {
          backgroundColor: focused ? activeBgColor : 'transparent',
          borderColor: focused ? (colors.isDark ? '#5C3A24' : '#FFE8D6') : 'transparent',
        },
      ]}
    >
      <IconComponent size={20} color={focused ? colors.primaryOrange : color} />
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          height: 68,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.primaryOrange,
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
      }}
    >
      {/* 1. HOME / DASHBOARD (Common to all roles) */}
      <Tabs.Screen
        name="index"
        options={{
          title: isWorker ? 'Home' : 'Dashboard',
          tabBarIcon: ({ focused, color }) => renderIcon(Home, focused, color),
        }}
      />

      {/* SCAN TAB (Available to all roles) */}
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          href: '/(tabs)/scan',
          tabBarIcon: ({ focused, color }) => renderIcon(Camera, focused, color),
        }}
      />

      {/* HISTORY TAB (Available to all roles) */}
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          href: '/(tabs)/history',
          tabBarIcon: ({ focused, color }) => renderIcon(Clock, focused, color),
        }}
      />

      {/* SAFETY OFFICER SPECIFIC TABS */}
      <Tabs.Screen
        name="workers"
        options={{
          title: 'Workers',
          href: isSafetyOfficer ? '/(tabs)/workers' : null,
          tabBarIcon: ({ focused, color }) => renderIcon(Users, focused, color),
        }}
      />

      <Tabs.Screen
        name="high-risk"
        options={{
          title: 'High Risk',
          href: isSafetyOfficer ? '/(tabs)/high-risk' : null,
          tabBarIcon: ({ focused, color }) => renderIcon(ShieldAlert, focused, color),
        }}
      />

      {/* ADMIN SPECIFIC TABS */}
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          href: isAdmin ? '/(tabs)/users' : null,
          tabBarIcon: ({ focused, color }) => renderIcon(Users, focused, color),
        }}
      />

      <Tabs.Screen
        name="exposure-overview"
        options={{
          title: 'Overview',
          href: isAdmin ? '/(tabs)/exposure-overview' : null,
          tabBarIcon: ({ focused, color }) => renderIcon(Activity, focused, color),
        }}
      />

      {/* NOTIFICATIONS (Accessible via top header bell icon popover) */}
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          href: null,
          tabBarIcon: ({ focused, color }) => renderIcon(Bell, focused, color),
        }}
      />

      {/* PROFILE (Common to all roles) */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => renderIcon(User, focused, color),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
