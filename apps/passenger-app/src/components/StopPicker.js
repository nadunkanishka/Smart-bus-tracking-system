import React from 'react';
import { Tap } from '../shared/ui';
import { Text, View } from 'react-native';
import { COLORS } from '../shared/theme';
import { CheckIcon, ChevronDownIcon } from '../shared/icons';
import { useS } from './StopPicker.styles';

// One stop as a flat block: white for where you board, blue for where you are going. Opens a short list below it.
export function StopPicker({ label, tone = 'white', value, expanded, onToggle, stops, onPick, alignRight }) {
  const S = useS();
  const blue = tone === 'blue';
  return (
    <View style={S.stopSelectorCol}>
      <Tap
        style={[S.block, blue ? S.blockBlue : S.blockWhite]}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`${label} stop: ${value || 'none'}`}
      >
        <Text style={[S.stopSelectorLabel, blue && S.onBlueMuted]}>{label}</Text>
        <View style={S.valueRow}>
          <Text style={[S.stopSelectorValue, blue && S.onBlue]} numberOfLines={2}>{value || '—'}</Text>
          <ChevronDownIcon color={blue ? COLORS.onBlue : COLORS.ink} size={16} />
        </View>
      </Tap>
      {expanded && (
        <View style={[S.stopInlineList, alignRight && S.stopInlineListRight]}>
          {stops.map((stop, idx) => (
            <Tap
              key={idx}
              style={[S.stopInlineItem, value === stop && S.stopInlineItemActive]}
              onPress={() => onPick(stop)}
            >
              <Text style={[S.stopInlineText, value === stop && S.stopInlineTextActive]}>{stop}</Text>
              {value === stop && <CheckIcon color={COLORS.onBright} size={12} />}
            </Tap>
          ))}
        </View>
      )}
    </View>
  );
}
