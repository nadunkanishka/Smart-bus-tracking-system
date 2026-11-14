import { StyleSheet } from 'react-native';
import { createStyles } from '../shared/themeRuntime';
import { COLORS } from '../shared/theme';

// The root frame and column come from shared/shell; this is only the boot screen.
export const useS = createStyles(() => StyleSheet.create({
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
}));
