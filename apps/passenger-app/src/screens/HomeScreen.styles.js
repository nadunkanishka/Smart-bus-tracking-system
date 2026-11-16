import { StyleSheet } from 'react-native';
import { createStyles } from '../shared/themeRuntime';
import { COLORS, RADII, SPACE } from '../shared/theme';
import { buildCommon } from '../styles/common';
import { TOP_INSET, type } from '../shared/ui';

export const useS = createStyles(() => ({
  ...buildCommon(),
  ...StyleSheet.create({
    homeScroll: { paddingBottom: 140 },
    homeHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2], paddingTop: TOP_INSET + SPACE[3], marginBottom: SPACE[5] },
    homeHeaderText: { flex: 1 },
    homeGreeting: { ...type('overline'), color: COLORS.muted, textTransform: 'uppercase' },
    homeUserName: { ...type('display'), fontSize: 44, lineHeight: 48, color: COLORS.ink, marginTop: 2 },
    card: { backgroundColor: COLORS.surface, borderRadius: 28, padding: SPACE[5], marginBottom: SPACE[3] },
    // the black hero card: a giant minutes number is the answer
    hero: { backgroundColor: COLORS.card, borderRadius: 32, padding: SPACE[5], marginBottom: SPACE[3] },
    heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE[2] },
    livePill: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2], backgroundColor: 'rgba(255, 255, 255, 0.12)', borderRadius: RADII.pill, paddingHorizontal: SPACE[3], paddingVertical: SPACE[1] },
    livePillText: { ...type('caption'), color: COLORS.onCard, letterSpacing: 0.8 },
    heroBus: { ...type('small'), color: COLORS.cardMuted, flexShrink: 1 },
    heroNumberRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: SPACE[4], marginBottom: SPACE[4] },
    heroNumber: { fontSize: 104, lineHeight: 104, fontWeight: '800', letterSpacing: -5, color: COLORS.onCard },
    heroUnit: { marginLeft: SPACE[2], paddingBottom: SPACE[3], flex: 1 },
    heroUnitText: { ...type('h2'), color: COLORS.orange },
    heroUnitSub: { ...type('small'), color: COLORS.cardMuted },
    heroBusArt: { marginBottom: -SPACE[2], marginRight: -SPACE[3] },
    heroStops: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 20, padding: SPACE[4] },
    heroStopRight: { alignItems: 'flex-end' },
    heroStopLabel: { ...type('caption'), color: COLORS.cardMuted },
    heroStopName: { ...type('bodyBold'), color: COLORS.onCard },
    quickRow: { flexDirection: 'row', gap: SPACE[2], marginBottom: SPACE[3] },
    quickItem: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 24, paddingVertical: SPACE[4], alignItems: 'center', gap: SPACE[2] },
    quickLabel: { ...type('caption'), color: COLORS.ink, textAlign: 'center' },
    travelCardLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3] },
    travelIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.orange, alignItems: 'center', justifyContent: 'center' },
    travelCardLabel: { ...type('caption'), color: COLORS.muted },
    travelCardPlace: { ...type('h3'), color: COLORS.ink },
    sectionTitleFlat: { ...type('h2'), color: COLORS.ink },
    sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACE[3] },
    routeSummaryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACE[3], gap: SPACE[3] },
    routeBadge: { backgroundColor: COLORS.ink, paddingHorizontal: SPACE[3], paddingVertical: SPACE[1], borderRadius: RADII.pill },
    routeBadgeText: { ...type('caption'), color: COLORS.white },
    routeSummaryMeta: { ...type('small'), color: COLORS.muted },
    routeSummaryName: { ...type('h2'), color: COLORS.ink, marginBottom: SPACE[2] },
    routeTerminalRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2] },
    routeTerminalText: { ...type('small'), color: COLORS.muted, flexShrink: 1 },
  }),
}));
