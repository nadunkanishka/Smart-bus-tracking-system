import { StyleSheet } from 'react-native';
import { createStyles } from '../shared/themeRuntime';
import { COLORS, RADII, SPACE } from '../shared/theme';
import { type } from '../styles/common';

export const useS = createStyles(() => StyleSheet.create({
  liveChip: {
    flexDirection: 'row', alignItems: 'center', gap: SPACE[1],
    backgroundColor: COLORS.ink, paddingHorizontal: SPACE[3], paddingVertical: SPACE[1], borderRadius: RADII.pill,
  },
  liveText: { ...type('overline'), color: COLORS.white },
  liveChipOff: { backgroundColor: COLORS.muted },
}));
