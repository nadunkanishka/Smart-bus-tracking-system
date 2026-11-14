import { StyleSheet } from 'react-native';
import { createStyles } from '../shared/themeRuntime';
import { COLORS, RADII, SHADOWS, SPACE } from '../shared/theme';
import { type } from '../shared/ui';

export const useS = createStyles(() => StyleSheet.create({
  stopSelectorCol: { flex: 1, position: 'relative' },
  stopSelectorHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2], marginBottom: SPACE[1] },
  stopSelectorLabel: { ...type('overline'), color: COLORS.muted },
  stopSelectorBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceSoft, borderRadius: RADII.sm, paddingHorizontal: SPACE[3], minHeight: 44,
  },
  stopSelectorValue: { ...type('smallBold'), color: COLORS.ink, flex: 1, marginRight: SPACE[1] },
  stopInlineList: {
    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, marginTop: SPACE[2],
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.glassLine, borderRadius: RADII.md, overflow: 'hidden', minWidth: 190,
    ...SHADOWS.lg,
  },
  stopInlineListRight: { left: 'auto', right: 0 },
  stopInlineItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    minHeight: 44, paddingHorizontal: SPACE[4],
  },
  stopInlineItemActive: { backgroundColor: COLORS.accentSoft },
  stopInlineText: { ...type('small'), color: COLORS.ink },
  stopInlineTextActive: { color: COLORS.accentText, fontWeight: '700' },
}));
