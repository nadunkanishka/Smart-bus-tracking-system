import { StyleSheet } from 'react-native';
import { COLORS, RADII, SHADOWS, TYPE } from '../shared/theme';
import { FONT } from '../shared/ui';
import { TOP_INSET } from '../constants';

// CHANGED: every value comes from shared tokens (COLORS / RADII / SHADOWS / TYPE); spacing is on the 4px scale.
export const type = (role, extra) => ({ ...TYPE[role], ...FONT, ...extra });

// Styles used by more than one screen.
export const common = StyleSheet.create({
  flex: { flex: 1 },
  routeScroll: { paddingBottom: 120 },
  screenTitle: { ...type('h1'), color: COLORS.ink, paddingTop: TOP_INSET },
  screenSubHeader: { ...type('small'), color: COLORS.ink, marginTop: 4, maxWidth: '60%' },
  headerBus: { position: 'absolute', right: 12, bottom: 34 },
  sectionLabel: { ...type('overline'), color: COLORS.muted, textTransform: 'uppercase', marginTop: 24, marginBottom: 12 },
  emptyLogBox: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyLog: { ...type('small'), color: COLORS.muted, textAlign: 'center' },
  profileCard: { backgroundColor: COLORS.surface, borderRadius: RADII.lg, padding: 20, marginBottom: 16, ...SHADOWS.sm },
});
