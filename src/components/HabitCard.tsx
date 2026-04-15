import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HabitWithCompletion } from '../types';
import { getShadowStyle } from '../utils/styleHelpers';
import { useAppTheme } from '../utils/theme';

interface HabitCardProps {
  habit: HabitWithCompletion;
  onToggle: (habitId: string, isCompleted: boolean) => void;
  onPressDetails?: () => void;
}

export default function HabitCard({ habit, onToggle, onPressDetails }: HabitCardProps) {
  const { colors, isDark } = useAppTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(habit.completed_today ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(checkAnim, {
      toValue: habit.completed_today ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [habit.completed_today, checkAnim]);

  const handleToggle = () => {
    // Bounce animation for checkbox
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        friction: 5,
        tension: 200,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 3,
        tension: 100,
      }),
    ]).start();

    onToggle(habit.id, habit.completed_today);
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: habit.completed_today ? colors.inputBg : colors.card,
            borderLeftColor: habit.color_hex,
          },
          habit.completed_today && { opacity: 0.8 },
        ]}
        activeOpacity={0.7}
        onPress={onPressDetails || handleToggle}
      >
        <View style={styles.contentContainer}>
          <Text
            style={[
              styles.title,
              { color: colors.text },
              habit.completed_today && { textDecorationLine: 'line-through', color: colors.textMuted },
            ]}
          >
            {habit.title}
          </Text>

          <View style={styles.detailsRow}>
            {habit.description ? (
              <Text
                style={[
                  styles.description,
                  { color: colors.textMuted },
                  habit.completed_today && { opacity: 0.8 },
                ]}
                numberOfLines={1}
              >
                {habit.description}
              </Text>
            ) : <View style={{ flex: 1 }} />}

            {habit.current_streak !== undefined && habit.current_streak > 0 && (
              <View
                style={[
                  styles.streakContainer,
                  { backgroundColor: isDark ? 'rgba(255, 169, 77, 0.18)' : '#fff4e6' },
                ]}
              >
                <Text style={[styles.streakText, { color: colors.warning }]}>{habit.current_streak} </Text>
                <Text style={styles.streakEmoji}>🔥</Text>
              </View>
            )}
          </View>

        </View>

        <TouchableOpacity 
          onPress={handleToggle}
          activeOpacity={0.6}
        >
          <Animated.View
            style={[
              styles.checkbox,
              { borderColor: colors.border },
              habit.completed_today && { backgroundColor: habit.color_hex, borderColor: habit.color_hex },
              { transform: [{ scale: checkAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.3, 1] }) }] }
            ]}
          >
            {habit.completed_today && <Ionicons name="checkmark" size={16} color="#fff" />}
          </Animated.View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 6,
    borderLeftColor: '#3498db',
    ...getShadowStyle('#000', 0, 2, 0.05, 4, 2),
  },
  cardCompleted: {
    backgroundColor: '#f8f9fa',
    opacity: 0.8,
  },
  contentContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    paddingRight: 8,
  },
  descriptionCompleted: {
    color: '#aaa',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff4e6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  streakText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#e67e22',
  },
  streakEmoji: {
    fontSize: 10,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  }
});
