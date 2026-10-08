import { StyleSheet } from 'react-native';
import { COLORS, RADII, SHADOWS } from '../shared/theme';
import { type } from '../styles/common';

export const S = StyleSheet.create({
  stopSelectorCol: { flex: 1, position: 'relative' },
  stopSelectorHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  stopSelectorLabel: { ...type('overline'), color: COLORS.muted },
  stopSelectorBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceSoft, borderRadius: RADII.sm, paddingHorizontal: 12, minHeight: 44,
  },
  stopSelectorValue: { ...type('smallBold'), color: COLORS.ink, flex: 1, marginRight: 4 },
  stopInlineList: {
    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, marginTop: 8,
    backgroundColor: COLORS.surface, borderRadius: RADII.md, overflow: 'hidden', minWidth: 190,
    ...SHADOWS.lg,
  },
  stopInlineListRight: { left: 'auto', right: 0 },
  stopInlineItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    minHeight: 44, paddingHorizontal: 16,
  },
  stopInlineItemActive: { backgroundColor: COLORS.accentSoft },
  stopInlineText: { ...type('small'), color: COLORS.ink },
  stopInlineTextActive: { color: COLORS.accentText, fontWeight: '700' },
});
