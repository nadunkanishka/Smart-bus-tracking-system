import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { COLORS } from '../shared/theme';
import { CountUp, LiveDot, OverlapSheet, Vehicle } from '../shared/ui';
import { formatCoord } from '../utils';
import { useD } from './DiagnosticsScreen.styles';

// Telemetry: speed as one huge number on the orange block, GPS on the blue block, the coordinates, then the log on black.
export function DiagnosticsScreen({ duty }) {
  const D = useD();
  const { busSpeed, gpsStatus, driverCoordinate, logs, isOnShift } = duty;
  const gpsOk = gpsStatus === 'Connected';
  const speed = isOnShift ? busSpeed : 0;
  return (
    <ScrollView style={D.flex} contentContainerStyle={D.routeScroll} showsVerticalScrollIndicator={false}>
      <OverlapSheet>
        <Text style={D.screenTitle}>Telemetry</Text>
        <Text style={D.screenSubHeader}>Live speed, GPS and the transmission log</Text>

        <View style={D.speedBlock}>
          <Text style={D.speedLabel}>Speed</Text>
          <View style={D.speedRow}>
            <CountUp value={speed} style={D.speedValue} />
            <Text style={D.speedUnit}>km/h</Text>
          </View>
        </View>

        <View style={D.pairRow}>
          <View style={[D.pair, D.pairBlue]}>
            <Text style={D.pairLabelBlue}>GPS</Text>
            <View style={D.pairValueRow}>
              {gpsOk ? <LiveDot color={COLORS.onBlue} size={12} /> : <View style={D.gpsStatusDot} />}
              <Text style={D.pairValueBlue}>{gpsStatus}</Text>
            </View>
          </View>
          <View style={[D.pair, D.pairWhite]}>
            <Text style={D.pairLabel}>Coordinates</Text>
            <Text style={D.coordText} numberOfLines={2}>
              {driverCoordinate ? `${formatCoord(driverCoordinate.latitude)}\n${formatCoord(driverCoordinate.longitude)}` : 'No GPS fix yet'}
            </Text>
          </View>
        </View>

        <Text style={D.sectionLabel}>GPS transmission log</Text>
        <View style={D.logCard}>
          {logs.length === 0 ? (
            <View style={D.emptyLogBox}>
              <Vehicle name="bus" status="idle" width={100} label="No GPS fixes yet" />
              <Text style={D.emptyLogOnCard}>No fixes recorded. Go on duty to broadcast.</Text>
            </View>
          ) : (
            logs.map((entry, idx) => (
              <View key={idx} style={[D.logRow, idx === logs.length - 1 && D.logRowLast]}>
                <Text style={D.logText}>{entry}</Text>
              </View>
            ))
          )}
        </View>
      </OverlapSheet>
    </ScrollView>
  );
}
