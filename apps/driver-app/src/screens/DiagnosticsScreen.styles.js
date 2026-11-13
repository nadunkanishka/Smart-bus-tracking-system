import { StyleSheet } from 'react-native';
import { createStyles } from '../shared/themeRuntime';
import { COLORS, RADII, SHADOWS, SPACE } from '../shared/theme';
import { buildCommon, type } from '../styles/common';

export const useD = createStyles(() => ({
  ...buildCommon(),
  ...StyleSheet.create({
    sectionLabelFlat: { ...type('overline'), color: COLORS.muted, textTransform: 'uppercase', marginBottom: SPACE[2] },
    metricsRow: { flexDirection: 'row', gap: SPACE[3], marginBottom: SPACE[3] },
    metricCard: { flex: 1, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassLine, borderRadius: RADII.lg, padding: SPACE[5], gap: SPACE[1], ...SHADOWS.sm },
    metricValSm: { ...type('h2') },
    ringCard: { alignItems: 'center', justifyContent: 'center', gap: SPACE[3], paddingVertical: SPACE[5] },
    ringValue: { ...type('display'), color: COLORS.ink, letterSpacing: -0.5 },
    gpsBox: { width: 116, height: 116, alignItems: 'center', justifyContent: 'center' },
    metricUnit: { ...type('small'), color: COLORS.muted },
    metricLabel: { ...type('small'), color: COLORS.muted },
    gpsStatusDot: { width: 12, height: 12, borderRadius: 6 },
    coordCard: { backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassLine, borderRadius: RADII.lg, padding: SPACE[5], ...SHADOWS.sm },
    coordText: { ...type('h2'), color: COLORS.ink, fontVariant: ['tabular-nums'] },
    logCard: { backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassLine, borderRadius: RADII.lg, paddingHorizontal: SPACE[5], paddingVertical: SPACE[2], ...SHADOWS.sm },
    logRow: { minHeight: 44, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.line },
    logRowLast: { borderBottomWidth: 0 },
    logText: { ...type('small'), color: COLORS.inkSoft, fontVariant: ['tabular-nums'] },
  }),
}));
