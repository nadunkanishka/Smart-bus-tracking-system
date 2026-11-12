import { StyleSheet } from 'react-native';
import { createStyles } from '../shared/themeRuntime';
import { COLORS, RADII, SHADOWS } from '../shared/theme';
import { buildCommon, type } from '../styles/common';

export const useD = createStyles(() => ({
  ...buildCommon(),
  ...StyleSheet.create({
    dutyBtn: { minHeight: 220, borderRadius: RADII.xl, alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16, padding: 24, ...SHADOWS.md },
    dutyBtnOn: { backgroundColor: COLORS.green }, // on duty: green, the status colour (text on it is always dark)
    dutyBtnOff: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.glassLine },
    dutyBtnDisabled: { opacity: 0.5 },
    dutyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.orange, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    dutyIconOn: { backgroundColor: COLORS.onBright },
    dutyTextOn: { color: COLORS.onBright },
    dutyState: { ...type('display'), color: COLORS.ink, letterSpacing: 1 },
    dutyHint: { ...type('body'), color: COLORS.muted },
    dutyNote: { ...type('small'), color: COLORS.warning, marginBottom: 16 },
    specsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  }),
}));
