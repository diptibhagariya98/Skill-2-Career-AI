import { isNative } from "./device";

export interface ConfirmOptions {
  title: string;
  message: string;
  okButtonTitle?: string;
  cancelButtonTitle?: string;
}

export interface AlertOptions {
  title: string;
  message: string;
  buttonTitle?: string;
}

export interface ToastOptions {
  text: string;
  duration?: "short" | "long";
  position?: "top" | "center" | "bottom";
}

/**
 * Native modal confirm dialog (e.g. destructive action confirmation).
 * Web fallback uses window.confirm.
 */
export async function showConfirmDialog(options: ConfirmOptions): Promise<boolean> {
  if (isNative()) {
    try {
      const { Dialog } = await import("@capacitor/dialog");
      const result = await Dialog.confirm({
        title: options.title,
        message: options.message,
        okButtonTitle: options.okButtonTitle || "Confirm",
        cancelButtonTitle: options.cancelButtonTitle || "Cancel",
      });
      return Boolean(result.value);
    } catch (err: unknown) {
      console.warn("[Platform:Dialog] Native confirm error:", err);
    }
  }

  if (typeof window !== "undefined") {
    return window.confirm(`${options.title}\n\n${options.message}`);
  }

  return false;
}

/**
 * Native alert dialog.
 */
export async function showAlertDialog(options: AlertOptions): Promise<void> {
  if (isNative()) {
    try {
      const { Dialog } = await import("@capacitor/dialog");
      await Dialog.alert({
        title: options.title,
        message: options.message,
        buttonTitle: options.buttonTitle || "OK",
      });
      return;
    } catch (err: unknown) {
      console.warn("[Platform:Dialog] Native alert error:", err);
    }
  }

  if (typeof window !== "undefined") {
    window.alert(`${options.title}\n\n${options.message}`);
  }
}

/**
 * Native Android Toast / web transient snackbar notification.
 */
export async function showNativeToast(options: ToastOptions): Promise<void> {
  if (isNative()) {
    try {
      const { Toast } = await import("@capacitor/toast");
      await Toast.show({
        text: options.text,
        duration: options.duration || "short",
        position: options.position || "bottom",
      });
      return;
    } catch (err: unknown) {
      console.warn("[Platform:Toast] Native toast error:", err);
    }
  }
}
