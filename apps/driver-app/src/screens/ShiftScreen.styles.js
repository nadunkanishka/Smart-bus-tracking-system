import { StyleSheet } from 'react-native';
import { createStyles } from '../shared/themeRuntime';
import { COLORS, RADII, SPACE } from '../shared/theme';
import { buildCommon } from '../styles/common';
import { type } from '../shared/ui';

export const useD = createStyles(() => ({
  ...buildCommon(),
  ...StyleSheet.create({
    startRow: { flexDirection: 'row', gap: SPACE[2], marginBottom: SPACE[2] },
    startBlock: { flex: 1, minHeight: 100, borderRadius: RADII.lg, padding: SPACE[4], justifyContent: 'space-between' },
    startWhite: { backgroundColor: COLORS.surface },
    startBlue: { backgroundColor: COLORS.blue },
    startDim: { opacity: 0.55 },
    startLabel: { ...type('overline'), color: COLORS.muted },
    startStop: { ...type('h3'), color: COLORS.ink },
    startTick: { position: 'absolute', top: SPACE[3], right: SPACE[3], width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.orange },
    onBlue: { color: COLORS.onBlue },
    onBlueSoft: { color: COLORS.onBlue, opacity: 0.8 },
    onCardSoft: { color: COLORS.cardMuted },

    dutyBtn: { minHeight: 200, borderRadius: RADII.xl, padding: SPACE[6], justifyContent: 'space-between', marginBottom: SPACE[2] },
    dutyBtnOn: { backgroundColor: COLORS.orange },
    dutyBtnOff: { backgroundColor: COLORS.card },
    dutyBtnDisabled: { opacity: 0.5 },
    dutyIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.orange, alignItems: 'center', justifyContent: 'center' },
    dutyIconOn: { backgroundColor: COLORS.card },
    dutyState: { fontSize: 52, lineHeight: 56, fontWeight: '300', letterSpacing: -2, color: COLORS.onCard },
    dutyHint: { ...type('body'), color: COLORS.cardMuted },
    dutyTextOn: { color: COLORS.onBright },
    dutyHintOn: { color: COLORS.onBright, opacity: 0.75 },
    dutyNote: { ...type('small'), color: COLORS.warning, marginBottom: SPACE[3] },

    specsRow: { flexDirection: 'row', gap: SPACE[2], marginBottom: SPACE[2] },
    stat: { flex: 1, minHeight: 104, borderRadius: RADII.lg, padding: SPACE[4], justifyContent: 'space-between' },
    statWhite: { backgroundColor: COLORS.surface },
    statBlue: { backgroundColor: COLORS.blue },
    statBlack: { backgroundColor: COLORS.card },
    statLabel: { ...type('caption'), color: COLORS.muted },
    statValue: { ...type('h3') },
    statValueBig: { fontSize: 40, lineHeight: 44, fontWeight: '300', letterSpacing: -1.5 },

    detailBlock: { backgroundColor: COLORS.surface, borderRadius: RADII.xl, paddingHorizontal: SPACE[5], paddingVertical: SPACE[2] },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: SPACE[4], minHeight: 56, borderBottomWidth: 1, borderBottomColor: COLORS.line },
    detailLast: { borderBottomWidth: 0 },
    detailLabel: { ...type('small'), color: COLORS.muted },
    detailValue: { ...type('bodyBold'), color: COLORS.ink, flexShrink: 1, textAlign: 'right' },
  }),
}));
