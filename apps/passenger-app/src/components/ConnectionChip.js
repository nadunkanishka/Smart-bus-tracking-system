import React from 'react';
import { Text, View } from 'react-native';
import { COLORS } from '../shared/theme';
import { LiveDot } from '../shared/ui';
import { useS } from './ConnectionChip.styles';

export function ConnectionChip({ conn }) {
  const S = useS();
  const live = conn === 'connected';
  return (
    <View style={[S.liveChip, !live && S.liveChipOff]} accessibilityLabel={live ? 'Live connection' : conn === 'connecting' ? 'Connecting' : 'Disconnected'}>
      <LiveDot color={live ? COLORS.green : COLORS.mutedLight} size={8} />
      <Text style={S.liveText}>{live ? 'LIVE' : conn === 'connecting' ? 'CONNECTING' : 'OFFLINE'}</Text>
    </View>
  );
}
