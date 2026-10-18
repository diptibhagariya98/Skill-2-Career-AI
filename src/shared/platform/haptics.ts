import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { isNative } from "./device";

/**
 * Trigger light tactile feedback on interactive taps (buttons, chips, tab selection).
 */
export async function hapticLight(): Promise<void> {
  if (!isNative()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // Graceful no-op on unsupported devices
  }
}

/**
 * Trigger medium tactile feedback on primary actions (e.g. submitting form, generating PDF).
 */
export async function hapticMedium(): Promise<void> {
  if (!isNative()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    // Graceful no-op
  }
}

/**
 * Trigger success notification vibration (e.g. ATS score ready, quiz completed, email verified).
 */
export async function hapticSuccess(): Promise<void> {
  if (!isNative()) return;
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    // Graceful no-op
  }
}

/**
 * Trigger error notification vibration (e.g. invalid OTP, network error).
 */
export async function hapticError(): Promise<void> {
  if (!isNative()) return;
  try {
    await Haptics.notification({ type: NotificationType.Error });
  } catch {
    // Graceful no-op
  }
}
