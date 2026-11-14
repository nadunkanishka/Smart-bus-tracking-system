import { StyleSheet } from 'react-native';
import { createStyles } from '../shared/themeRuntime';
import { COLORS, SPACE } from '../shared/theme';
import { buildCommon } from '../styles/common';
import { type } from '../shared/ui';

export const useS = createStyles(() => ({
  ...buildCommon(),
  ...StyleSheet.create({
    authRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACE[6], gap: SPACE[3] },
    authSwitch: { ...type('small'), textAlign: 'center', color: COLORS.muted, marginTop: SPACE[6] },
    authSwitchLink: { color: COLORS.accentText, fontWeight: '700' },
    gap16: { height: 16 },
  }),
}));
