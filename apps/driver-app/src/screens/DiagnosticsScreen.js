import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { COLORS } from '../shared/theme';
import { OverlapHeader, OverlapSheet, Vehicle } from '../shared/ui';
import { SpeedometerIcon } from '../shared/icons';
import { formatCoord } from '../utils';
import { D } from './DiagnosticsScreen.styles';

export function DiagnosticsScreen({ busSpeed, gpsStatus, driverCoordinate, logs, isOnShift }) {
  const gpsOk = gpsStatus === 'Connected';
  return (
    <ScrollView
      style={D.flex}
      contentContainerStyle={D.routeScroll}
      showsVerticalScrollIndicator={false}
    >
      <OverlapHeader minHeight={150}>
        <Text style={D.screenTitle}>Telemetry</Text>
        <Text style={D.screenSubHeader}>Live diagnostics & GPS transmission log</Text>
        <Vehicle name="minibus" width={116} style={D.headerBus} label="Illustrated minibus" />
      </OverlapHeader>

      <OverlapSheet>
        {/* Metrics Grid */}
        <View style={D.metricsRow}>
          <View style={D.metricCard}>
            <View style={D.metricIcon}><SpeedometerIcon color={COLORS.accentText} size={22} /></View>
            <Text style={D.metricVal}>{isOnShift ? busSpeed : 0}<Text style={D.metricUnit}> km/h</Text></Text>
            <Text style={D.metricLabel}>Speed</Text>
          </View>
          <View style={D.metricCard}>
            <View style={[D.metricIcon, { backgroundColor: gpsOk ? COLORS.successSoft : COLORS.dangerSoft }]}>
              <View style={[D.gpsStatusDot, { backgroundColor: gpsOk ? COLORS.success : COLORS.danger }]} />
            </View>
            <Text style={[D.metricValSm, { color: gpsOk ? COLORS.success : COLORS.danger }]}>
              {gpsStatus}
            </Text>
            <Text style={D.metricLabel}>GPS</Text>
          </View>
        </View>

        {/* Coordinates */}
        <View style={D.coordCard}>
          <Text style={D.sectionLabelFlat}>Current coordinates</Text>
          <Text style={D.coordText}>
            {driverCoordinate ? `${formatCoord(driverCoordinate.latitude)}, ${formatCoord(driverCoordinate.longitude)}` : 'No GPS fix yet'}
          </Text>
        </View>

        {/* Logs */}
        <Text style={D.sectionLabel}>GPS transmission log</Text>
        <View style={D.logCard}>
          {logs.length === 0 ? (
            <View style={D.emptyLogBox}>
              <Vehicle name="bus" status="idle" width={100} label="No GPS fixes yet" />
              <Text style={D.emptyLog}>No fixes recorded. Go on duty to broadcast.</Text>
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
