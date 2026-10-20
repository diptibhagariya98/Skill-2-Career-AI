import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.resumentor.app",
  appName: "ResuMentor",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#030712",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: true,
      style: "LIGHT",
      backgroundColor: "#ffffff",
    },
    Keyboard: {
      resizeOnFullScreen: true,
    },
    SafeArea: {
      detectViewportFitCoverChanges: true,
      initialViewportFitCover: true,
    },
  },
};

export default config;
