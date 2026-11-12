import { StyleSheet } from 'react-native';
import { createStyles } from '../shared/themeRuntime';
import { COLORS, RADII, SHADOWS, SPACE } from '../shared/theme';
import { TOP_INSET } from '../constants';
import { buildCommon, type } from '../styles/common';

export const useS = createStyles(() => ({
  ...buildCommon(),
  ...StyleSheet.create({
    mapCanvas: { ...StyleSheet.absoluteFillObject },
    mapHeader: {
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
      paddingTop: TOP_INSET + 8, paddingHorizontal: SPACE[4],
    },
    mapHeaderInner: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.glassLine, borderRadius: RADII.lg, paddingLeft: SPACE[4], paddingRight: SPACE[2], paddingVertical: SPACE[2],
      ...SHADOWS.md,
    },
    mapHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3] },
    mapHeaderTitle: { ...type('h3'), color: COLORS.ink },
    // Floating stop selector card
    stopSelectorBar: {
      position: 'absolute', top: TOP_INSET + 8 + 60 + 8, left: 16, right: 16, zIndex: 20,
      flexDirection: 'row', alignItems: 'flex-start',
      backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.glassLine, borderRadius: RADII.lg, padding: SPACE[3],
      ...SHADOWS.md,
    },
    stopDotGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primaryStrong },
    stopDotOrange: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent },
    stopSelectorDivider: { width: 28, alignItems: 'center', justifyContent: 'flex-end', height: 70 },
    // Bottom summary card
    summaryCard: {
      position: 'absolute', left: 16, right: 16, bottom: 104,
      backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.glassLine, borderRadius: RADII.xl, padding: SPACE[5],
      ...SHADOWS.lg,
    },
    sheetTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACE[4], gap: SPACE[3] },
    sheetMetaLabel: { ...type('caption'), color: COLORS.muted },
    sheetBookingId: { ...type('h2'), color: COLORS.ink },
    transitBadge: { paddingHorizontal: SPACE[3], paddingVertical: SPACE[2], borderRadius: RADII.pill, backgroundColor: COLORS.successSoft },
    transitBadgeText: { ...type('caption'), color: COLORS.success },
    progressBlock: { marginBottom: SPACE[4] },
    progressTrack: { flexDirection: 'row', alignItems: 'center', height: 20 },
    progressDone: { height: 4, borderRadius: 2, backgroundColor: COLORS.accent },
    progressLeft: { height: 4, borderRadius: 2, backgroundColor: COLORS.ink },
    // Driver Card
    driverCard: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: COLORS.surfaceSoft, borderRadius: RADII.md, padding: SPACE[3], marginBottom: SPACE[4], gap: SPACE[3],
    },
    driverLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: SPACE[3] },
    driverAvatar: {
      width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.ink,
      alignItems: 'center', justifyContent: 'center',
    },
    driverAvatarText: { ...type('smallBold'), color: COLORS.white },
    driverName: { ...type('smallBold'), color: COLORS.ink },
    driverRole: { ...type('caption'), color: COLORS.muted, marginTop: 2 },
    driverStatusBadge: {
      flexDirection: 'row', alignItems: 'center', gap: SPACE[1],
      backgroundColor: COLORS.successSoft, paddingHorizontal: SPACE[3], paddingVertical: SPACE[2], borderRadius: RADII.pill,
    },
    driverStatusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
    driverStatusText: { ...type('caption'), color: COLORS.success },
    transitBadgeWarn: { backgroundColor: COLORS.warningSoft },
    transitBadgeTextWarn: { color: COLORS.warning },
    progressSummary: { ...type('smallBold'), color: COLORS.ink, marginTop: SPACE[2] },
    // Arrival time at every stop
    etaList: { maxHeight: 176, marginBottom: SPACE[3] },
    etaRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], minHeight: 44, paddingHorizontal: SPACE[3], borderRadius: RADII.sm },
    etaRowOn: { backgroundColor: COLORS.greenSoft },
    etaDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.ink },
    etaDotPassed: { backgroundColor: COLORS.mutedLight },
    etaDotOn: { backgroundColor: COLORS.green },
    etaStop: { ...type('small'), color: COLORS.ink, flex: 1 },
    etaVal: { ...type('smallBold'), color: COLORS.ink, fontVariant: ['tabular-nums'] },
    etaPassed: { color: COLORS.muted },
  }),
}));
