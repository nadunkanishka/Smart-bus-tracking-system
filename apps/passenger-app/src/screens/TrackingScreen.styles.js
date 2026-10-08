import { StyleSheet } from 'react-native';
import { COLORS, RADII, SHADOWS } from '../shared/theme';
import { TOP_INSET } from '../constants';
import { common, type } from '../styles/common';

export const S = {
  ...common,
  ...StyleSheet.create({
    mapCanvas: { ...StyleSheet.absoluteFillObject },
    mapHeader: {
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
      paddingTop: TOP_INSET + 8, paddingHorizontal: 16,
    },
    mapHeaderInner: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: COLORS.surface, borderRadius: RADII.lg, paddingLeft: 16, paddingRight: 8, paddingVertical: 8,
      ...SHADOWS.md,
    },
    mapHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    mapHeaderTitle: { ...type('h3'), color: COLORS.ink },
    // Floating stop selector card
    stopSelectorBar: {
      position: 'absolute', top: TOP_INSET + 8 + 60 + 8, left: 16, right: 16, zIndex: 20,
      flexDirection: 'row', alignItems: 'flex-start',
      backgroundColor: COLORS.surface, borderRadius: RADII.lg, padding: 12,
      ...SHADOWS.md,
    },
    stopDotGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primaryStrong },
    stopDotOrange: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent },
    stopSelectorDivider: { width: 28, alignItems: 'center', justifyContent: 'flex-end', height: 70 },
    // Bottom summary card
    summaryCard: {
      position: 'absolute', left: 16, right: 16, bottom: 104,
      backgroundColor: COLORS.surface, borderRadius: RADII.xl, padding: 20,
      ...SHADOWS.lg,
    },
    sheetTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12 },
    sheetMetaLabel: { ...type('caption'), color: COLORS.muted },
    sheetBookingId: { ...type('h2'), color: COLORS.ink },
    transitBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADII.pill, backgroundColor: COLORS.successSoft },
    transitBadgeText: { ...type('caption'), color: COLORS.success },
    progressBlock: { marginBottom: 16 },
    progressTrack: { flexDirection: 'row', alignItems: 'center', height: 20 },
    progressDone: { height: 4, borderRadius: 2, backgroundColor: COLORS.accent },
    progressLeft: { height: 4, borderRadius: 2, backgroundColor: COLORS.ink },
    // Driver Card
    driverCard: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: COLORS.surfaceSoft, borderRadius: RADII.md, padding: 12, marginBottom: 16, gap: 12,
    },
    driverLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
    driverAvatar: {
      width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.ink,
      alignItems: 'center', justifyContent: 'center',
    },
    driverAvatarText: { ...type('smallBold'), color: COLORS.white },
    driverName: { ...type('smallBold'), color: COLORS.ink },
    driverRole: { ...type('caption'), color: COLORS.muted, marginTop: 2 },
    driverStatusBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: COLORS.successSoft, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADII.pill,
    },
    driverStatusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
    driverStatusText: { ...type('caption'), color: COLORS.success },
    transitBadgeWarn: { backgroundColor: COLORS.warningSoft },
    transitBadgeTextWarn: { color: COLORS.warning },
    progressSummary: { ...type('smallBold'), color: COLORS.ink, marginTop: 8 },
    // Arrival time at every stop
    etaList: { maxHeight: 176, marginBottom: 12 },
    etaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44, paddingHorizontal: 12, borderRadius: RADII.sm },
    etaRowOn: { backgroundColor: COLORS.accentSoft },
    etaDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.ink },
    etaDotPassed: { backgroundColor: COLORS.mutedLight },
    etaDotOn: { backgroundColor: COLORS.accent },
    etaStop: { ...type('small'), color: COLORS.ink, flex: 1 },
    etaVal: { ...type('smallBold'), color: COLORS.ink, fontVariant: ['tabular-nums'] },
    etaPassed: { color: COLORS.muted },
  }),
};
