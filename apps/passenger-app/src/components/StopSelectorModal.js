import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { COLORS } from '../shared/theme';
import { Button, Chip, Sheet, Tap, SheetModal } from '../shared/ui';
import { CheckIcon, ChevronDownIcon, FlagIcon, MapPinIcon } from '../shared/icons';
import { useS } from './StopSelectorModal.styles';

export function StopSelectorModal({
  isStopModalOpen, setIsStopModalOpen, routes, selectedRoute, selectRoute, isBoardingOpen,
  setIsBoardingOpen, isDestOpen, setIsDestOpen, boardingStop, setBoardingStop, destinationStop,
  setDestinationStop, tracked, boardingIndex, destinationIndex,
}) {
  const S = useS();
  return (
    <SheetModal visible={isStopModalOpen} onClose={() => setIsStopModalOpen(false)}>
        <Sheet>
          <View style={S.modalHandleRow}>
            <View style={S.modalHandle} />
          </View>

          <View style={S.modalHeaderRow}>
            <Text style={S.modalTitle}>Select Your Stops</Text>
            <Button title="Done" tone="primary" size="sm" full={false} onPress={() => setIsStopModalOpen(false)} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Route selector */}
            <Text style={S.modalSectionLabel}>Active route</Text>
            <View style={S.routeChipsRow}>
              {routes.map(r => (
                <Chip
                  key={r.id}
                  label={r.shortName}
                  selected={selectedRoute.id === r.id}
                  tone="primary"
                  onPress={() => {
                    selectRoute(r);
                    setIsBoardingOpen(false);
                    setIsDestOpen(false);
                  }}
                />
              ))}
            </View>

            {/* Boarding */}
            <Text style={[S.modalSectionLabel, S.modalSectionGap]}>Boarding stop</Text>
            <Tap
              style={S.dropdownTrigger}
              onPress={() => { setIsBoardingOpen(p => !p); setIsDestOpen(false); }}
            >
              <View style={S.dropdownTriggerLeft}>
                <MapPinIcon color={COLORS.accent} size={18} />
                <Text style={S.dropdownTriggerText}>{boardingStop || '—'}</Text>
              </View>
              <ChevronDownIcon color={COLORS.muted} size={16} />
            </Tap>
            {isBoardingOpen && (
              <View style={S.dropdownList}>
                {selectedRoute.stops.map((stop, idx) => (
                  <Tap
                    key={idx}
                    style={[S.dropdownItem, boardingStop === stop && S.dropdownItemActive]}
                    onPress={() => { setBoardingStop(stop); setIsBoardingOpen(false); }}
                  >
                    <Text style={[S.dropdownItemText, boardingStop === stop && S.dropdownItemTextActive]}>
                      {stop}
                    </Text>
                    {boardingStop === stop && <CheckIcon color={COLORS.accentText} size={14} />}
                  </Tap>
                ))}
              </View>
            )}

            {/* Destination */}
            <Text style={[S.modalSectionLabel, S.modalSectionGap]}>Destination stop</Text>
            <Tap
              style={S.dropdownTrigger}
              onPress={() => { setIsDestOpen(p => !p); setIsBoardingOpen(false); }}
            >
              <View style={S.dropdownTriggerLeft}>
                <FlagIcon color={COLORS.accent} size={18} />
                <Text style={S.dropdownTriggerText}>{destinationStop || '—'}</Text>
              </View>
              <ChevronDownIcon color={COLORS.muted} size={16} />
            </Tap>
            {isDestOpen && (
              <View style={S.dropdownList}>
                {selectedRoute.stops.map((stop, idx) => (
                  <Tap
                    key={idx}
                    style={[S.dropdownItem, destinationStop === stop && S.dropdownItemActive]}
                    onPress={() => { setDestinationStop(stop); setIsDestOpen(false); }}
                  >
                    <Text style={[S.dropdownItemText, destinationStop === stop && S.dropdownItemTextActive]}>
                      {stop}
                    </Text>
                    {destinationStop === stop && <CheckIcon color={COLORS.accentText} size={14} />}
                  </Tap>
                ))}
              </View>
            )}

            {/* Timeline: live arrival time at every stop for the tracked bus */}
            <Text style={[S.modalSectionLabel, S.modalSectionGapLg]}>Route timeline</Text>
            <View style={S.timelineContainer}>
              {selectedRoute.stops.map((stop, idx) => {
                const live = tracked?.bus.stops?.[idx];
                const isPassed = live ? live.status === 'passed' : false;
                const isBoarding = idx === boardingIndex;
                const isDestination = idx === destinationIndex;
                const isActive = idx > boardingIndex && idx <= destinationIndex;
                return (
                  <View key={idx} style={S.timelineRow}>
                    <View style={S.timelineLeft}>
                      <View style={[
                        S.timelineDot,
                        isPassed && S.dotPassed,
                        isBoarding && S.dotBoarding,
                        isDestination && S.dotDestination,
                        isActive && !isDestination && S.dotActive,
                      ]}>
                        {isPassed ? <CheckIcon color={COLORS.onBright} size={7} /> : null}
                      </View>
                      {idx < selectedRoute.stops.length - 1 && (
                        <View style={[S.timelineLineV, isPassed && S.lineVPassed]} />
                      )}
                    </View>
                    <View style={S.timelineRight}>
                      <Text style={[
                        S.timelineStopName,
                        (isBoarding || isDestination) && S.timelineStopNameHighlight,
                      ]}>
                        {stop}
                      </Text>
                      <Text style={S.timelineTag}>
                        {isBoarding ? 'Boarding stop · ' : isDestination ? 'Destination · ' : ''}
                        {!live ? 'No live bus' : isPassed ? 'Bus passed' : `Bus in ${live.etaMin} min`}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </Sheet>
    </SheetModal>
  );
}
