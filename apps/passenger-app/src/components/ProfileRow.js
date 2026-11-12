import React from 'react';
import { Text, View } from 'react-native';
import { useS } from './ProfileRow.styles';

export function ProfileRow({ label, value, accent, last }) {
  const S = useS();
  return (
    <View style={[S.profileRow, last && S.profileRowLast]}>
      <Text style={S.profileRowLabel}>{label}</Text>
      <Text style={[S.profileRowValue, accent && S.profileRowValueAccent]}>{value}</Text>
    </View>
  );
}
