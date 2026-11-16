import { Platform, StyleSheet } from 'react-native';
import { createStyles } from '../shared/themeRuntime';
import { COLORS, RADII, SPACE } from '../shared/theme';
import { buildCommon } from '../styles/common';
import { TOP_INSET, type } from '../shared/ui';

export const useS = createStyles(() => ({
  ...buildCommon(),
  ...StyleSheet.create({
    routesScroll: { paddingBottom: 140 },
    screenTitle: { ...type('display'), color: COLORS.ink, paddingTop: TOP_INSET + SPACE[3] },
    screenSubtitle: { ...type('body'), color: COLORS.muted, marginTop: SPACE[1], marginBottom: SPACE[5] },
    searchBar: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], backgroundColor: COLORS.surface, borderRadius: RADII.pill, paddingHorizontal: SPACE[5], minHeight: 56, marginBottom: SPACE[4] },
    searchInput: { flex: 1, ...type('body'), color: COLORS.ink, minHeight: 56, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null) },
    searchClearTap: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
    searchClear: { ...type('smallBold'), color: COLORS.muted },
    routeBlock: { borderRadius: RADII.xl, padding: SPACE[5], marginBottom: SPACE[2] },
    routeBlockOn: { backgroundColor: COLORS.orange },
    routeBlockOff: { backgroundColor: COLORS.surface },
    routeTop: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE[3] },
    routeName: { ...type('h2'), color: COLORS.ink },
    routeMeta: { ...type('small'), color: COLORS.muted, marginTop: 2 },
    onOrange: { color: COLORS.onBright },
    onOrangeSoft: { color: COLORS.onBright, opacity: 0.75 },
    trackingPill: { backgroundColor: COLORS.card, borderRadius: RADII.pill, paddingHorizontal: SPACE[3], paddingVertical: SPACE[1] },
    trackingPillText: { ...type('caption'), color: COLORS.onCard },
    routeEnds: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2], marginTop: SPACE[4] },
    endName: { ...type('smallBold'), color: COLORS.ink, flexShrink: 1 },
    routeBottom: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACE[3], marginTop: SPACE[4] },
    stopsScroll: { flex: 1 },
    stopChip: { backgroundColor: COLORS.surfaceSoft, borderRadius: RADII.pill, paddingHorizontal: SPACE[3], paddingVertical: SPACE[1], marginRight: SPACE[1] },
    stopChipOn: { backgroundColor: 'rgba(16, 17, 20, 0.16)' },
    stopChipText: { ...type('caption'), color: COLORS.ink },
    routeNumber: { fontSize: 44, lineHeight: 46, fontWeight: '300', letterSpacing: -2, color: COLORS.ink },
  }),
}));
