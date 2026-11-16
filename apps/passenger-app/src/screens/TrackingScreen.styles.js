import { StyleSheet } from 'react-native';
import { createStyles } from '../shared/themeRuntime';
import { COLORS, RADII, SPACE } from '../shared/theme';
import { buildCommon } from '../styles/common';
import { TOP_INSET, type } from '../shared/ui';

export const useS = createStyles(() => ({
  ...buildCommon(),
  ...StyleSheet.create({
    mapCanvas: { ...StyleSheet.absoluteFillObject },
    mapHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30, paddingTop: TOP_INSET + 8, paddingHorizontal: SPACE[4] },
    mapHeaderInner: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: COLORS.surface, borderRadius: RADII.lg, paddingLeft: SPACE[4], paddingRight: SPACE[2], paddingVertical: SPACE[2],
    },
    mapHeaderLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACE[3] },
    mapHeaderText: { flex: 1 },
    mapHeaderTitle: { ...type('h2'), color: COLORS.ink },
    mapHeaderStatus: { ...type('small'), color: COLORS.muted },
    // boarding (white) and destination (blue) blocks side by side under the header
    stopSelectorBar: { position: 'absolute', top: TOP_INSET + 8 + 72 + 8, left: 16, right: 16, zIndex: 20, flexDirection: 'row', alignItems: 'flex-start', gap: SPACE[2] },
    // the bottom block
    summaryCard: { position: 'absolute', left: 16, right: 16, bottom: 104, backgroundColor: COLORS.surface, borderRadius: RADII.xl, padding: SPACE[5] },
    sheetTopRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: SPACE[4], gap: SPACE[3] },
    sheetMetaLabel: { ...type('caption'), color: COLORS.muted },
    sheetBookingId: { ...type('display'), fontSize: 34, lineHeight: 38, color: COLORS.ink },
    sheetEta: { fontSize: 64, lineHeight: 64, fontWeight: '300', letterSpacing: -3, color: COLORS.ink },
    sheetEtaUnit: { ...type('h3'), color: COLORS.orange, letterSpacing: 0 },
    transitBadge: { paddingHorizontal: SPACE[3], paddingVertical: SPACE[2], borderRadius: RADII.pill, backgroundColor: COLORS.successSoft },
    transitBadgeText: { ...type('caption'), color: COLORS.success },
    transitBadgeWarn: { backgroundColor: COLORS.warningSoft },
    transitBadgeTextWarn: { color: COLORS.warning },
    progressBlock: { marginBottom: SPACE[2] },
    progressSummary: { ...type('body'), color: COLORS.ink, marginTop: SPACE[3] },
    moreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52, marginTop: SPACE[2], paddingHorizontal: SPACE[4], borderRadius: RADII.pill, backgroundColor: COLORS.surfaceSoft },
    moreText: { ...type('smallBold'), color: COLORS.ink },
    etaList: { maxHeight: 190, marginTop: SPACE[3], marginBottom: SPACE[2] },
    etaRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], minHeight: 48, paddingHorizontal: SPACE[4], borderRadius: RADII.sm, marginBottom: SPACE[1] },
    etaRowOn: { backgroundColor: COLORS.blue },
    etaDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.orange },
    etaDotPassed: { backgroundColor: COLORS.mutedLight },
    etaDotOn: { backgroundColor: COLORS.onBlue },
    etaStop: { ...type('body'), color: COLORS.ink, flex: 1 },
    etaVal: { ...type('smallBold'), color: COLORS.ink, fontVariant: ['tabular-nums'] },
    etaPassed: { color: COLORS.muted },
    etaOnText: { color: COLORS.onBlue },
    driverCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.card, borderRadius: RADII.lg, padding: SPACE[3], gap: SPACE[3] },
    driverLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: SPACE[3] },
    driverAvatar: { width: 48, height: 48, borderRadius: RADII.sm, backgroundColor: COLORS.orange, alignItems: 'center', justifyContent: 'center' },
    driverAvatarText: { ...type('h3'), color: COLORS.onBright },
    driverName: { ...type('bodyBold'), color: COLORS.onCard },
    driverRole: { ...type('caption'), color: COLORS.cardMuted, marginTop: 2 },
    driverStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: SPACE[1], backgroundColor: 'rgba(255, 255, 255, 0.12)', paddingHorizontal: SPACE[3], paddingVertical: SPACE[2], borderRadius: RADII.pill },
    driverStatusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.green },
    driverStatusText: { ...type('caption'), color: COLORS.onCard },
  }),
}));
