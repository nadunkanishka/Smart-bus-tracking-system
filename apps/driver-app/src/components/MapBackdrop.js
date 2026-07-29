import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../constants/theme';

export default function MapBackdrop({ isOnDuty, routeName }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let anim;
    if (isOnDuty) {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 2.0,
            duration: 1100,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
      anim.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      if (anim) anim.stop();
    };
  }, [isOnDuty, pulseAnim]);

  return (
    <View style={styles.mapCanvas}>
      {/* OpenStreetMap Tile Grid Emulation */}
      <View style={styles.roadNetwork}>
        <View style={styles.highwayLine} />
        <View style={styles.crossRoadLine} />
        <View style={styles.osmRoutePolyline} />

        {/* Bus Marker & Active Telemetry Pulse */}
        <View style={styles.busMarkerPosition}>
          {isOnDuty && (
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 2.0],
                    outputRange: [0.6, 0],
                  }),
                },
              ]}
            />
          )}
          <View style={[styles.busMarkerDot, { backgroundColor: isOnDuty ? COLORS.signalGreen : COLORS.zinc900 }]}>
            <Text style={styles.busEmoji}>🚌</Text>
          </View>
          <View style={styles.plateTag}>
            <Text style={styles.plateTagText}>NB-4521</Text>
          </View>
        </View>
      </View>

      {/* OpenStreetMap Attribution */}
      <View style={styles.osmAttribution}>
        <Text style={styles.attributionText}>© OpenStreetMap contributors</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapCanvas: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F2F4F7', // OpenStreetMap map canvas tint
    overflow: 'hidden',
  },
  roadNetwork: {
    flex: 1,
    position: 'relative',
  },
  highwayLine: {
    position: 'absolute',
    top: '38%',
    left: '-10%',
    width: '120%',
    height: 20,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '-15deg' }],
  },
  crossRoadLine: {
    position: 'absolute',
    top: '15%',
    left: '42%',
    width: 12,
    height: '80%',
    backgroundColor: '#FFFFFF',
  },
  osmRoutePolyline: {
    position: 'absolute',
    top: '40%',
    left: '12%',
    width: '70%',
    height: 7,
    backgroundColor: '#276EF1',
    borderRadius: 3.5,
    transform: [{ rotate: '-15deg' }],
  },
  busMarkerPosition: {
    position: 'absolute',
    top: '34%',
    left: '42%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.signalGreen,
  },
  busMarkerDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
    elevation: 4,
  },
  busEmoji: {
    fontSize: 13,
  },
  plateTag: {
    marginTop: 4,
    backgroundColor: COLORS.zinc900,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  plateTagText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  osmAttribution: {
    position: 'absolute',
    top: 90,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  attributionText: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.zinc500,
  },
});
