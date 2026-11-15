import { StyleSheet } from 'react-native';
import { createStyles } from '../shared/themeRuntime';
import { COLORS, RADII, SHADOWS, SPACE } from '../shared/theme';
import { buildCommon } from '../styles/common';
import { type } from '../shared/ui';

export const useD = createStyles(() => ({
  ...buildCommon(),
  ...StyleSheet.create({
    dutyBtn: { minHeight: 220, borderRadius: RADII.xl, alignItems: 'center', justifyContent: 'center', gap: SPACE[2], marginBottom: SPACE[4], padding: SPACE[6], ...SHADOWS.md },
    dutyBtnOn: { backgroundColor: COLORS.orange }, // on duty: the orange card (text on it is always dark)
    dutyBtnOff: { backgroundColor: COLORS.card },
    dutyBtnDisabled: { opacity: 0.5 },
    dutyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.orange, alignItems: 'center', justifyContent: 'center', marginBottom: SPACE[2] },
    titleBold: { fontWeight: '800' },
    dutyIconOn: { backgroundColor: COLORS.onBright },
    dutyTextOn: { color: COLORS.onBright },
    dutyState: { ...type('display'), color: COLORS.onCard, letterSpacing: 0.5 },
    dutyHint: { ...type('body'), color: COLORS.cardMuted },
    dutyNote: { ...type('small'), color: COLORS.warning, marginBottom: SPACE[4] },
    specsRow: { flexDirection: 'row', gap: SPACE[3], marginBottom: SPACE[4] },
  }),
}));
