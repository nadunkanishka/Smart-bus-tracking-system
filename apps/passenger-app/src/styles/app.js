import { Platform, StyleSheet } from 'react-native';
import { createStyles } from '../shared/themeRuntime';
import { COLORS, SHADOWS } from '../shared/theme';
import { buildCommon } from './common';

export const useS = createStyles(() => ({
  ...buildCommon(),
  ...StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.bg },
    // On desktop the signed-in app is a centred phone-width column, never a stretched mobile screen.
    appShell: {
      flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', overflow: 'hidden',
      backgroundColor: 'transparent',
    },
    centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
  }),
}));
