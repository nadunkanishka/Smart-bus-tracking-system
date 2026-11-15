import { StyleSheet } from 'react-native';
import { createStyles } from '../shared/themeRuntime';
import { COLORS, RADII, SHADOWS, SPACE } from '../shared/theme';

export const useS = createStyles(() => StyleSheet.create({
  profileCard: { backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassLine, borderRadius: RADII.lg, padding: SPACE[5], marginBottom: SPACE[4], ...SHADOWS.sm },
  profileBtn: { marginBottom: SPACE[3] },
}));
