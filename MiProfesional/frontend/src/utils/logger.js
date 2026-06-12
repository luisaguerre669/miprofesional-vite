const PREFIX = '[MiP]';

export const log = (...args) => {
  if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_LOGS === 'true') {
    console.log(PREFIX, ...args);
  }
};
