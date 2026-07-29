import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { COLORS, TYPOGRAPHY, LAYOUT } from '../constants/theme';

export default function SearchCapsule({ onSearchSubmit }) {
  const [query, setQuery] = useState('');

  return (
    <View style={styles.capsuleWrapper}>
      <View style={styles.searchCard}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.inputField}
          placeholder="Where to? / Enter Route or Stop..."
          placeholderTextColor={COLORS.zinc400}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => onSearchSubmit && onSearchSubmit(query)}
        />
        {query.length > 0 ? (
          <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.badgeTag}>
            <Text style={styles.badgeText}>Route 138</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  capsuleWrapper: {
    position: 'absolute',
    top: 20,
    left: LAYOUT.screenPadding,
    right: LAYOUT.screenPadding,
    maxWidth: 768,
    alignSelf: 'center',
    zIndex: 30,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white, // bg-white
    borderRadius: LAYOUT.borderRadius2Xl, // rounded-2xl
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(228, 228, 231, 0.8)', // border border-zinc-200/60
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  inputField: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.md, // text-sm / text-base
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.zinc900, // text-zinc-900
    padding: 0,
  },
  clearBtn: {
    padding: 4,
  },
  clearText: {
    color: COLORS.zinc400,
    fontSize: 14,
    fontWeight: 'bold',
  },
  badgeTag: {
    backgroundColor: COLORS.zinc50,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: LAYOUT.borderRadiusXl,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
  },
  badgeText: {
    color: COLORS.zinc900,
    fontSize: 12,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});
