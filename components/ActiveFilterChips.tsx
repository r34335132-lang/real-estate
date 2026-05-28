import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface Chip {
  key: string;
  label: string;
}

interface ActiveFilterChipsProps {
  chips: Chip[];
  onRemove: (key: string) => void;
  onOpenFilters: () => void;
  onClearAll?: () => void;
}

export function ActiveFilterChips({ chips, onRemove, onOpenFilters, onClearAll }: ActiveFilterChipsProps) {
  if (chips.length === 0) {
    return (
      <TouchableOpacity style={styles.filterTrigger} onPress={onOpenFilters} activeOpacity={0.85}>
        <Feather name="sliders" size={16} color="#0F6BFF" />
        <Text style={styles.filterTriggerText}>Filtros</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.row}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.filterTrigger} onPress={onOpenFilters} activeOpacity={0.85}>
          <Feather name="sliders" size={16} color="#0F6BFF" />
        </TouchableOpacity>
        {chips.map((chip) => (
          <TouchableOpacity
            key={chip.key}
            style={styles.chip}
            onPress={() => onRemove(chip.key)}
            activeOpacity={0.8}
          >
            <Text style={styles.chipText}>{chip.label}</Text>
            <Feather name="x" size={14} color="#0F6BFF" />
          </TouchableOpacity>
        ))}
        {onClearAll ? (
          <TouchableOpacity onPress={onClearAll} style={styles.clearBtn}>
            <Text style={styles.clearText}>Limpiar</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  scroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },
  filterTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF3FF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(15,107,255,0.2)',
  },
  filterTriggerText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#0F6BFF',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#071B33',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  chipText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#fff',
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  clearText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#0F6BFF',
  },
});
