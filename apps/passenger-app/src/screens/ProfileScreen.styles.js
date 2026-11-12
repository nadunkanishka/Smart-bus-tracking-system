import { StyleSheet } from 'react-native';
import { createStyles } from '../shared/themeRuntime';
import { COLORS, RADII, SHADOWS } from '../shared/theme';
import { TOP_INSET } from '../constants';
import { buildCommon, type } from '../styles/common';

export const useS = createStyles(() => ({
  ...buildCommon(),
  ...StyleSheet.create({
    profileScroll: { paddingBottom: 120 },
    profileHero: { alignItems: 'center', paddingTop: TOP_INSET + 8 },
    profileAvatar: {
      width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.glassLine,
      alignItems: 'center', justifyContent: 'center', marginBottom: 12, ...SHADOWS.md,
    },
    profileAvatarText: { ...type('display'), color: COLORS.primaryDeep },
    profileName: { ...type('h1'), color: COLORS.ink },
    profileUsername: { ...type('small'), color: COLORS.ink, marginTop: 4 },
    profileCard: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.glassLine, borderRadius: RADII.lg, padding: 20, marginBottom: 16, ...SHADOWS.sm },
    profileCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    profileCardTitle: { ...type('h3'), color: COLORS.ink, marginBottom: 4 },
    profileCardTitleFlat: { ...type('h3'), color: COLORS.ink },
    profileBtn: { marginBottom: 12 },
  }),
}));
