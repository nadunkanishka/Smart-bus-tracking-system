import { StyleSheet } from 'react-native';
import { createStyles } from '../shared/themeRuntime';
import { COLORS, RADII, SHADOWS, SPACE } from '../shared/theme';
import { type } from '../shared/ui';

export const useS = createStyles(() => StyleSheet.create({
  modalHandleRow: { alignItems: 'center', paddingBottom: SPACE[4] },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.line },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACE[6] },
  modalTitle: { ...type('h2'), color: COLORS.ink },
  modalSectionLabel: { ...type('overline'), color: COLORS.muted, marginBottom: SPACE[3], textTransform: 'uppercase' },
  modalSectionGap: { marginTop: SPACE[6] },
  modalSectionGapLg: { marginTop: SPACE[8] },
  routeChipsRow: { flexDirection: 'row', gap: SPACE[2], flexWrap: 'wrap' },
  dropdownTrigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceSoft, borderRadius: RADII.md, paddingHorizontal: SPACE[4], minHeight: 52,
  },
  dropdownTriggerLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3] },
  dropdownTriggerText: { ...type('bodyBold'), color: COLORS.ink },
  dropdownList: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.glassLine, borderRadius: RADII.md, marginTop: SPACE[2], overflow: 'hidden', ...SHADOWS.md },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, paddingHorizontal: SPACE[4] },
  dropdownItemActive: { backgroundColor: COLORS.accentSoft },
  dropdownItemText: { ...type('body'), color: COLORS.ink },
  dropdownItemTextActive: { color: COLORS.accentText, fontWeight: '700' },
  // Timeline
  timelineContainer: { paddingVertical: SPACE[1] },
  timelineRow: { flexDirection: 'row', marginBottom: SPACE[2] },
  timelineLeft: { alignItems: 'center', width: 24, marginRight: SPACE[3] },
  timelineDot: {
    width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: COLORS.mutedLight,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.glassLine, alignItems: 'center', justifyContent: 'center',
  },
  dotPassed: { backgroundColor: COLORS.primaryStrong, borderColor: COLORS.primaryStrong },
  dotBoarding: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  dotDestination: { backgroundColor: COLORS.ink, borderColor: COLORS.ink },
  dotActive: { borderColor: COLORS.accent },
  timelineLineV: { width: 2, flex: 1, backgroundColor: COLORS.line, marginVertical: SPACE[1] },
  lineVPassed: { backgroundColor: COLORS.primaryStrong },
  timelineRight: { flex: 1, paddingTop: 0, paddingBottom: SPACE[2] },
  timelineStopName: { ...type('small'), color: COLORS.ink },
  timelineStopNameHighlight: { fontWeight: '700', color: COLORS.accentText },
  timelineTag: { ...type('caption'), color: COLORS.muted, marginTop: 2 },
// ─── Live states ─────────────────────────────────────────
}));
