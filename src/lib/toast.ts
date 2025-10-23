import { toast } from 'react-toastify';

export const showSuccess = (message: string) => {
  toast.success(message, { theme: 'colored' });
};

export const showError = (message: string) => {
  toast.error(message, { theme: 'colored' });
};

export const showWarning = (message: string) => {
  toast.warning(message, { theme: 'colored' });
};

export const showInfo = (message: string) => {
  toast.info(message, { theme: 'colored' });
};
