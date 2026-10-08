import { Platform, StyleSheet } from 'react-native';
import { COLORS, SHADOWS } from '../shared/theme';
import { common } from './common';

export const S = {
  ...common,
  ...StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.bg },
    // On desktop the signed-in app is a centred phone-width column, never a stretched mobile screen.
    appShell: {
      flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', overflow: 'hidden',
      backgroundColor: COLORS.bg, ...(Platform.OS === 'web' ? SHADOWS.lg : null),
    },
    centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
  }),
};
