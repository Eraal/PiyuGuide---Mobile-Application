import { useState, useCallback } from "react";
import { Platform, PermissionsAndroid, Linking, Alert } from "react-native";

export type PermissionState =
  | "undetermined"
  | "requesting"
  | "granted"
  | "denied"
  | "blocked";

export function useMediaPermissions() {
  const [permissionState, setPermissionState] =
    useState<PermissionState>("undetermined");
  const [cameraGranted, setCameraGranted] = useState(false);
  const [micGranted, setMicGranted] = useState(false);

  const requestPermissions = useCallback(async (): Promise<{
    camera: boolean;
    mic: boolean;
  }> => {
    // iOS handles permissions via info.plist + automatic prompts
    if (Platform.OS !== "android") {
      setCameraGranted(true);
      setMicGranted(true);
      setPermissionState("granted");
      return { camera: true, mic: true };
    }

    setPermissionState("requesting");

    try {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);

      const cam =
        result["android.permission.CAMERA"] ===
        PermissionsAndroid.RESULTS.GRANTED;
      const mic =
        result["android.permission.RECORD_AUDIO"] ===
        PermissionsAndroid.RESULTS.GRANTED;

      setCameraGranted(cam);
      setMicGranted(mic);

      if (cam && mic) {
        setPermissionState("granted");
      } else {
        // Check if permanently denied (never_ask_again)
        const camBlocked =
          result["android.permission.CAMERA"] ===
          PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN;
        const micBlocked =
          result["android.permission.RECORD_AUDIO"] ===
          PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN;

        if (camBlocked || micBlocked) {
          setPermissionState("blocked");
        } else {
          setPermissionState("denied");
        }
      }

      return { camera: cam, mic };
    } catch (error) {
      console.warn("Permission request error:", error);
      setPermissionState("denied");
      return { camera: false, mic: false };
    }
  }, []);

  const openSettings = useCallback(() => {
    Alert.alert(
      "Permissions Required",
      'Camera and microphone access are needed for video calls.\n\nTap "Open Settings" → look for "Permissions" → enable Camera and Microphone.',
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open Settings",
          onPress: () => {
            // On Android, open the app-specific settings page
            if (Platform.OS === "android") {
              Linking.openSettings().catch(() => {
                // Fallback: try opening the app detail page directly
                Linking.openURL("package:com.piyuguide.mobile").catch(() => {});
              });
            } else {
              Linking.openSettings();
            }
          },
        },
      ],
    );
  }, []);

  const retryPermissions = useCallback(async () => {
    if (permissionState === "blocked") {
      openSettings();
      return { camera: false, mic: false };
    }
    return requestPermissions();
  }, [permissionState, openSettings, requestPermissions]);

  return {
    permissionState,
    cameraGranted,
    micGranted,
    requestPermissions,
    retryPermissions,
    openSettings,
  };
}
