import { useState } from 'react';

export const useIOSActionSheet = () => {
  const [visible, setVisible] = useState(false);

  const showActionSheet = () => setVisible(true);
  const hideActionSheet = () => setVisible(false);
  const toggleActionSheet = () => setVisible(!visible);

  return {
    visible,
    showActionSheet,
    hideActionSheet,
    toggleActionSheet,
  };
};

