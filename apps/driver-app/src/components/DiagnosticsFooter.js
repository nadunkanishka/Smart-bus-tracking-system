import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { COLORS, TYPOGRAPHY, LAYOUT } from '../constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function DiagnosticsFooter({ isOnDuty, offlinePacketsCount = 0, lastGpsFix, socketId, latencyMs = 24 }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={styles.footerContainer}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={toggleExpand}
        style={styles.summaryBar}
        accessibilityRole="button"
        accessibilityLabel="Diagnostics summary drawer"
      >
        <View style={styles.summaryRow}>
          <Text style={styles.broadcastText}>
            {isOnDuty ? '⚡ GPS Stream: Active (3s interval)' : '⏸ GPS Stream: Standby'}
          </Text>
          <Text style={styles.expandChevron}>{isExpanded ? '▼ HIDE DIAGNOSTICS' : '▲ TELEMETRY STATS'}</Text>
        </View>

        <View style={styles.bufferRow}>
          <Text style={[styles.bufferText, offlinePacketsCount > 0 && styles.bufferWarning]}>
            Buffer Queue: {offlinePacketsCount} Packets Pending
          </Text>
        </View>
      </TouchableOpacity>

      {/* Expanded Troubleshooting Details */}
      {isExpanded && (
        <View style={styles.expandedDetails}>
          <Text style={styles.detailHeader}>SOCKET & SENSOR DIAGNOSTICS</Text>

          <View style={styles.detailGrid}>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Socket Session</Text>
              <Text style={styles.detailValue}>{socketId || 'sock_uber_live_99'}</Text>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Latency</Text>
              <Text style={styles.detailValue}>{latencyMs} ms</Text>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>GPS Fix Quality</Text>
              <Text style={styles.detailValue}>{lastGpsFix || 'High (4m accuracy)'}</Text>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Sync Strategy</Text>
              <Text style={styles.detailValue}>Auto-Flush Queue</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    backgroundColor: COLORS.jetBlack,
    paddingHorizontal: LAYOUT.screenPadding,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    borderTopLeftRadius: LAYOUT.borderRadiusLg,
    borderTopRightRadius: LAYOUT.borderRadiusLg,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 20,
  },
  summaryBar: {
    paddingVertical: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  broadcastText: {
    color: COLORS.pureWhite,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  expandChevron: {
    color: COLORS.mutedCharcoal,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
    letterSpacing: 0.5,
  },
  bufferRow: {
    marginTop: 4,
  },
  bufferText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weights.regular,
  },
  bufferWarning: {
    color: COLORS.signalAmber,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  expandedDetails: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  detailHeader: {
    color: COLORS.signalBlue,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.heavy,
    letterSpacing: 1,
    marginBottom: 8,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailCard: {
    width: '48%',
    marginBottom: 8,
    backgroundColor: '#111827',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  detailLabel: {
    color: COLORS.mutedCharcoal,
    fontSize: 9,
    fontWeight: TYPOGRAPHY.weights.bold,
    textTransform: 'uppercase',
  },
  detailValue: {
    color: COLORS.pureWhite,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginTop: 2,
  },
});
