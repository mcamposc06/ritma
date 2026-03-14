import { Platform, ViewStyle } from 'react-native';

/**
 * Generates a shadow style object that is compatible with both native and web.
 * Native uses shadow* props, while newest React Native Web versions prefer boxShadow.
 */
export const getShadowStyle = (
  color: string,
  offsetX: number,
  offsetY: number,
  opacity: number,
  radius: number,
  elevation: number
): any => {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `${offsetX}px ${offsetY}px ${radius}px ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
    };
  }
  return {
    shadowColor: color,
    shadowOffset: { width: offsetX, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: elevation,
  };
};

/**
 * Helper to handle pointerEvents warning if necessary.
 * Some newer RN versions/web adapters prefer style-based pointer events.
 */
export const getPointerEventsStyle = (events: 'none' | 'box-none' | 'box-only' | 'auto'): any => {
  if (Platform.OS === 'web') {
    return { pointerEvents: events };
  }
  return {}; // Native uses the prop
};
