import { StyleSheet } from 'react-native';
import { createStyles } from '../shared/themeRuntime';
import { COLORS, RADII, SPACE } from '../shared/theme';
import { type } from '../styles/common';

export const useS = createStyles(() => StyleSheet.create({
  liveChip: {
    flexDirection: 'row', alignItems: 'center', gap: SPACE[1],
    backgroundColor: COLORS.ink, paddingHorizontal: SPACE[3], paddingVertical: SPACE[1], borderRadius: RADII.pill,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.green },
  liveText: { ...type('overline'), color: COLORS.white },
  liveChipOff: { backgroundColor: COLORS.muted },
  liveDotOff: { backgroundColor: COLORS.mutedLight },
}));
