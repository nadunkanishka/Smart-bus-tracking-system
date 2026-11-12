import { StyleSheet } from 'react-native';
import { createStyles } from '../shared/themeRuntime';
import { COLORS } from '../shared/theme';
import { TOP_INSET } from '../constants';
import { buildCommon, type } from '../styles/common';

export const useD = createStyles(() => ({
  ...buildCommon(),
  ...StyleSheet.create({
    settingsScroll: { paddingBottom: 132 },
    settingsHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: TOP_INSET },
    settingsTitle: { ...type('h1'), color: COLORS.ink },
    settingsPad: { padding: 12 },
  }),
}));
