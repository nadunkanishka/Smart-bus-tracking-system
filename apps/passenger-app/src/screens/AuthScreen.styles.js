import { StyleSheet } from 'react-native';
import { COLORS } from '../shared/theme';
import { common, type } from '../styles/common';

export const S = {
  ...common,
  ...StyleSheet.create({
    authRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 12 },
    authSwitch: { ...type('small'), textAlign: 'center', color: COLORS.muted, marginTop: 24 },
    authSwitchLink: { color: COLORS.accentText, fontWeight: '700' },
    gap16: { height: 16 },
  }),
};
