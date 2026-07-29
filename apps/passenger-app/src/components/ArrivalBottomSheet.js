import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, TYPOGRAPHY, LAYOUT } from '../constants/theme';

export default function ArrivalBottomSheet({ etaMins = 4, vehicleNumber = 'NB-4521', routeName = '138 Pettah - Maharagama' }) {
  const stops = [
    { id: '1', name: 'Delkanda Junction', eta: 'Live Location', isLiveBus: true },
    { id: '2', name: 'Nugegoda Flyover', eta: '2 mins', isLiveBus: false },
    { id: '3', name: 'Kirulapone Junction', eta: '4 mins (Your Destination)', isLiveBus: false, isUserStop: true },
    { id: '4', name: 'Havelock Town', eta: '7 mins', isLiveBus: false },
    { id: '5', name: 'Pettah Central', eta: '14 mins', isLiveBus: false },
  ];

  return (
    <View style={styles.sheetWrapper}>
      <View style={styles.sheetCard}>
        <View style={styles.dragPill} />

        {/* Hero ETA Box */}
        <View style={styles.heroEtaCard}>
          <View style={styles.heroHeaderRow}>
            <Text style={styles.microLabel}>ESTIMATED ARRIVAL</Text>
            <View style={styles.vehicleBadge}>
              <Text style={styles.vehicleBadgeText}>{vehicleNumber}</Text>
            </View>
          </View>
          <Text style={styles.heroEtaText}>{etaMins} MINS AWAY</Text>
          <Text style={styles.routeSubtitle}>{routeName}</Text>
        </View>

        {/* Timeline Stepper Section Header */}
        <Text style={[styles.microLabel, { marginTop: 16, marginBottom: 12 }]}>LIVE ROUTE TIMELINE</Text>

        <ScrollView style={styles.timelineList} showsVerticalScrollIndicator={false}>
          {stops.map((stop, index) => (
            <View key={stop.id} style={styles.timelineRow}>
              {/* Stepper Node Column */}
              <View style={styles.nodeCol}>
                {stop.isLiveBus ? (
                  <View style={styles.liveGreenDot} />
                ) : (
                  <View style={[styles.standardDot, stop.isUserStop && styles.userStopDot]} />
                )}
                {index < stops.length - 1 && <View style={styles.timelineLine} />}
              </View>

              {/* Stop Name & ETA */}
              <View style={styles.stopDetailCol}>
                <Text style={[styles.stopNameText, stop.isUserStop && styles.userStopName]}>
                  {stop.name}
                </Text>
                <Text style={[styles.stopEtaText, stop.isLiveBus && styles.liveEtaText]}>
                  {stop.eta}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetWrapper: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingBottom: 24,
    maxWidth: 768,
    alignSelf: 'center',
    width: '100%',
    zIndex: 25,
  },
  sheetCard: {
    backgroundColor: COLORS.white, // bg-white
    borderRadius: LAYOUT.borderRadius2Xl, // rounded-2xl
    padding: LAYOUT.cardPadding, // p-6
    borderWidth: 1,
    borderColor: 'rgba(228, 228, 231, 0.8)', // border border-zinc-200/60
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    maxHeight: 380,
  },
  dragPill: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.zinc200,
    alignSelf: 'center',
    marginBottom: 16,
  },
  heroEtaCard: {
    backgroundColor: COLORS.zinc50,
    borderRadius: LAYOUT.borderRadiusXl, // rounded-xl
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  microLabel: {
    color: COLORS.zinc400, // text-zinc-400
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
    letterSpacing: 1.2, // uppercase tracking-wider
  },
  vehicleBadge: {
    backgroundColor: COLORS.zinc900,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  vehicleBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  heroEtaText: {
    color: COLORS.zinc900, // text-zinc-900
    fontSize: TYPOGRAPHY.sizes.heroEta, // text-2xl/30pt
    fontWeight: TYPOGRAPHY.weights.bold,
    letterSpacing: -0.5,
  },
  routeSubtitle: {
    color: COLORS.zinc500, // text-zinc-500
    fontSize: TYPOGRAPHY.sizes.sm, // text-sm
    fontWeight: TYPOGRAPHY.weights.regular,
    marginTop: 2,
  },
  timelineList: {
    maxHeight: 180,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 38,
  },
  nodeCol: {
    width: 24,
    alignItems: 'center',
  },
  liveGreenDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.signalGreen,
    marginTop: 2,
    borderWidth: 2,
    borderColor: COLORS.white,
    zIndex: 2,
  },
  standardDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.zinc900,
    marginTop: 4,
    zIndex: 2,
  },
  userStopDot: {
    backgroundColor: COLORS.signalBlue,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.zinc200,
    marginVertical: 2,
  },
  stopDetailCol: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 8,
  },
  stopNameText: {
    color: COLORS.zinc900,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  userStopName: {
    color: COLORS.signalBlue,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  stopEtaText: {
    color: COLORS.zinc500,
    fontSize: TYPOGRAPHY.sizes.xs,
  },
  liveEtaText: {
    color: COLORS.signalGreen,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});
