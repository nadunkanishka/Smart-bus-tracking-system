import React from 'react';
import { Tap } from '../shared/ui';
import { Text, View } from 'react-native';
import { COLORS } from '../shared/theme';
import { CheckIcon, ChevronDownIcon } from '../shared/icons';
import { useS } from './StopPicker.styles';

export function StopPicker({ label, dotStyle, value, expanded, onToggle, stops, onPick, alignRight }) {
  const S = useS();
  return (
    <View style={S.stopSelectorCol}>
      <View style={S.stopSelectorHeader}>
        <View style={dotStyle} />
        <Text style={S.stopSelectorLabel}>{label}</Text>
      </View>
      <Tap
        style={S.stopSelectorBtn}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`${label} stop: ${value || 'none'}`}
      >
        <Text style={S.stopSelectorValue} numberOfLines={1}>{value || '—'}</Text>
        <ChevronDownIcon color={COLORS.accentText} size={14} />
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
              {value === stop && <CheckIcon color={COLORS.accentText} size={12} />}
            </Tap>
          ))}
        </View>
      )}
    </View>
  );
}
