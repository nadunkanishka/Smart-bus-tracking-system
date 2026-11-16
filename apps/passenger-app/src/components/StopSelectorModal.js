import React, { useState } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { COLORS } from '../shared/theme';
import { Button, Chip, Sheet, Tap, SheetModal } from '../shared/ui';
import { CheckIcon } from '../shared/icons';
import { useS } from './StopSelectorModal.styles';

// One simple trip picker: choose the route (one scrolling row), then tap From or To and tap a stop in the list. Tapping a stop
// fills the active box and moves on to the other one. The swap button flips the trip. Each stop shows the live bus time.
// trip: the route list and stop selection from useRoutes.
export function StopSelectorModal({ visible, onClose, trip, tracked }) {
  const S = useS();
  const { height } = useWindowDimensions();
  const { routes, selectedRoute, selectRoute, boardingStop, setBoardingStop, destinationStop, setDestinationStop, boardingIndex, destinationIndex } = trip;
  const [target, setTarget] = useState('from'); // which box the next tap on a stop fills
  const pick = (stop) => {
    if (target === 'from') { setBoardingStop(stop); setTarget('to'); } else { setDestinationStop(stop); setTarget('from'); }
  };
  const swap = () => { const b = boardingStop; setBoardingStop(destinationStop); setDestinationStop(b); };
  return (
    <SheetModal visible={visible} onClose={onClose}>
      <Sheet>
        <View style={S.modalHandleRow}><View style={S.modalHandle} /></View>

        <View style={S.modalHeaderRow}>
          <Text style={S.modalTitle}>Your trip</Text>
          <Button title="Done" tone="primary" size="sm" full={false} onPress={onClose} />
        </View>

        <ScrollView style={[S.listScroll, { maxHeight: Math.round(height * 0.62) }]} showsVerticalScrollIndicator={false}>
          <Text style={S.modalSectionLabel}>Route</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.routeChipsRow}>
            {routes.map((r) => (
              <Chip key={r.id} label={r.shortName} selected={selectedRoute.id === r.id} onPress={() => { selectRoute(r); setTarget('from'); }} />
            ))}
          </ScrollView>

          <View style={S.tripRow}>
            <Tap style={[S.tripBox, S.tripFrom, target === 'from' && S.tripActive]} onPress={() => setTarget('from')} accessibilityRole="button" accessibilityLabel={`From: ${boardingStop || 'none'}`}>
              <Text style={S.tripLabel}>From</Text>
              <Text style={S.tripStop} numberOfLines={2}>{boardingStop || '—'}</Text>
            </Tap>
            <Tap style={S.swap} onPress={swap} accessibilityRole="button" accessibilityLabel="Swap from and to">
              <Text style={S.swapText}>⇄</Text>
            </Tap>
            <Tap style={[S.tripBox, S.tripTo, target === 'to' && S.tripActive]} onPress={() => setTarget('to')} accessibilityRole="button" accessibilityLabel={`To: ${destinationStop || 'none'}`}>
              <Text style={S.tripLabelBlue}>To</Text>
              <Text style={S.tripStopBlue} numberOfLines={2}>{destinationStop || '—'}</Text>
            </Tap>
          </View>

          <Text style={S.modalSectionLabel}>{target === 'from' ? 'Tap the stop you board at' : 'Tap the stop you get off at'}</Text>
          {selectedRoute.stops.map((stop, idx) => {
            const live = tracked?.bus.stops?.find((s) => s.name === stop); // the bus's stops run in its own direction
            const isPassed = live ? live.status === 'passed' : false;
            const isFrom = idx === boardingIndex;
            const isTo = idx === destinationIndex;
            return (
              <Tap key={idx} style={[S.stopRow, isFrom && S.stopRowFrom, isTo && S.stopRowTo]} onPress={() => pick(stop)} accessibilityRole="button" accessibilityLabel={`${stop}${isFrom ? ', from' : isTo ? ', to' : ''}`}>
                <View style={[S.stopNum, (isFrom || isTo) && S.stopNumOn]}>
                  {isPassed ? <CheckIcon color={COLORS.ink} size={12} /> : <Text style={S.stopNumText}>{String(idx + 1).padStart(2, '0')}</Text>}
                </View>
                <View style={S.flexOne}>
                  <Text style={[S.stopName, (isFrom || isTo) && S.stopNameOn]} numberOfLines={1}>{stop}</Text>
                  <Text style={[S.stopSub, isTo && S.stopSubBlue]}>
                    {isFrom ? 'From · ' : isTo ? 'To · ' : ''}{!live ? 'No live bus' : isPassed ? 'Bus passed' : `Bus in ${live.etaMin} min`}
                  </Text>
                </View>
              </Tap>
            );
          })}
        </ScrollView>
      </Sheet>
    </SheetModal>
  );
}
