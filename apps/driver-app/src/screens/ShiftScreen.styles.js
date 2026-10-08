import { StyleSheet } from 'react-native';
import { COLORS, RADII, SHADOWS } from '../shared/theme';
import { common, type } from '../styles/common';

export const D = {
  ...common,
  ...StyleSheet.create({
    dutyBtn: { minHeight: 220, borderRadius: RADII.xl, alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16, padding: 24, ...SHADOWS.md },
    dutyBtnOn: { backgroundColor: COLORS.success },
    dutyBtnOff: { backgroundColor: COLORS.ink },
    dutyBtnDisabled: { opacity: 0.5 },
    dutyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    dutyState: { ...type('display'), color: COLORS.white, letterSpacing: 1 },
    dutyHint: { ...type('body'), color: COLORS.white },
    dutyNote: { ...type('small'), color: COLORS.warning, marginBottom: 16 },
    specsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  }),
};
