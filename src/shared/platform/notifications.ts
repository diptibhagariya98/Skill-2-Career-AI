import { isNative } from "./device";

export interface LocalNotificationOptions {
  id: number;
  title: string;
  body: string;
  scheduleAt?: Date;
  extra?: Record<string, string>;
}

/**
 * Request notification permission (Android 13+ / Web Notifications).
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (isNative()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const perm = await LocalNotifications.requestPermissions();
      return perm.display === "granted";
    } catch {
      return false;
    }
  }

  if (typeof window !== "undefined" && "Notification" in window) {
    try {
      const perm = await Notification.requestPermission();
      return perm === "granted";
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Schedules a zero-server local device notification (scholarship deadline, practice streak).
 */
export async function scheduleLocalNotification(options: LocalNotificationOptions): Promise<boolean> {
  if (isNative()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const hasPerm = await requestNotificationPermission();
      if (!hasPerm) return false;

      await LocalNotifications.schedule({
        notifications: [
          {
            id: options.id,
            title: options.title,
            body: options.body,
            schedule: options.scheduleAt ? { at: options.scheduleAt } : undefined,
            extra: options.extra,
            sound: "beep.wav",
          },
        ],
      });
      return true;
    } catch (err: unknown) {
      console.warn("[Platform:Notification] Schedule error:", err);
      return false;
    }
  }

  // Web Browser Notification fallback (immediate only)
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(options.title, {
        body: options.body,
        icon: "/favicon.ico",
      });
      return true;
    } catch {
      return false;
    }
  }

  return false;
}
