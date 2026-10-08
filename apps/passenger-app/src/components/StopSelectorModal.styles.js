import { StyleSheet } from 'react-native';
import { COLORS, RADII, SHADOWS } from '../shared/theme';
import { type } from '../styles/common';

export const S = StyleSheet.create({
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,20,25,0.45)', justifyContent: 'flex-end' },
  modalDismissArea: { flex: 1 },
  modalHandleRow: { alignItems: 'center', paddingBottom: 16 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.line },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  modalTitle: { ...type('h2'), color: COLORS.ink },
  modalSectionLabel: { ...type('overline'), color: COLORS.muted, marginBottom: 12, textTransform: 'uppercase' },
  modalSectionGap: { marginTop: 24 },
  modalSectionGapLg: { marginTop: 32 },
  routeChipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  dropdownTrigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceSoft, borderRadius: RADII.md, paddingHorizontal: 16, minHeight: 52,
  },
  dropdownTriggerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dropdownTriggerText: { ...type('bodyBold'), color: COLORS.ink },
  dropdownList: { backgroundColor: COLORS.surface, borderRadius: RADII.md, marginTop: 8, overflow: 'hidden', ...SHADOWS.md },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, paddingHorizontal: 16 },
  dropdownItemActive: { backgroundColor: COLORS.accentSoft },
  dropdownItemText: { ...type('body'), color: COLORS.ink },
  dropdownItemTextActive: { color: COLORS.accentText, fontWeight: '700' },
  // Timeline
  timelineContainer: { paddingVertical: 4 },
  timelineRow: { flexDirection: 'row', marginBottom: 8 },
  timelineLeft: { alignItems: 'center', width: 24, marginRight: 12 },
  timelineDot: {
    width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: COLORS.mutedLight,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
  },
  dotPassed: { backgroundColor: COLORS.primaryStrong, borderColor: COLORS.primaryStrong },
  dotBoarding: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  dotDestination: { backgroundColor: COLORS.ink, borderColor: COLORS.ink },
  dotActive: { borderColor: COLORS.accent },
  timelineLineV: { width: 2, flex: 1, backgroundColor: COLORS.line, marginVertical: 4 },
  lineVPassed: { backgroundColor: COLORS.primaryStrong },
  timelineRight: { flex: 1, paddingTop: 0, paddingBottom: 8 },
  timelineStopName: { ...type('small'), color: COLORS.ink },
  timelineStopNameHighlight: { fontWeight: '700', color: COLORS.accentText },
  timelineTag: { ...type('caption'), color: COLORS.muted, marginTop: 2 },
// ─── Live states ─────────────────────────────────────────
});
