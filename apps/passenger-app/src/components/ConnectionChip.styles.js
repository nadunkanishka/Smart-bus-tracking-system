import { StyleSheet } from 'react-native';
import { COLORS, RADII } from '../shared/theme';
import { type } from '../styles/common';

export const S = StyleSheet.create({
  liveChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.ink, paddingHorizontal: 12, paddingVertical: 4, borderRadius: RADII.pill,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent },
  liveText: { ...type('overline'), color: COLORS.white },
  liveChipOff: { backgroundColor: COLORS.muted },
  liveDotOff: { backgroundColor: COLORS.mutedLight },
});
