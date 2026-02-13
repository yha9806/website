import type { IOSAlertAction, IOSAlertProps } from './IOSAlert';

export interface ShowAlertOptions extends Omit<IOSAlertProps, 'visible' | 'onClose'> {
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const showIOSAlert = (options: ShowAlertOptions): Promise<boolean> => {
  return new Promise((resolve) => {
    const alertContainer = document.createElement('div');
    document.body.appendChild(alertContainer);

    const cleanup = () => {
      document.body.removeChild(alertContainer);
    };

    const handleConfirm = () => {
      options.onConfirm?.();
      cleanup();
      resolve(true);
    };

    const handleCancel = () => {
      options.onCancel?.();
      cleanup();
      resolve(false);
    };

    const actions: IOSAlertAction[] = [];

    if (options.cancelText) {
      actions.push({
        label: options.cancelText,
        onPress: handleCancel,
        style: 'cancel',
      });
    }

    actions.push({
      label: options.confirmText || '确定',
      onPress: handleConfirm,
      style: 'default',
    });

    void actions;

    // Requires ReactDOM integration for true programmatic rendering.
    console.warn('showIOSAlert utility requires ReactDOM integration for programmatic usage');

    // For now, return a resolved promise.
    resolve(true);
  });
};

