import { StyleSheet } from 'react-native';
import { createStyles } from '../shared/themeRuntime';
import { COLORS, RADII, SHADOWS, SPACE } from '../shared/theme';
import { TOP_INSET } from '../constants';
import { buildCommon, type } from '../styles/common';

export const useD = createStyles(() => ({
  ...buildCommon(),
  ...StyleSheet.create({
    dispatchCard: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE[3],
      backgroundColor: COLORS.surfaceSoft, borderRadius: RADII.md, padding: SPACE[3],
    },
    dispatchCardSpaced: { backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassLine, marginBottom: SPACE[4], padding: SPACE[4], borderRadius: RADII.lg, ...SHADOWS.sm },
    dispatchLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: SPACE[3] },
    dispatchCardAvatar: {
      width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primarySoft,
      alignItems: 'center', justifyContent: 'center',
    },
    dispatchCardAvatarText: { ...type('smallBold'), color: COLORS.primaryDeep },
    dispatchCardName: { ...type('smallBold'), color: COLORS.ink },
    dispatchCardRole: { ...type('caption'), color: COLORS.muted, marginTop: 2 },
    dispatchBtns: { flexDirection: 'row', gap: SPACE[2] },
    profileHero: { alignItems: 'center', paddingTop: TOP_INSET + 8 },
    profileAvatar: {
      width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassLine,
      alignItems: 'center', justifyContent: 'center', marginBottom: SPACE[3], ...SHADOWS.md,
    },
    profileGear: { position: 'absolute', right: 0, top: TOP_INSET + 4, zIndex: 2 },
    profileAvatarText: { ...type('h1'), color: COLORS.primaryDeep },
    profileName: { ...type('h1'), color: COLORS.ink },
    profileSub: { ...type('small'), color: COLORS.ink, marginTop: SPACE[1] },
    profileCardTitle: { ...type('h3'), color: COLORS.ink, marginBottom: SPACE[1] },
    profileCardTitleFlat: { ...type('h3'), color: COLORS.ink },
    profileCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  }),
}));
