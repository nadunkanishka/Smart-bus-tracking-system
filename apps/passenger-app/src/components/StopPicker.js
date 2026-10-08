import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../shared/theme';
import { CheckIcon, ChevronDownIcon } from '../shared/icons';
import { S } from './StopPicker.styles';

export function StopPicker({ label, dotStyle, value, expanded, onToggle, stops, onPick, alignRight }) {
  return (
    <View style={S.stopSelectorCol}>
      <View style={S.stopSelectorHeader}>
        <View style={dotStyle} />
        <Text style={S.stopSelectorLabel}>{label}</Text>
      </View>
      <TouchableOpacity
        style={S.stopSelectorBtn}
        onPress={onToggle}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${label} stop: ${value || 'none'}`}
      >
        <Text style={S.stopSelectorValue} numberOfLines={1}>{value || '—'}</Text>
        <ChevronDownIcon color={COLORS.accentText} size={14} />
      </TouchableOpacity>
      {expanded && (
        <View style={[S.stopInlineList, alignRight && S.stopInlineListRight]}>
          {stops.map((stop, idx) => (
            <TouchableOpacity
              key={idx}
              style={[S.stopInlineItem, value === stop && S.stopInlineItemActive]}
              onPress={() => onPick(stop)}
              activeOpacity={0.8}
            >
              <Text style={[S.stopInlineText, value === stop && S.stopInlineTextActive]}>{stop}</Text>
              {value === stop && <CheckIcon color={COLORS.accentText} size={12} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
