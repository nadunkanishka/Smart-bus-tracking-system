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
    homeHeaderText: { flex: 1, marginLeft: SPACE[1] },
    homeUserName: { ...type('h1'), color: COLORS.ink },
    homeGreeting: { ...type('small'), color: COLORS.muted },
    avatar: { width: 56, height: 56, borderRadius: RADII.md, backgroundColor: COLORS.blue, alignItems: 'center', justifyContent: 'center' },
    avatarText: { ...type('h2'), color: COLORS.onBlue },

    // two number blocks side by side: white and blue
    splitRow: { flexDirection: 'row', gap: SPACE[2], marginBottom: SPACE[5] },
    splitBlock: { flex: 1, minHeight: 112, borderRadius: RADII.lg, padding: SPACE[4], flexDirection: 'row', alignItems: 'center', gap: SPACE[2] },
    splitWhite: { backgroundColor: COLORS.surface },
    splitBlue: { backgroundColor: COLORS.blue },
    splitNumber: { fontSize: 64, lineHeight: 68, fontWeight: '300', letterSpacing: -3, color: COLORS.ink },
    splitLabel: { ...type('small'), color: COLORS.ink, flexShrink: 1 },
    onBlue: { color: COLORS.onBlue },

    sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACE[2] },
    sectionTitle: { ...type('h2'), color: COLORS.ink },
    link: { ...type('caption'), color: COLORS.muted },
    linkTap: { minHeight: 44, justifyContent: 'center' },

    // the live bus: the orange block, one bar per stop
    orangeBlock: { backgroundColor: COLORS.orange, borderRadius: RADII.xl, padding: SPACE[5], marginBottom: SPACE[2], overflow: 'hidden' },
    orangeTop: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE[3], marginBottom: SPACE[4] },
    orangeTitle: { ...type('h1'), color: COLORS.onBright },
    orangeSub: { ...type('small'), color: COLORS.onBright, opacity: 0.8, marginTop: 2 },
    livePill: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2], backgroundColor: 'rgba(16, 17, 20, 0.14)', borderRadius: RADII.pill, paddingHorizontal: SPACE[3], paddingVertical: SPACE[1] },
    livePillText: { ...type('caption'), color: COLORS.onBright, letterSpacing: 0.8 },
    barsLabel: { ...type('caption'), color: COLORS.onBright, opacity: 0.8, marginBottom: SPACE[2] },
    bars: { flexDirection: 'row', gap: SPACE[1], marginBottom: SPACE[2] },
    bar: { flex: 1, height: 92, borderRadius: 14, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: SPACE[2] },
    barPassed: { backgroundColor: 'rgba(16, 17, 20, 0.5)' },
    barUpcoming: { backgroundColor: 'rgba(255, 255, 255, 0.28)' },
    barMine: { backgroundColor: COLORS.card },
    barText: { ...type('caption'), color: '#FFFFFF' },
    orangeBus: { alignSelf: 'flex-end', marginTop: SPACE[1], marginBottom: -SPACE[2], marginRight: -SPACE[3] },
    emptyBlock: { backgroundColor: COLORS.surface, borderRadius: RADII.xl, padding: SPACE[5], marginBottom: SPACE[2], alignItems: 'center', gap: SPACE[1] },

    blueBlock: { backgroundColor: COLORS.blue, borderRadius: RADII.xl, padding: SPACE[5], flexDirection: 'row', alignItems: 'center', gap: SPACE[3], marginBottom: SPACE[2] },
    blueLabel: { ...type('small'), color: COLORS.onBlue, opacity: 0.8 },
    blueTitle: { ...type('h1'), color: COLORS.onBlue },
    blueChevron: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(16, 17, 20, 0.22)', alignItems: 'center', justifyContent: 'center' },

    routeRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], backgroundColor: COLORS.surface, borderRadius: RADII.lg, padding: SPACE[4], minHeight: 76 },
    routeBadge: { backgroundColor: COLORS.card, paddingHorizontal: SPACE[3], height: 44, borderRadius: RADII.sm, alignItems: 'center', justifyContent: 'center' },
    routeBadgeText: { ...type('smallBold'), color: COLORS.onCard },
    routeSummaryName: { ...type('bodyBold'), color: COLORS.ink },
    routeSummaryMeta: { ...type('small'), color: COLORS.muted },
  }),
}));
