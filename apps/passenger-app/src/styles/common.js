import { StyleSheet } from 'react-native';
import { COLORS, SPACE } from '../shared/theme';
import { type } from '../shared/ui';
import { COMMON_STYLES } from '../shared/shell';

// Styles used by more than one screen.
export const buildCommon = () => StyleSheet.create({
  ...COMMON_STYLES,
  link: { ...type('smallBold'), color: COLORS.accentText },
  linkTap: { minHeight: 44, justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: SPACE[6], gap: SPACE[1] },
  emptyStateTitle: { ...type('h3'), color: COLORS.ink, marginTop: SPACE[4] },
  emptyStateSub: { ...type('small'), color: COLORS.muted },
  emptyBtn: { marginTop: SPACE[3], alignSelf: 'center' },
});
