import { StyleSheet } from 'react-native';
import { createStyles } from '../shared/themeRuntime';
import { COLORS } from '../shared/theme';
import { buildCommon, type } from '../styles/common';

export const useS = createStyles(() => ({
  ...buildCommon(),
  ...StyleSheet.create({
    authRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 12 },
    authSwitch: { ...type('small'), textAlign: 'center', color: COLORS.muted, marginTop: 24 },
    authSwitchLink: { color: COLORS.accentText, fontWeight: '700' },
    gap16: { height: 16 },
  }),
}));
