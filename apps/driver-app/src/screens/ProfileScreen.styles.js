import { StyleSheet } from 'react-native';
import { COLORS, RADII, SHADOWS } from '../shared/theme';
import { TOP_INSET } from '../constants';
import { common, type } from '../styles/common';

export const D = {
  ...common,
  ...StyleSheet.create({
    dispatchCard: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      backgroundColor: COLORS.surfaceSoft, borderRadius: RADII.md, padding: 12,
    },
    dispatchCardSpaced: { backgroundColor: COLORS.surface, marginBottom: 16, padding: 16, borderRadius: RADII.lg, ...SHADOWS.sm },
    dispatchLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
    dispatchCardAvatar: {
      width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primarySoft,
      alignItems: 'center', justifyContent: 'center',
    },
    dispatchCardAvatarText: { ...type('smallBold'), color: COLORS.primaryDeep },
    dispatchCardName: { ...type('smallBold'), color: COLORS.ink },
    dispatchCardRole: { ...type('caption'), color: COLORS.muted, marginTop: 2 },
    dispatchBtns: { flexDirection: 'row', gap: 8 },
    profileHero: { alignItems: 'center', paddingTop: TOP_INSET + 8 },
    profileAvatar: {
      width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.surface,
      alignItems: 'center', justifyContent: 'center', marginBottom: 12, ...SHADOWS.md,
    },
    profileAvatarText: { ...type('h1'), color: COLORS.primaryDeep },
    profileName: { ...type('h1'), color: COLORS.ink },
    profileSub: { ...type('small'), color: COLORS.ink, marginTop: 4 },
    profileCardTitle: { ...type('h3'), color: COLORS.ink, marginBottom: 4 },
  }),
};
