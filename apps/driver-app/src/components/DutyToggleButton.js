import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { COLORS, TYPOGRAPHY, LAYOUT } from '../constants/theme';

export default function DutyToggleButton({ isOnDuty, onToggleDuty }) {
  const breathAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let anim;
    if (isOnDuty) {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(breathAnim, {
            toValue: 1.015,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(breathAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      anim.start();
    } else {
      breathAnim.setValue(1);
    }

    return () => {
      if (anim) anim.stop();
    };
  }, [isOnDuty, breathAnim]);

  return (
    <View style={styles.cardContainer}>
      <View style={styles.wrapperCard}>
        {/* Micro-copy Label */}
        <Text style={styles.microLabel}>DUTY STATUS CONTROL</Text>

        <Animated.View style={{ transform: [{ scale: breathAnim }], width: '100%', marginTop: 12 }}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={onToggleDuty}
            style={[
              styles.primaryActionBtn,
              {
                backgroundColor: isOnDuty ? COLORS.signalGreen : COLORS.zinc900,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={isOnDuty ? "On duty, tap to end duty" : "Off duty, tap to start duty"}
          >
            <View style={styles.btnContentRow}>
              <View style={[styles.indicatorDot, { backgroundColor: isOnDuty ? COLORS.white : COLORS.zinc400 }]} />
              <Text style={styles.primaryBtnText}>
                {isOnDuty ? 'YOU ARE ONLINE' : 'GO ON DUTY'}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.footNoteText}>
          Single-tap interaction • Zero distraction driving safety mode
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    paddingHorizontal: LAYOUT.screenPadding,
    marginTop: 16,
    marginBottom: 8,
    width: '100%',
  },
  wrapperCard: {
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.borderRadius2Xl, // rounded-2xl
    padding: LAYOUT.cardPadding, // p-6
    borderWidth: 1,
    borderColor: 'rgba(228, 228, 231, 0.8)', // border-zinc-200/60
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  microLabel: {
    color: COLORS.zinc400, // text-zinc-400
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
    letterSpacing: 1.2, // uppercase tracking-wider
  },
  primaryActionBtn: {
    width: '100%',
    height: 56, // rounded-xl action button height
    borderRadius: LAYOUT.borderRadiusXl, // rounded-xl
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    letterSpacing: 0.8,
  },
  footNoteText: {
    color: COLORS.zinc500, // text-zinc-500
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.regular,
    textAlign: 'center',
    marginTop: 14,
  },
});
