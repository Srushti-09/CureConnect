import { createContext, useContext } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const showToast = {
    success: (message) => toast.success(message, {
      duration: 4000,
      style: {
        background: '#10B981',
        color: '#fff',
      },
    }),
    error: (message) => toast.error(message, {
      duration: 5000,
      style: {
        background: '#EF4444',
        color: '#fff',
      },
    }),
    warning: (message) => toast(message, {
      duration: 4000,
      icon: '⚠️',
      style: {
        background: '#F59E0B',
        color: '#fff',
      },
    }),
    info: (message) => toast(message, {
      duration: 4000,
      style: {
        background: '#3B82F6',
        color: '#fff',
      },
    }),
  };

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontSize: '14px',
            fontWeight: '500',
          },
        }}
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};