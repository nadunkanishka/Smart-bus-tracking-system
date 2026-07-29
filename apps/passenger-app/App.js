import React from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar } from 'react-native';
import SearchCapsule from './src/components/SearchCapsule';
import OpenStreetMapContainer from './src/components/OpenStreetMapContainer';
import ArrivalBottomSheet from './src/components/ArrivalBottomSheet';
import { COLORS } from './src/constants/theme';

export default function App() {
  const handleSearchSubmit = (query) => {
    console.log('Searching route or stop:', query);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.zinc50} />
      
      <View style={styles.rootContainer}>
        {/* Layer 1: Interactive OpenStreetMap Tile Canvas */}
        <OpenStreetMapContainer busLocationName="High Level Rd" etaMins={4} />

        {/* Layer 2: Top Floating Search Capsule */}
        <SearchCapsule onSearchSubmit={handleSearchSubmit} />

        {/* Layer 3: Expandable Bottom Sheet */}
        <View style={styles.bottomSheetPositioner}>
          <ArrivalBottomSheet
            etaMins={4}
            vehicleNumber="NB-4521"
            routeName="Route 138 • Pettah - Maharagama"
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
  bottomSheetPositioner: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
