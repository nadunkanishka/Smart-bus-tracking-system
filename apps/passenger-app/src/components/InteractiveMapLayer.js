import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../constants/theme';

export default function InteractiveMapLayer({ busLocationName = 'High Level Rd', etaMins = 4 }) {
  const headingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(headingAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(headingAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [headingAnim]);

  const translateY = headingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });

  return (
    <View style={styles.osmContainer}>
      {/* OpenStreetMap Vector Grid Canvas */}
      <View style={styles.osmGrid}>
        {/* OpenStreetMap Road Network */}
        <View style={styles.osmMainRoad} />
        <View style={styles.osmCrossRoad} />

        {/* Uber Blue Polyline Layer (#276EF1) */}
        <View style={styles.osmPolylineBlue} />

        {/* OpenStreetMap Animated Bus Marker */}
        <Animated.View style={[styles.osmBusMarker, { transform: [{ translateY }] }]}>
          <View style={styles.busBadge}>
            <View style={styles.greenPulseDot} />
            <Text style={styles.busBadgeText}>🚌 NB-4521 (Route 138)</Text>
          </View>
        </Animated.View>

        {/* OpenStreetMap Passenger Stop Pin */}
        <View style={styles.osmPassengerPin}>
          <View style={styles.pinDot} />
          <Text style={styles.pinLabel}>Your Stop (Kirulapone)</Text>
        </View>

        {/* OpenStreetMap Map Branding Watermark */}
        <View style={styles.osmWatermark}>
          <Text style={styles.watermarkText}>© OpenStreetMap contributors</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  osmContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F2F4F7', // OpenStreetMap light map canvas tint
  },
  osmGrid: {
    flex: 1,
    position: 'relative',
  },
  osmMainRoad: {
    position: 'absolute',
    top: '42%',
    left: '-10%',
    width: '120%',
    height: 22,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '-10deg' }],
  },
  osmCrossRoad: {
    position: 'absolute',
    top: '10%',
    left: '40%',
    width: 14,
    height: '80%',
    backgroundColor: '#FFFFFF',
  },
  osmPolylineBlue: {
    position: 'absolute',
    top: '44%',
    left: '12%',
    width: '72%',
    height: 7,
    backgroundColor: COLORS.signalBlue, // High-contrast #276EF1
    borderRadius: 3.5,
    transform: [{ rotate: '-10deg' }],
  },
  osmBusMarker: {
    position: 'absolute',
    top: '38%',
    left: '40%',
    zIndex: 15,
  },
  busBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.zinc900,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  greenPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.signalGreen,
    marginRight: 6,
  },
  busBadgeText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  osmPassengerPin: {
    position: 'absolute',
    top: '48%',
    left: '72%',
    alignItems: 'center',
  },
  pinDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.signalBlue,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  pinLabel: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.zinc900,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
  },
  osmWatermark: {
    position: 'absolute',
    bottom: 120,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  watermarkText: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.zinc500,
  },
});
