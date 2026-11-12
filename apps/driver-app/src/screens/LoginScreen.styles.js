import { StyleSheet } from 'react-native';
import { createStyles } from '../shared/themeRuntime';
import { COLORS, SPACE } from '../shared/theme';
import { type } from '../styles/common';

export const useD = createStyles(() => StyleSheet.create({
  authHelp: { ...type('small'), textAlign: 'center', color: COLORS.muted, marginTop: SPACE[6] },
}));
