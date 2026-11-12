import { Platform, StyleSheet } from 'react-native';
import { createStyles } from '../shared/themeRuntime';
import { COLORS, RADII, SHADOWS, SPACE } from '../shared/theme';
import { TOP_INSET } from '../constants';
import { buildCommon, type } from '../styles/common';

export const useS = createStyles(() => ({
  ...buildCommon(),
  ...StyleSheet.create({
    routesScroll: { paddingBottom: 120 },
    screenTitle: { ...type('display'), fontWeight: '500', color: COLORS.ink, paddingTop: TOP_INSET },
    screenSubtitle: { ...type('small'), color: COLORS.ink, marginTop: SPACE[1], marginBottom: SPACE[4] },
    searchBar: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassLine,
      borderRadius: RADII.pill, paddingHorizontal: SPACE[5], minHeight: 52, gap: SPACE[3], ...SHADOWS.sm,
    },
    searchInput: { flex: 1, ...type('body'), color: COLORS.ink, minHeight: 48, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null) },
    searchClearTap: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -12 },
    searchClear: { ...type('bodyBold'), color: COLORS.muted },
    activeRouteBanner: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: COLORS.accentSoft, borderRadius: RADII.md, padding: SPACE[4], marginBottom: SPACE[4],
    },
    activeRouteLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2] },
    activeRouteBannerText: { ...type('smallBold'), color: COLORS.accentText },
    activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
    routeCardWrap: { marginBottom: SPACE[4] },
    routeCardPlain: { backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassLine, borderRadius: RADII.lg, ...SHADOWS.sm },
    routeCard: { padding: SPACE[5] },
    routeCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACE[4], gap: SPACE[3] },
    routeNumBadge: {
      width: 44, height: 44, borderRadius: RADII.sm, backgroundColor: COLORS.primarySoft,
      alignItems: 'center', justifyContent: 'center',
    },
    routeNumBadgeActive: { backgroundColor: COLORS.ink },
    routeNumText: { ...type('bodyBold'), color: COLORS.primaryDeep },
    routeNumTextActive: { color: COLORS.white },
    routeCardTitleBox: { flex: 1 },
    routeCardName: { ...type('smallBold'), color: COLORS.ink },
    routeCardMeta: { ...type('caption'), color: COLORS.muted, marginTop: 2 },
    trackingPill: { backgroundColor: COLORS.ink, paddingHorizontal: SPACE[3], paddingVertical: SPACE[2], borderRadius: RADII.pill },
    trackingPillText: { ...type('caption'), color: COLORS.white },
    trackRoutePill: { flexDirection: 'row', alignItems: 'center', gap: SPACE[1], paddingHorizontal: SPACE[3], paddingVertical: SPACE[2], backgroundColor: COLORS.primarySoft, borderRadius: RADII.pill },
    trackRoutePillText: { ...type('caption'), color: COLORS.primaryDeep },
    routeTerminalsCard: { marginBottom: SPACE[3] },
    terminalItem: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], paddingVertical: SPACE[1] },
    terminalDotStart: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primaryStrong },
    terminalDotEnd: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.ink },
    terminalDashedLine: { width: 2, height: 12, backgroundColor: COLORS.mutedLight, marginLeft: SPACE[1], borderRadius: 1 },
    terminalName: { ...type('small'), color: COLORS.inkSoft, flex: 1 },
    stopsScroll: { marginTop: SPACE[1] },
    stopChip: { backgroundColor: COLORS.surfaceSoft, borderRadius: RADII.pill, paddingHorizontal: SPACE[3], paddingVertical: SPACE[1], marginRight: SPACE[2] },
    stopChipText: { ...type('caption'), color: COLORS.inkSoft },
  }),
}));
