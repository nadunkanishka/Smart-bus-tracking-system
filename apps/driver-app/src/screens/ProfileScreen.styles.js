import { StyleSheet } from 'react-native';
import { createStyles } from '../shared/themeRuntime';
import { COLORS, SHADOWS, SPACE } from '../shared/theme';
import { TOP_INSET } from '../constants';
import { buildCommon, type } from '../styles/common';

export const useD = createStyles(() => ({
  ...buildCommon(),
  ...StyleSheet.create({
    profileHero: { alignItems: 'center', paddingTop: TOP_INSET + 8 },
    profileAvatar: {
      width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassLine,
      alignItems: 'center', justifyContent: 'center', marginBottom: SPACE[3], ...SHADOWS.md,
    },
    profileGear: { position: 'absolute', right: 0, top: TOP_INSET + 4, zIndex: 2 },
    profileAvatarText: { ...type('h1'), color: COLORS.primaryDeep },
    profileName: { ...type('h1'), color: COLORS.ink },
    profileSub: { ...type('small'), color: COLORS.ink, marginTop: SPACE[1] },
  }),
}));
