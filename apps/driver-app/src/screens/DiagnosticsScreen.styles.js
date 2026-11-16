import { StyleSheet } from 'react-native';
import { createStyles } from '../shared/themeRuntime';
import { COLORS, RADII, SPACE } from '../shared/theme';
import { buildCommon } from '../styles/common';
import { type } from '../shared/ui';

export const useD = createStyles(() => ({
  ...buildCommon(),
  ...StyleSheet.create({
    speedBlock: { backgroundColor: COLORS.orange, borderRadius: RADII.xl, padding: SPACE[5], marginBottom: SPACE[2], minHeight: 190, justifyContent: 'space-between' },
    speedLabel: { ...type('h3'), color: COLORS.onBright },
    speedRow: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACE[2] },
    speedValue: { fontSize: 112, lineHeight: 112, fontWeight: '300', letterSpacing: -6, color: COLORS.onBright },
    speedUnit: { ...type('h3'), color: COLORS.onBright, opacity: 0.75, paddingBottom: SPACE[3] },
    pairRow: { flexDirection: 'row', gap: SPACE[2], marginBottom: SPACE[2] },
    pair: { flex: 1, minHeight: 120, borderRadius: RADII.lg, padding: SPACE[4], justifyContent: 'space-between' },
    pairBlue: { backgroundColor: COLORS.blue },
    pairWhite: { backgroundColor: COLORS.surface },
    pairLabel: { ...type('caption'), color: COLORS.muted },
    pairLabelBlue: { ...type('caption'), color: COLORS.onBlue, opacity: 0.8 },
    pairValueRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2] },
    pairValueBlue: { ...type('h2'), color: COLORS.onBlue },
    gpsStatusDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.danger },
    coordText: { ...type('bodyBold'), color: COLORS.ink, fontVariant: ['tabular-nums'] },
    logCard: { backgroundColor: COLORS.card, borderRadius: RADII.xl, paddingHorizontal: SPACE[5], paddingVertical: SPACE[3] },
    emptyLogOnCard: { ...type('small'), color: COLORS.cardMuted, textAlign: 'center' },
    logRow: { minHeight: 44, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)' },
    logRowLast: { borderBottomWidth: 0 },
    logText: { ...type('small'), color: COLORS.onCard, fontVariant: ['tabular-nums'] },
  }),
}));
