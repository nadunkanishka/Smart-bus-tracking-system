import { StyleSheet } from 'react-native';
import { COLORS, TYPE } from '../shared/theme';
import { FONT } from '../shared/ui';

// CHANGED: every value comes from shared tokens (COLORS / RADII / SHADOWS / TYPE); spacing is on the 4px scale.
export const type = (role, extra) => ({ ...TYPE[role], ...FONT, ...extra });

// Styles used by more than one screen.
export const common = StyleSheet.create({
  flex: { flex: 1 },
  link: { ...type('smallBold'), color: COLORS.accentText },
  linkTap: { minHeight: 44, justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 24, gap: 4 },
  emptyStateTitle: { ...type('h3'), color: COLORS.ink, marginTop: 16 },
  emptyStateSub: { ...type('small'), color: COLORS.muted },
  emptyBtn: { marginTop: 12, alignSelf: 'center' },
});
