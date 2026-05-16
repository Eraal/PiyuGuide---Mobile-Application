import { useEffect, useRef, useCallback } from "react";
import { AppState, type AppStateStatus } from "react-native";

type LifecycleCallbacks = {
  onBackground?: () => void;
  onForeground?: () => void;
};

/**
 * Manages app foreground/background transitions during a video call.
 *
 * - On background: pauses video track to save battery, keeps audio.
 * - On foreground: resumes video track and triggers reconnection check.
 */
export function useAppLifecycle(
  callbacks: LifecycleCallbacks,
  active: boolean = true,
) {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  useEffect(() => {
    if (!active) return;

    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        const prev = appStateRef.current;

        if (prev.match(/active/) && nextState === "background") {
          // App going to background
          cbRef.current.onBackground?.();
        }

        if (prev.match(/background/) && nextState === "active") {
          // App coming to foreground
          cbRef.current.onForeground?.();
        }

        appStateRef.current = nextState;
      },
    );

    return () => subscription.remove();
  }, [active]);
}
