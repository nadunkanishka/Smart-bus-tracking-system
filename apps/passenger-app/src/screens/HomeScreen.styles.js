import { StyleSheet } from 'react-native';
import { createStyles } from '../shared/themeRuntime';
import { COLORS, RADII, SPACE } from '../shared/theme';
import { buildCommon } from '../styles/common';
import { TOP_INSET, type } from '../shared/ui';

export const useS = createStyles(() => ({
  ...buildCommon(),
  ...StyleSheet.create({
    homeScroll: { paddingBottom: 120 },
    homeHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingTop: TOP_INSET },
    homeHeaderText: { flex: 1 },
    homeGreeting: { ...type('small'), color: COLORS.muted },
    homeUserName: { ...type('display'), color: COLORS.ink, marginTop: 2 },
    homeHello: { fontWeight: '800' },
    statRow: { flexDirection: 'row', gap: SPACE[3], marginBottom: SPACE[4] },
    statValue: { ...type('display'), color: COLORS.ink },
    statValueOnCard: { color: COLORS.onCard },
    livePill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: SPACE[2], backgroundColor: 'rgba(255, 255, 255, 0.16)', borderRadius: RADII.pill, paddingHorizontal: SPACE[3], paddingVertical: SPACE[1], marginBottom: SPACE[2] },
    livePillText: { ...type('caption'), color: COLORS.onCard, letterSpacing: 0.6 },
    travelCard: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE[3],
      backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassLine, borderRadius: RADII.lg, padding: SPACE[4], marginBottom: SPACE[4],
      },
    travelCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: SPACE[3] },
    travelIcon: { width: 44, height: 44, borderRadius: RADII.sm, backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center' },
    travelCardLabel: { ...type('caption'), color: COLORS.muted },
    travelCardPlace: { ...type('bodyBold'), color: COLORS.ink },
    quickRow: { flexDirection: 'row', gap: SPACE[3], marginBottom: SPACE[4] },
    quickItem: { flex: 1, alignItems: 'center', gap: SPACE[2] },
    quickTile: {
      width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassLine,
      alignItems: 'center', justifyContent: 'center', },
    quickLabel: { ...type('caption'), color: COLORS.ink, textAlign: 'center' },
    sectionTitleFlat: { ...type('h3'), color: COLORS.ink },
    sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACE[3] },
    journeyCard: { marginBottom: SPACE[4] },
    journeyPress: { padding: SPACE[5] },
    journeyCardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACE[4], gap: SPACE[2] },
    journeyBus: { marginTop: SPACE[2], marginRight: -16 },
    journeyBusId: { ...type('display'), color: COLORS.onCard },
    journeyRouteName: { ...type('small'), color: COLORS.cardMuted, marginTop: 2 },
    journeyKv: { flexDirection: 'row', gap: SPACE[6], marginTop: SPACE[3] },
    journeyKvLabel: { ...type('caption'), color: COLORS.cardMuted },
    journeyKvVal: { ...type('h3'), color: COLORS.onCard },
    journeyTerminals: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACE[4] },
    journeyTerminalRight: { flex: 1, alignItems: 'flex-end' },
    journeyTerminalLabel: { ...type('caption'), color: COLORS.cardMuted },
    journeyTerminalName: { ...type('smallBold'), color: COLORS.onCard },
    routeSummaryCard: { backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassLine, borderRadius: RADII.lg, padding: SPACE[5], },
    routeSummaryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACE[2], gap: SPACE[3] },
    routeBadge: { backgroundColor: COLORS.ink, paddingHorizontal: SPACE[3], paddingVertical: SPACE[1], borderRadius: RADII.pill },
    routeBadgeText: { ...type('caption'), color: COLORS.white },
    routeSummaryMeta: { ...type('small'), color: COLORS.muted, flexShrink: 1 },
    routeSummaryName: { ...type('bodyBold'), color: COLORS.ink, marginBottom: SPACE[2] },
    routeTerminalRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2] },
    routeTerminalText: { ...type('small'), color: COLORS.muted, flex: 1 },
  }),
}));
