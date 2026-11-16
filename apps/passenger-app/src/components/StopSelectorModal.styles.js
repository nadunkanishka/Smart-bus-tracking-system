import { StyleSheet } from 'react-native';
import { createStyles } from '../shared/themeRuntime';
import { COLORS, RADII, SPACE } from '../shared/theme';
import { type } from '../shared/ui';

export const useS = createStyles(() => StyleSheet.create({
  listScroll: { flexShrink: 1 }, // the list scrolls inside the sheet instead of running off its top
  modalHandleRow: { alignItems: 'center', paddingBottom: SPACE[4] },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.outline },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACE[4] },
  modalTitle: { ...type('h1'), color: COLORS.ink },
  modalSectionLabel: { ...type('overline'), color: COLORS.muted, marginTop: SPACE[4], marginBottom: SPACE[2], textTransform: 'uppercase' },
  routeChipsRow: { gap: SPACE[2], paddingRight: SPACE[4] },

  tripRow: { flexDirection: 'row', alignItems: 'stretch', gap: SPACE[2], marginTop: SPACE[4] },
  tripBox: { flex: 1, minHeight: 96, borderRadius: RADII.lg, padding: SPACE[4], justifyContent: 'space-between', borderWidth: 2, borderColor: 'transparent' },
  tripFrom: { backgroundColor: COLORS.surfaceSoft },
  tripTo: { backgroundColor: COLORS.blue },
  tripActive: { borderColor: COLORS.orange },
  tripLabel: { ...type('overline'), color: COLORS.muted },
  tripLabelBlue: { ...type('overline'), color: COLORS.onBlue, opacity: 0.8 },
  tripStop: { ...type('h3'), color: COLORS.ink },
  tripStopBlue: { ...type('h3'), color: COLORS.onBlue },
  swap: { alignSelf: 'center', width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', marginHorizontal: -SPACE[4], zIndex: 2 },
  swapText: { ...type('h3'), color: COLORS.onCard },

  stopRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], minHeight: 64, borderRadius: RADII.md, paddingHorizontal: SPACE[3], marginBottom: SPACE[1], backgroundColor: COLORS.surfaceSoft },
  stopRowFrom: { backgroundColor: COLORS.primaryLight },
  stopRowTo: { backgroundColor: COLORS.blueSoft },
  stopNum: { width: 40, height: 40, borderRadius: 14, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  stopNumOn: { backgroundColor: COLORS.orange },
  stopNumText: { ...type('caption'), color: COLORS.ink },
  flexOne: { flex: 1 },
  stopName: { ...type('bodyBold'), color: COLORS.ink },
  stopNameOn: { color: COLORS.ink },
  stopSub: { ...type('caption'), color: COLORS.muted, marginTop: 2 },
  stopSubBlue: { color: COLORS.accentText },
}));
