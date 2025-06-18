
import type { SnackbarKey, SnackbarMessage, OptionsObject } from 'notistack';

let useSnackbarRef: (msg: SnackbarMessage, options?: OptionsObject) => SnackbarKey;

export const setSnackbarRef = (enqueueSnackbarRef: typeof useSnackbarRef) => {
  useSnackbarRef = enqueueSnackbarRef;
};

export const notify = (msg: SnackbarMessage, options?: OptionsObject) => {
  if (useSnackbarRef) {
    useSnackbarRef(msg, options);
  } else {
    console.warn("Snackbar not initialized yet.");
  }
};
