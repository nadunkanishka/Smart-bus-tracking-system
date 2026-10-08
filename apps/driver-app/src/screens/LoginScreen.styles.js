import { StyleSheet } from 'react-native';
import { COLORS } from '../shared/theme';
import { type } from '../styles/common';

export const D = StyleSheet.create({
  authHelp: { ...type('small'), textAlign: 'center', color: COLORS.muted, marginTop: 24 },
});
