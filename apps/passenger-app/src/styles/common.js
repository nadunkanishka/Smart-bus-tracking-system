import { StyleSheet } from 'react-native';
import { COLORS, TYPE, SPACE } from '../shared/theme';
import { FONT } from '../shared/ui';

export const type = (role, extra) => ({ ...TYPE[role], ...FONT, ...extra });

// Styles used by more than one screen.
export const buildCommon = () => StyleSheet.create({
  flex: { flex: 1 },
  link: { ...type('smallBold'), color: COLORS.accentText },
  linkTap: { minHeight: 44, justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: SPACE[6], gap: SPACE[1] },
  emptyStateTitle: { ...type('h3'), color: COLORS.ink, marginTop: SPACE[4] },
  emptyStateSub: { ...type('small'), color: COLORS.muted },
  emptyBtn: { marginTop: SPACE[3], alignSelf: 'center' },
});
