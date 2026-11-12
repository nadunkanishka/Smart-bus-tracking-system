import { StyleSheet } from 'react-native';
import { createStyles } from '../shared/themeRuntime';
import { COLORS, RADII, SHADOWS, SPACE } from '../shared/theme';
import { buildCommon, type } from '../styles/common';

export const useD = createStyles(() => ({
  ...buildCommon(),
  ...StyleSheet.create({
    mapCard: { height: 260, borderRadius: RADII.lg, overflow: 'hidden', marginTop: SPACE[4], backgroundColor: COLORS.surfaceSoft, ...SHADOWS.sm },
    routeHeaderCardWrap: { marginBottom: 0 },
    routeHeaderCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACE[5], gap: SPACE[3] },
    routeHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], flex: 1 },
    routeNumBadge: { width: 52, height: 52, borderRadius: RADII.md, backgroundColor: COLORS.ink, alignItems: 'center', justifyContent: 'center' },
    routeNumText: { ...type('h3'), color: COLORS.white },
    routeCardLabel: { ...type('h3'), color: COLORS.ink },
    routeCardSub: { ...type('small'), color: COLORS.inkSoft },
    statusPill: { paddingHorizontal: SPACE[3], paddingVertical: SPACE[2], borderRadius: RADII.pill },
    statusPillActive: { backgroundColor: COLORS.successSoft },
    statusPillOff: { backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassLine },
    statusPillText: { ...type('caption') },
    statusPillTextActive: { color: COLORS.success },
    statusPillTextOff: { color: COLORS.muted },
    timelineCard: { backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassLine, borderRadius: RADII.lg, padding: SPACE[5], ...SHADOWS.sm },
    timelineRow: { flexDirection: 'row', minHeight: 56 },
    timelineLeft: { alignItems: 'center', width: 24, marginRight: SPACE[3] },
    timelineDot: {
      width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: COLORS.mutedLight,
      backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassLine, alignItems: 'center', justifyContent: 'center',
    },
    dotPassed: { backgroundColor: COLORS.primaryStrong, borderColor: COLORS.primaryStrong },
    dotCurrent: { borderColor: COLORS.accent, backgroundColor: COLORS.accentSoft },
    dotCurrentInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accent },
    timelineLine: { width: 2, flex: 1, backgroundColor: COLORS.line, marginVertical: SPACE[1] },
    lineVPassed: { backgroundColor: COLORS.primaryStrong },
    timelineRight: { flex: 1, paddingBottom: SPACE[3] },
    timelineStop: { ...type('bodyBold'), color: COLORS.ink },
    timelineStopActive: { color: COLORS.accentText },
    timelineTag: { ...type('caption'), color: COLORS.muted, marginTop: 2 },
  }),
}));
