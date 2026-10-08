import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../shared/theme';
import { Button, Sheet } from '../shared/ui';
import { ArrowRightIcon, MessageCircleIcon, PhoneCallIcon } from '../shared/icons';
import { DISPATCH_PHONE } from '../constants';
import { D } from './DispatchModal.styles';

export function DispatchModal({ isDispatchModalOpen, setIsDispatchModalOpen, dispatchMode, setDispatchMode, showToast }) {
  return (
    <Modal
      visible={isDispatchModalOpen}
      animationType="slide"
      transparent
      onRequestClose={() => setIsDispatchModalOpen(false)}
    >
      <View style={D.modalBackdrop}>
        <TouchableOpacity
          style={D.modalDismiss}
          onPress={() => setIsDispatchModalOpen(false)}
          activeOpacity={1}
          accessibilityLabel="Close dispatch contact"
        />
        <Sheet>
          <View style={D.handleRow}><View style={D.handle} /></View>

          {/* Dispatch Info */}
          <View style={D.dispatchRow}>
            <View style={D.dispatchAvatar}>
              <Text style={D.dispatchAvatarText}>HQ</Text>
            </View>
            <View style={D.dispatchInfo}>
              <Text style={D.dispatchName}>Transit Dispatch</Text>
              <Text style={D.dispatchRole}>Central Command Center</Text>
              <Text style={D.dispatchPhone}>{DISPATCH_PHONE}</Text>
            </View>
            <View style={D.onlineChip}>
              <View style={D.onlineDot} />
              <Text style={D.onlineText}>24/7</Text>
            </View>
          </View>

          {/* Mode Tabs */}
          <View style={D.modeTabs} accessibilityRole="tablist">
            <TouchableOpacity
              style={[D.modeTab, dispatchMode === 'call' && D.modeTabActive]}
              onPress={() => setDispatchMode('call')}
              activeOpacity={0.8}
              accessibilityRole="tab"
              accessibilityState={{ selected: dispatchMode === 'call' }}
            >
              <PhoneCallIcon color={dispatchMode === 'call' ? '#FFF' : COLORS.muted} size={14} />
              <Text style={[D.modeTabText, dispatchMode === 'call' && D.modeTabTextActive]}>
                Call Dispatch
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[D.modeTab, dispatchMode === 'message' && D.modeTabActive]}
              onPress={() => setDispatchMode('message')}
              activeOpacity={0.8}
              accessibilityRole="tab"
              accessibilityState={{ selected: dispatchMode === 'message' }}
            >
              <MessageCircleIcon color={dispatchMode === 'message' ? '#FFF' : COLORS.muted} size={14} />
              <Text style={[D.modeTabText, dispatchMode === 'message' && D.modeTabTextActive]}>
                Send Message
              </Text>
            </TouchableOpacity>
          </View>

          {dispatchMode === 'call' ? (
            <View style={D.callView}>
              <Text style={D.callLabel}>Direct dispatch line</Text>
              <Text style={D.callNumber}>{DISPATCH_PHONE}</Text>
              <Text style={D.callNote}>
                Contact for route changes, incidents, or operational support.
              </Text>
              <Button
                title="Start call"
                tone="ink"
                icon={<PhoneCallIcon color={COLORS.accent} size={18} />}
                onPress={() => {
                  setIsDispatchModalOpen(false);
                  showToast(`Calling Transit Dispatch at ${DISPATCH_PHONE}...`);
                }}
              />
            </View>
          ) : (
            <View style={D.messageView}>
              <Text style={D.callLabelLeft}>Quick dispatch messages</Text>
              {[
                'Running behind schedule. Update ETA.',
                'Mechanical issue. Need assistance.',
                'Route obstruction. Seeking alternative.',
                'Arrived at terminus. Shift complete.',
              ].map((msg, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={D.quickMsgBtn}
                  activeOpacity={0.8}
                  onPress={() => {
                    setIsDispatchModalOpen(false);
                    showToast(`Message sent: "${msg}"`);
                  }}
                >
                  <Text style={D.quickMsgText}>{msg}</Text>
                  <ArrowRightIcon color={COLORS.accentText} size={14} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Sheet>
      </View>
    </Modal>
  );
}
