import React from 'react';
import { Text, View } from 'react-native';
import { S } from './ConnectionChip.styles';

export function ConnectionChip({ conn }) {
  const live = conn === 'connected';
  return (
    <View style={[S.liveChip, !live && S.liveChipOff]} accessibilityLabel={live ? 'Live connection' : conn === 'connecting' ? 'Connecting' : 'Disconnected'}>
      <View style={[S.liveDot, !live && S.liveDotOff]} />
      <Text style={S.liveText}>{live ? 'LIVE' : conn === 'connecting' ? 'CONNECTING' : 'OFFLINE'}</Text>
    </View>
  );
}
