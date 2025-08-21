import { AlertCircle, CheckCircle } from 'lucide-react-native';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Animated, Text, View } from 'react-native';

type ToastType = 'success' | 'error';

interface ToastProps {
  message: string;
  type: ToastType;
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, visible, onHide, duration = 3000 }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  }, [fadeAnim, slideAnim, onHide]);

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, fadeAnim, slideAnim, duration, hideToast]);

  if (!visible) {
    return null;
  }

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#10B981', // green-500
          borderColor: '#059669', // green-600
        };
      case 'error':
        return {
          backgroundColor: '#EF4444', // red-500
          borderColor: '#DC2626', // red-600
        };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} color="white" />;
      case 'error':
        return <AlertCircle size={20} color="white" />;
    }
  };

  const toastStyle = getToastStyle();

  return (
    <Animated.View
      className="absolute top-16 left-4 right-4 z-50"
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <View
        className="rounded-xl p-4 flex-row items-center shadow-lg border"
        style={{
          backgroundColor: toastStyle.backgroundColor,
          borderColor: toastStyle.borderColor,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}
      >
        {getIcon()}
        <Text className="text-white font-medium text-base ml-3 flex-1">{message}</Text>
      </View>
    </Animated.View>
  );
};

export default Toast;
export { Toast };
