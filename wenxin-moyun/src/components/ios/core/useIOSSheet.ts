import { useState } from 'react';

export const useIOSSheet = () => {
  const [visible, setVisible] = useState(false);

  const showSheet = () => setVisible(true);
  const hideSheet = () => setVisible(false);
  const toggleSheet = () => setVisible(!visible);

  return {
    visible,
    showSheet,
    hideSheet,
    toggleSheet,
  };
};

