import { StyleSheet } from 'react-native';
import { COLORS, RADII } from '../shared/theme';
import { type } from '../styles/common';

export const D = StyleSheet.create({
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,20,25,0.45)', justifyContent: 'flex-end' },
  modalDismiss: { flex: 1 },
  handleRow: { alignItems: 'center', paddingBottom: 16 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.line },
  dispatchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceSoft, borderRadius: RADII.lg, padding: 16, marginBottom: 16, gap: 12 },
  dispatchAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center' },
  dispatchAvatarText: { ...type('bodyBold'), color: COLORS.primaryDeep },
  dispatchInfo: { flex: 1 },
  dispatchName: { ...type('bodyBold'), color: COLORS.ink },
  dispatchRole: { ...type('caption'), color: COLORS.muted, marginTop: 2 },
  dispatchPhone: { ...type('smallBold'), color: COLORS.accentText, marginTop: 4 },
  onlineChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.successSoft, paddingHorizontal: 12, paddingVertical: 4, borderRadius: RADII.pill },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
  onlineText: { ...type('caption'), color: COLORS.success },
  modeTabs: { flexDirection: 'row', backgroundColor: COLORS.surfaceSoft, borderRadius: RADII.pill, padding: 4, marginBottom: 24 },
  modeTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, borderRadius: RADII.pill },
  modeTabActive: { backgroundColor: COLORS.ink },
  modeTabText: { ...type('smallBold'), color: COLORS.muted },
  modeTabTextActive: { color: COLORS.white },
  callView: { alignItems: 'center' },
  callLabel: { ...type('overline'), color: COLORS.muted, textTransform: 'uppercase', marginBottom: 8 },
  callLabelLeft: { ...type('overline'), color: COLORS.muted, textTransform: 'uppercase', marginBottom: 12, alignSelf: 'flex-start' },
  callNumber: { ...type('display'), color: COLORS.ink, marginBottom: 8, fontVariant: ['tabular-nums'] },
  callNote: { ...type('small'), color: COLORS.muted, textAlign: 'center', marginBottom: 24 },
  messageView: { width: '100%' },
  quickMsgBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    backgroundColor: COLORS.surfaceSoft, borderRadius: RADII.md, paddingHorizontal: 16, minHeight: 56, marginBottom: 8,
  },
  quickMsgText: { ...type('body'), color: COLORS.ink, flex: 1 },
});
