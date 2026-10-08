import { Platform, StatusBar } from 'react-native';
import { initialWindowMetrics } from 'react-native-safe-area-context';

export const DISPATCH_PHONE = process.env.EXPO_PUBLIC_DISPATCH_PHONE || '+94 11 248 7700';

export const MAX_LOG_ITEMS = 8;

export const MAP_PADDING = { top: 24, bottom: 24 };

// Android draws edge to edge: StatusBar.currentHeight reads 0 there, so use the real safe-area inset.
export const TOP_INSET = Platform.OS === 'android' ? (initialWindowMetrics?.insets.top ?? StatusBar.currentHeight ?? 0) : 0;
