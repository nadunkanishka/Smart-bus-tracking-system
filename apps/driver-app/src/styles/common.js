import { StyleSheet } from 'react-native';
import { COLORS, RADII, SHADOWS, TYPE, SPACE } from '../shared/theme';
import { FONT } from '../shared/ui';
import { TOP_INSET } from '../constants';

export const type = (role, extra) => ({ ...TYPE[role], ...FONT, ...extra });

// Styles used by more than one screen.
export const buildCommon = () => StyleSheet.create({
  flex: { flex: 1 },
  routeScroll: { paddingBottom: 120 },
  screenTitle: { ...type('display'), fontWeight: '500', color: COLORS.ink, paddingTop: TOP_INSET },
  screenSubHeader: { ...type('small'), color: COLORS.muted, marginTop: SPACE[1] },
  sectionLabel: { ...type('overline'), color: COLORS.muted, textTransform: 'uppercase', marginTop: SPACE[6], marginBottom: SPACE[3] },
  emptyLogBox: { alignItems: 'center', paddingVertical: SPACE[6], gap: SPACE[2] },
  emptyLog: { ...type('small'), color: COLORS.muted, textAlign: 'center' },
  profileCard: { backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassLine, borderRadius: RADII.lg, padding: SPACE[5], marginBottom: SPACE[4], ...SHADOWS.sm },
});
