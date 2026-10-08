import { StyleSheet } from 'react-native';
import { COLORS, RADII, SHADOWS } from '../shared/theme';
import { common, type } from '../styles/common';

export const D = {
  ...common,
  ...StyleSheet.create({
    sectionLabelFlat: { ...type('overline'), color: COLORS.muted, textTransform: 'uppercase', marginBottom: 8 },
    metricsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    metricCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADII.lg, padding: 20, gap: 4, ...SHADOWS.sm },
    metricIcon: { width: 44, height: 44, borderRadius: RADII.sm, backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    metricVal: { ...type('h1'), color: COLORS.ink },
    metricValSm: { ...type('h2') },
    metricUnit: { ...type('small'), color: COLORS.muted },
    metricLabel: { ...type('small'), color: COLORS.muted },
    gpsStatusDot: { width: 12, height: 12, borderRadius: 6 },
    coordCard: { backgroundColor: COLORS.surface, borderRadius: RADII.lg, padding: 20, ...SHADOWS.sm },
    coordText: { ...type('h2'), color: COLORS.ink, fontVariant: ['tabular-nums'] },
    logCard: { backgroundColor: COLORS.surface, borderRadius: RADII.lg, paddingHorizontal: 20, paddingVertical: 8, ...SHADOWS.sm },
    logRow: { minHeight: 44, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.line },
    logRowLast: { borderBottomWidth: 0 },
    logText: { ...type('small'), color: COLORS.inkSoft, fontVariant: ['tabular-nums'] },
  }),
};
