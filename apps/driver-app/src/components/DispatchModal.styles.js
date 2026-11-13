import { StyleSheet } from 'react-native';
import { createStyles } from '../shared/themeRuntime';
import { COLORS, RADII, SPACE } from '../shared/theme';
import { type } from '../styles/common';

export const useD = createStyles(() => StyleSheet.create({
  handleRow: { alignItems: 'center', paddingBottom: SPACE[4] },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.line },
  dispatchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceSoft, borderRadius: RADII.lg, padding: SPACE[4], marginBottom: SPACE[4], gap: SPACE[3] },
  dispatchAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center' },
  dispatchAvatarText: { ...type('bodyBold'), color: COLORS.primaryDeep },
  dispatchInfo: { flex: 1 },
  dispatchName: { ...type('bodyBold'), color: COLORS.ink },
  dispatchRole: { ...type('caption'), color: COLORS.muted, marginTop: 2 },
  dispatchPhone: { ...type('smallBold'), color: COLORS.accentText, marginTop: SPACE[1] },
  onlineChip: { flexDirection: 'row', alignItems: 'center', gap: SPACE[1], backgroundColor: COLORS.successSoft, paddingHorizontal: SPACE[3], paddingVertical: SPACE[1], borderRadius: RADII.pill },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
  onlineText: { ...type('caption'), color: COLORS.success },
  modeTabs: { flexDirection: 'row', backgroundColor: COLORS.surfaceSoft, borderRadius: RADII.pill, padding: SPACE[1], marginBottom: SPACE[6] },
  modeTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE[2], minHeight: 44, borderRadius: RADII.pill },
  modeTabActive: { backgroundColor: COLORS.ink },
  modeTabText: { ...type('smallBold'), color: COLORS.muted },
  modeTabTextActive: { color: COLORS.white },
  callView: { alignItems: 'center' },
  callLabel: { ...type('overline'), color: COLORS.muted, textTransform: 'uppercase', marginBottom: SPACE[2] },
  callLabelLeft: { ...type('overline'), color: COLORS.muted, textTransform: 'uppercase', marginBottom: SPACE[3], alignSelf: 'flex-start' },
  callNumber: { ...type('display'), color: COLORS.ink, marginBottom: SPACE[2], fontVariant: ['tabular-nums'] },
  callNote: { ...type('small'), color: COLORS.muted, textAlign: 'center', marginBottom: SPACE[6] },
  messageView: { width: '100%' },
  quickMsgBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE[3],
    backgroundColor: COLORS.surfaceSoft, borderRadius: RADII.md, paddingHorizontal: SPACE[4], minHeight: 56, marginBottom: SPACE[2],
  },
  quickMsgText: { ...type('body'), color: COLORS.ink, flex: 1 },
}));
