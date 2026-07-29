import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, StatusBar } from 'react-native';
import HeaderBar from './src/components/HeaderBar';
import GoogleMapContainer from './src/components/GoogleMapContainer';
import DutyToggleButton from './src/components/DutyToggleButton';
import DiagnosticsFooter from './src/components/DiagnosticsFooter';
import { COLORS, TYPOGRAPHY, LAYOUT } from './src/constants/theme';

export default function App() {
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('CONNECTED');

  const handleToggleDuty = () => {
    setIsOnDuty(prev => !prev);
  };

  const handleCycleConnectionStatus = () => {
    if (connectionStatus === 'CONNECTED') {
      setConnectionStatus('BUFFERING');
    } else if (connectionStatus === 'BUFFERING') {
      setConnectionStatus('DISCONNECTED');
    } else {
      setConnectionStatus('CONNECTED');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.zinc50} />
      
      <View style={styles.rootContainer}>
        {/* Layer 1: Google Maps API Canvas Container */}
        <GoogleMapContainer isOnDuty={isOnDuty} routeName="138" />

        {/* Centered Main Container Framing */}
        <View style={styles.centeredLayoutFrame}>
          <HeaderBar
            connectionStatus={connectionStatus}
            driverId="DRV-8804"
            vehicleNumber="NB-4521"
            onToggleSimulateConnection={handleCycleConnectionStatus}
          />

          <View style={styles.routeCardWrapper}>
            <View style={styles.routeCard}>
              <Text style={styles.microLabel}>ASSIGNED ROUTE</Text>
              <Text style={styles.routeTitle}>Route 138 • Pettah - Maharagama</Text>
              <Text style={styles.routeBodyText}>High Level Road Segment • Express Service</Text>
            </View>
          </View>
        </View>

        {/* Bottom Floating Control Group */}
        <View style={styles.bottomControlGroup}>
          <DutyToggleButton
            isOnDuty={isOnDuty}
            onToggleDuty={handleToggleDuty}
          />

          <DiagnosticsFooter
            isOnDuty={isOnDuty}
            offlinePacketsCount={connectionStatus === 'BUFFERING' ? 12 : 0}
            lastGpsFix={isOnDuty ? 'High Fix (4m accuracy)' : 'Standby'}
            socketId="sock_drv_138_live"
            latencyMs={connectionStatus === 'CONNECTED' ? 16 : 140}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.zinc50,
  },
  rootContainer: {
    flex: 1,
    position: 'relative',
    justifyContent: 'space-between',
    backgroundColor: COLORS.zinc50,
  },
  centeredLayoutFrame: {
    width: '100%',
    maxWidth: 768,
    alignSelf: 'center',
    zIndex: 10,
  },
  routeCardWrapper: {
    paddingHorizontal: LAYOUT.screenPadding,
    marginTop: 12,
  },
  routeCard: {
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius2Xl,
    padding: LAYOUT.cardPadding,
    borderWidth: 1,
    borderColor: 'rgba(228, 228, 231, 0.8)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  microLabel: {
    color: COLORS.zinc400,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  routeTitle: {
    color: COLORS.zinc900,
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  routeBodyText: {
    color: COLORS.zinc500,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.regular,
    marginTop: 4,
  },
  bottomControlGroup: {
    width: '100%',
    maxWidth: 768,
    alignSelf: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
