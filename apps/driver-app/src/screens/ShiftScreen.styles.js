import { StyleSheet } from 'react-native';
import { createStyles } from '../shared/themeRuntime';
import { COLORS, RADII, SHADOWS } from '../shared/theme';
import { buildCommon, type } from '../styles/common';

export const useD = createStyles(() => ({
  ...buildCommon(),
  ...StyleSheet.create({
    dutyBtn: { minHeight: 220, borderRadius: RADII.xl, alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16, padding: 24, ...SHADOWS.md },
    dutyBtnOn: { backgroundColor: COLORS.lime }, // on duty: lime, the brand's "live" colour (text on it is always dark)
    dutyBtnOff: { backgroundColor: COLORS.ink },
    dutyBtnDisabled: { opacity: 0.5 },
    dutyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    dutyIconOn: { backgroundColor: COLORS.onBright },
    dutyTextOn: { color: COLORS.onBright },
    dutyState: { ...type('display'), color: COLORS.white, letterSpacing: 1 },
    dutyHint: { ...type('body'), color: COLORS.white },
    dutyNote: { ...type('small'), color: COLORS.warning, marginBottom: 16 },
    specsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  }),
}));
