import { StyleSheet } from 'react-native';
import { COLORS, RADII, SHADOWS } from '../shared/theme';
import { common, type } from '../styles/common';

export const D = {
  ...common,
  ...StyleSheet.create({
    mapCard: { height: 260, borderRadius: RADII.lg, overflow: 'hidden', marginTop: 16, backgroundColor: COLORS.surfaceSoft, ...SHADOWS.sm },
    routeHeaderCardWrap: { marginBottom: 0 },
    routeHeaderCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, gap: 12 },
    routeHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    routeNumBadge: { width: 52, height: 52, borderRadius: RADII.md, backgroundColor: COLORS.ink, alignItems: 'center', justifyContent: 'center' },
    routeNumText: { ...type('h3'), color: COLORS.white },
    routeCardLabel: { ...type('h3'), color: COLORS.ink },
    routeCardSub: { ...type('small'), color: COLORS.inkSoft },
    statusPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADII.pill },
    statusPillActive: { backgroundColor: COLORS.successSoft },
    statusPillOff: { backgroundColor: COLORS.surface },
    statusPillText: { ...type('caption') },
    statusPillTextActive: { color: COLORS.success },
    statusPillTextOff: { color: COLORS.muted },
    timelineCard: { backgroundColor: COLORS.surface, borderRadius: RADII.lg, padding: 20, ...SHADOWS.sm },
    timelineRow: { flexDirection: 'row', minHeight: 56 },
    timelineLeft: { alignItems: 'center', width: 24, marginRight: 12 },
    timelineDot: {
      width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: COLORS.mutedLight,
      backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
    },
    dotPassed: { backgroundColor: COLORS.primaryStrong, borderColor: COLORS.primaryStrong },
    dotCurrent: { borderColor: COLORS.accent, backgroundColor: COLORS.accentSoft },
    dotCurrentInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accent },
    timelineLine: { width: 2, flex: 1, backgroundColor: COLORS.line, marginVertical: 4 },
    lineVPassed: { backgroundColor: COLORS.primaryStrong },
    timelineRight: { flex: 1, paddingBottom: 12 },
    timelineStop: { ...type('bodyBold'), color: COLORS.ink },
    timelineStopActive: { color: COLORS.accentText },
    timelineTag: { ...type('caption'), color: COLORS.muted, marginTop: 2 },
  }),
};
