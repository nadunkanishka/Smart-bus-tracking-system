import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, TYPOGRAPHY, LAYOUT } from '../constants/theme';

export default function HeaderBar({ connectionStatus, driverId, vehicleNumber, onToggleSimulateConnection }) {
  const getStatusDotColor = () => {
    switch (connectionStatus) {
      case 'CONNECTED':
        return COLORS.signalGreen;
      case 'BUFFERING':
        return COLORS.signalAmber;
      case 'DISCONNECTED':
      default:
        return COLORS.signalRed;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'CONNECTED':
        return 'Online';
      case 'BUFFERING':
        return 'Buffering';
      case 'DISCONNECTED':
      default:
        return 'Offline';
    }
  };

  return (
    <View style={styles.headerCardWrapper}>
      <View style={styles.headerCard}>
        {/* App Title & Subhead */}
        <View style={styles.titleGroup}>
          <Text style={styles.appTitle}>Driver Portal</Text>
          <Text style={styles.subTitleText}>
            Vehicle {vehicleNumber || 'NB-4521'} • ID {driverId || 'DRV-8804'}
          </Text>
        </View>

        {/* Connection Status Pill */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onToggleSimulateConnection}
          style={styles.statusPill}
          accessibilityRole="button"
          accessibilityHint="Tap to toggle websocket connection state"
        >
          <View style={[styles.statusDot, { backgroundColor: getStatusDotColor() }]} />
          <Text style={styles.statusPillText}>{getStatusText()}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerCardWrapper: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingTop: 16,
    zIndex: 20,
  },
  headerCard: {
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius2Xl, // rounded-2xl
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(228, 228, 231, 0.8)', // border-zinc-200/60
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  titleGroup: {
    flexDirection: 'column',
  },
  appTitle: {
    color: COLORS.zinc900,
    fontSize: TYPOGRAPHY.sizes.xxl, // text-2xl
    fontWeight: TYPOGRAPHY.weights.semibold, // font-semibold
    letterSpacing: -0.5,
  },
  subTitleText: {
    color: COLORS.zinc500,
    fontSize: TYPOGRAPHY.sizes.sm, // text-sm
    fontWeight: TYPOGRAPHY.weights.medium,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.zinc50,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: LAYOUT.borderRadiusXl,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 8,
  },
  statusPillText: {
    color: COLORS.zinc900,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
});
