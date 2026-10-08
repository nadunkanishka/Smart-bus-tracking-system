import { Platform, StyleSheet } from 'react-native';
import { COLORS, RADII, SHADOWS } from '../shared/theme';
import { TOP_INSET } from '../constants';
import { common, type } from '../styles/common';

export const S = {
  ...common,
  ...StyleSheet.create({
    routesScroll: { paddingBottom: 120 },
    screenTitle: { ...type('h1'), color: COLORS.ink, paddingTop: TOP_INSET },
    screenSubtitle: { ...type('small'), color: COLORS.ink, marginTop: 4, marginBottom: 16 },
    searchBar: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
      borderRadius: RADII.pill, paddingHorizontal: 20, minHeight: 52, gap: 12, ...SHADOWS.sm,
    },
    searchInput: { flex: 1, ...type('body'), color: COLORS.ink, minHeight: 48, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null) },
    searchClearTap: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -12 },
    searchClear: { ...type('bodyBold'), color: COLORS.muted },
    activeRouteBanner: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: COLORS.accentSoft, borderRadius: RADII.md, padding: 16, marginBottom: 16,
    },
    activeRouteLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    activeRouteBannerText: { ...type('smallBold'), color: COLORS.accentText },
    activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
    routeCardWrap: { marginBottom: 16 },
    routeCardPlain: { backgroundColor: COLORS.surface, borderRadius: RADII.lg, ...SHADOWS.sm },
    routeCard: { padding: 20 },
    routeCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
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
    trackingPill: { backgroundColor: COLORS.ink, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADII.pill },
    trackingPillText: { ...type('caption'), color: COLORS.white },
    trackRoutePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: COLORS.primarySoft, borderRadius: RADII.pill },
    trackRoutePillText: { ...type('caption'), color: COLORS.primaryDeep },
    routeTerminalsCard: { marginBottom: 12 },
    terminalItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
    terminalDotStart: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primaryStrong },
    terminalDotEnd: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.ink },
    terminalDashedLine: { width: 2, height: 12, backgroundColor: COLORS.mutedLight, marginLeft: 4, borderRadius: 1 },
    terminalName: { ...type('small'), color: COLORS.inkSoft, flex: 1 },
    stopsScroll: { marginTop: 4 },
    stopChip: { backgroundColor: COLORS.surfaceSoft, borderRadius: RADII.pill, paddingHorizontal: 12, paddingVertical: 4, marginRight: 8 },
    stopChipText: { ...type('caption'), color: COLORS.inkSoft },
  }),
};
