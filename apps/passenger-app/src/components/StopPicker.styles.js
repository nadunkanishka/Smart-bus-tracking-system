import { StyleSheet } from 'react-native';
import { createStyles } from '../shared/themeRuntime';
import { COLORS, RADII, SPACE } from '../shared/theme';
import { type } from '../shared/ui';

export const useS = createStyles(() => StyleSheet.create({
  stopSelectorCol: { flex: 1, position: 'relative' },
  block: { borderRadius: RADII.lg, padding: SPACE[4], minHeight: 92, justifyContent: 'space-between' },
  blockWhite: { backgroundColor: COLORS.surface },
  blockBlue: { backgroundColor: COLORS.blue },
  stopSelectorLabel: { ...type('overline'), color: COLORS.muted },
  onBlueMuted: { color: COLORS.onBlue, opacity: 0.8 },
  onBlue: { color: COLORS.onBlue },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACE[1] },
  stopSelectorValue: { ...type('h3'), color: COLORS.ink, flex: 1 },
  stopInlineList: {
    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, marginTop: SPACE[2], minWidth: 210,
    backgroundColor: COLORS.card, borderRadius: RADII.lg, overflow: 'hidden', paddingVertical: SPACE[1],
  },
  stopInlineListRight: { left: 'auto', right: 0 },
  stopInlineItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, paddingHorizontal: SPACE[4] },
  stopInlineItemActive: { backgroundColor: COLORS.orange },
  stopInlineText: { ...type('body'), color: COLORS.onCard },
  stopInlineTextActive: { color: COLORS.onBright, fontWeight: '600' },
}));
