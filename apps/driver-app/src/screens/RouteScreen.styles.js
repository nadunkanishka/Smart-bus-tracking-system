import { StyleSheet } from 'react-native';
import { createStyles } from '../shared/themeRuntime';
import { COLORS, RADII, SPACE } from '../shared/theme';
import { buildCommon } from '../styles/common';
import { type } from '../shared/ui';

export const useD = createStyles(() => ({
  ...buildCommon(),
  ...StyleSheet.create({
    numberBlock: { flexDirection: 'row', alignItems: 'center', gap: SPACE[4], backgroundColor: COLORS.blue, borderRadius: RADII.xl, padding: SPACE[5], marginBottom: SPACE[2] },
    numberText: { fontSize: 64, lineHeight: 68, fontWeight: '300', letterSpacing: -3, color: COLORS.onBlue },
    routeCardLabel: { ...type('h3'), color: COLORS.onBlue },
    statusPill: { alignSelf: 'flex-start', marginTop: SPACE[2], paddingHorizontal: SPACE[3], paddingVertical: SPACE[1], borderRadius: RADII.pill },
    statusPillActive: { backgroundColor: COLORS.orange },
    statusPillOff: { backgroundColor: 'rgba(16, 17, 20, 0.25)' },
    statusPillText: { ...type('caption') },
    statusPillTextActive: { color: COLORS.onBright },
    statusPillTextOff: { color: COLORS.onBlue },
    mapCard: { height: 260, borderRadius: RADII.xl, overflow: 'hidden', backgroundColor: COLORS.surfaceSoft },
    emptyBlock: { backgroundColor: COLORS.surface, borderRadius: RADII.xl, padding: SPACE[5], alignItems: 'center', gap: SPACE[2] },

    stopBlock: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], minHeight: 72, borderRadius: RADII.lg, paddingHorizontal: SPACE[4], paddingVertical: SPACE[3], marginBottom: SPACE[2] },
    stopUpcoming: { backgroundColor: COLORS.surface },
    stopPassed: { backgroundColor: COLORS.card },
    stopCurrent: { backgroundColor: COLORS.orange },
    stopIndex: { width: 40, height: 40, borderRadius: 14, backgroundColor: COLORS.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
    stopIndexCurrent: { backgroundColor: 'rgba(16, 17, 20, 0.16)' },
    stopIndexText: { ...type('caption'), color: COLORS.ink },
    stopName: { ...type('h3'), color: COLORS.ink, flex: 1 },
    stopTag: { ...type('caption'), color: COLORS.muted },
    onOrange: { color: COLORS.onBright },
    onCard: { color: COLORS.onCard },
    onCardSoft: { color: COLORS.cardMuted },
  }),
}));
