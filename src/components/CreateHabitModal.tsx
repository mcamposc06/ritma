import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHabitStore } from '../store/useHabitStore';
import { DayOfWeek, Habit } from '../types';

interface CreateHabitModalProps {
  visible: boolean;
  onClose: () => void;
  initialHabit?: Habit | null; // Pass a habit to edit
}

const COLORS = ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22'];

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'L' },
  { key: 'tuesday', label: 'M' },
  { key: 'wednesday', label: 'X' },
  { key: 'thursday', label: 'J' },
  { key: 'friday', label: 'V' },
  { key: 'saturday', label: 'S' },
  { key: 'sunday', label: 'D' },
];

export default function CreateHabitModal({ visible, onClose, initialHabit }: CreateHabitModalProps) {
  const { createHabit, updateHabit } = useHabitStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [colorHex, setColorHex] = useState(COLORS[0]);
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!initialHabit;

  // Initialize state when modal opens or initialHabit changes
  useEffect(() => {
    if (visible && initialHabit) {
      setTitle(initialHabit.title);
      setDescription(initialHabit.description || '');
      setColorHex(initialHabit.color_hex);
      setSelectedDays(initialHabit.frequency || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
    } else if (visible && !initialHabit) {
      resetFields();
    }
  }, [visible, initialHabit]);

  const resetFields = () => {
    setTitle('');
    setDescription('');
    setColorHex(COLORS[0]);
    setSelectedDays(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
  };

  const handleSave = async () => {
    if (!title.trim() || selectedDays.length === 0) return;
    
    setIsSubmitting(true);
    try {
      if (isEditing && initialHabit) {
        await updateHabit(initialHabit.id, {
          title: title.trim(),
          description: description.trim() || null,
          frequency: selectedDays,
          color_hex: colorHex
        });
      } else {
        await createHabit(title.trim(), description.trim() || undefined, selectedDays, colorHex);
      }
      resetFields();
      onClose();
    } catch (error) {
      console.error('Error saving habit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    resetFields();
    onClose();
  };

  const toggleDay = (day: DayOfWeek) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={resetAndClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{isEditing ? 'Editar Hábito' : 'Nuevo Hábito'}</Text>
              <TouchableOpacity onPress={resetAndClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formSection} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Título del Hábito</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Beber agua, Leer 20 páginas..."
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.label}>Días de la semana</Text>
              <View style={styles.daysSelector}>
                {DAYS.map(day => {
                  const isSelected = selectedDays.includes(day.key);
                  return (
                    <TouchableOpacity
                      key={day.key}
                      style={[
                        styles.dayCircle,
                        isSelected && { backgroundColor: colorHex, borderColor: colorHex }
                      ]}
                      onPress={() => toggleDay(day.key)}
                    >
                      <Text style={[
                        styles.dayText,
                        isSelected && styles.dayTextSelected
                      ]}>
                        {day.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>Descripción (Opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Agrega notas o detalles..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Color</Text>
              <View style={styles.colorSelector}>
                {COLORS.map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorCircle, 
                      { backgroundColor: color },
                      colorHex === color && styles.colorCircleSelected
                    ]}
                    onPress={() => setColorHex(color)}
                  >
                    {colorHex === color && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={[
                styles.submitButton, 
                ({ backgroundColor: colorHex }),
                (!title.trim() || isSubmitting || selectedDays.length === 0) && styles.submitButtonDisabled
              ]} 
              onPress={handleSave}
              disabled={!title.trim() || isSubmitting || selectedDays.length === 0}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>{isEditing ? 'Guardar Cambios' : 'Crear Hábito'}</Text>
              )}
            </TouchableOpacity>

          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  closeButton: {
    padding: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  formSection: {
    marginBottom: 20,
    maxHeight: 400,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  daysSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  dayTextSelected: {
    color: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  colorSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
  },
  colorCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButton: {
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
