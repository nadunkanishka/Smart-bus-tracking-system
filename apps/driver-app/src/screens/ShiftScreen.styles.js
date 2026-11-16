import { StyleSheet } from 'react-native';
import { createStyles } from '../shared/themeRuntime';
import { COLORS, RADII, SPACE } from '../shared/theme';
import { buildCommon } from '../styles/common';
import { type } from '../shared/ui';

export const useD = createStyles(() => ({
  ...buildCommon(),
  ...StyleSheet.create({
    dutyBtn: { minHeight: 220, borderRadius: RADII.xl, alignItems: 'center', justifyContent: 'center', gap: SPACE[2], marginBottom: SPACE[4], padding: SPACE[6], borderWidth: 1, borderColor: COLORS.glassLine },
    dutyBtnOn: { backgroundColor: COLORS.card, borderColor: COLORS.card }, // on duty: the black card
    dutyBtnOff: { backgroundColor: COLORS.surface }, // off duty: the white card
    dutyBtnDisabled: { opacity: 0.5 },
    dutyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primaryStrong, alignItems: 'center', justifyContent: 'center', marginBottom: SPACE[2] },
    titleBold: { fontWeight: '800' },
    dutyIconOn: { backgroundColor: COLORS.onCard },
    dutyTextOn: { color: COLORS.onCard },
    dutyState: { ...type('display'), color: COLORS.ink, letterSpacing: 0.5 },
    dutyHint: { ...type('body'), color: COLORS.muted },
    dutyNote: { ...type('small'), color: COLORS.warning, marginBottom: SPACE[4] },
    specsRow: { flexDirection: 'row', gap: SPACE[3], marginBottom: SPACE[4] },
  }),
}));
