import { StyleSheet } from 'react-native';
import { COLORS } from '../shared/theme';
import { type } from '../styles/common';

export const S = StyleSheet.create({
  profileRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16,
    minHeight: 48, borderBottomWidth: 1, borderBottomColor: COLORS.line,
  },
  profileRowLast: { borderBottomWidth: 0 },
  profileRowLabel: { ...type('small'), color: COLORS.muted, flexShrink: 0 },
  profileRowValue: { ...type('smallBold'), color: COLORS.ink, flexShrink: 1, textAlign: 'right' },
  profileRowValueAccent: { color: COLORS.accentText },
});
