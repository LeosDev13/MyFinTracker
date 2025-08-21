import { useState } from 'react';

type ToastType = 'success' | 'error';

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'success',
    visible: false,
  });

  const showToast = (message: string, type: ToastType) => {
    setToast({
      message,
      type,
      visible: true,
    });
  };

  const hideToast = () => {
    setToast((prev) => ({
      ...prev,
      visible: false,
    }));
  };

  const showSuccess = (message: string) => {
    showToast(message, 'success');
  };

  const showError = (message: string) => {
    showToast(message, 'error');
  };

  return {
    toast,
    showSuccess,
    showError,
    hideToast,
  };
};
