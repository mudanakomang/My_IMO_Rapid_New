import { Ionicons } from '@expo/vector-icons';

export const HomeTabIcon = ({ focused, tintColor }) => (
    focused ? 
    <Ionicons name="home" size={24} color={tintColor} /> :
    <Ionicons name="home-outline" size={24} color={tintColor} />
);

export const NotificationTabIcon = ({ focused, tintColor }) => (
    focused ?
    <Ionicons name="notifications" size={24} color={tintColor} /> :
    <Ionicons name="notifications-outline" size={24} color={tintColor} />
);

export const MoreTabIcon = ({ focused, tintColor }) => (
    <Ionicons name="menu" size={24} color={tintColor} />
);

export const StatsTabIcon = ({ focused, tintColor }) => (
    <Ionicons name="stats-chart" size={24} color={tintColor} />
);
