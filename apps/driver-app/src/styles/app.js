import { Platform, StyleSheet } from 'react-native';
import { COLORS, SHADOWS } from '../shared/theme';
import { common } from './common';

export const D = {
  ...common,
  ...StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.bg },
    appShell: {
      flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', overflow: 'hidden',
      backgroundColor: COLORS.bg, ...(Platform.OS === 'web' ? SHADOWS.lg : null),
    },
  }),
};
