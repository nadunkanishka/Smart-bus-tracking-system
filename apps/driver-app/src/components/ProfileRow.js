import React from 'react';
import { Text, View } from 'react-native';
import { useD } from './ProfileRow.styles';

export function ProfileRow({ label, value, accent, last }) {
  const D = useD();
  return (
    <View style={[D.profileRow, last && D.profileRowLast]}>
      <Text style={D.profileRowLabel}>{label}</Text>
      <Text style={[D.profileRowValue, accent && D.profileRowValueAccent]}>{value}</Text>
    </View>
  );
}
