import { useState, useEffect, useRef, useCallback } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar, StyleSheet, View, BackHandler } from "react-native";
import { io } from "socket.io-client";

import SplashScreen from "../screens/SplashScreen";
import ChatScreen from "../screens/ChatScreen";
import CampusSelectionScreen from "../screens/CampusSelectionScreen";
import WelcomeScreen from "../screens/WelcomeScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import InquiryListScreen from "../screens/InquiryListScreen";
import NewInquiryScreen from "../screens/NewInquiryScreen";
import ProfileScreen from "../screens/ProfileScreen";
import NotificationScreen from "../screens/NotificationScreen";
import { CounselingScreen } from "../screens/CounselingScreen";
import { CounselingDetailsScreen } from "../screens/CounselingDetailsScreen";
import { NewCounselingScreen } from "../screens/NewCounselingScreen";
import { VideoCallScreen } from "../screens/VideoCallScreen";

import { getCurrentUser, loadNotifications, loadStudentInquiries } from "../services/backend";
import type { MobileCampus, MobileUser, MobileNotification, MobileInquirySummary } from "../services/backend";
import { ThemeProvider, useTheme } from "../theme/ThemeContext";
import { CHAT_BACKEND_URL } from "../constants/chat";

export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AppInner />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

type ScreenName =
  | "splash"
  | "welcome"
  | "campus"
  | "login"
  | "register"
  | "inquiryList"
  | "chat"
  | "newInquiry"
  | "profile"
  | "notifications"
  | "counseling"
  | "counselingDetails"
  | "newCounseling"
  | "videoCall";

function AppInner() {
  const { colors, isDark } = useTheme();

  const [screen, setScreen] = useState<ScreenName>("splash");
  const [welcomeExiting, setWelcomeExiting] = useState(false);
  const [campusExiting, setCampusExiting] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState<MobileCampus | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginNotice, setLoginNotice] = useState<string | null>(null);
  const [activeInquiryId, setActiveInquiryId] = useState<number | null>(null);
  const [activeOfficeName, setActiveOfficeName] = useState<string>("Office");
  const [currentUser, setCurrentUser] = useState<MobileUser | null>(null);
  const [notifications, setNotifications] = useState<MobileNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [inquiries, setInquiries] = useState<MobileInquirySummary[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [previousScreen, setPreviousScreen] = useState<ScreenName | null>(null);
  const [activeCounselingId, setActiveCounselingId] = useState<number | null>(null);

  const refreshNotifications = useCallback(async () => {
    try {
      const data = await loadNotifications();
      const filtered = data.filter((n) => n.type === "status_change");
      setNotifications(filtered);
      setUnreadCount(filtered.filter((n) => !n.isRead).length);
    } catch (error) {
      console.error("Failed to refresh notifications:", error);
    }
  }, []);

  const fetchInquiries = useCallback(async () => {
    setInquiriesLoading(true);
    try {
      const data = await loadStudentInquiries();
      setInquiries(data);
    } catch (error) {
      console.error("Failed to fetch inquiries:", error);
    } finally {
      setInquiriesLoading(false);
    }
  }, []);

  const authResultRef = useRef<{ user: MobileUser | null; checked: boolean }>({
    user: null,
    checked: false,
  });
  const splashDoneRef = useRef(false);

  const navigateAfterSplash = useCallback((user: MobileUser | null) => {
    if (user) {
      setCurrentUser(user);
      setScreen("inquiryList");
    } else {
      setScreen("welcome");
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (mounted) {
          authResultRef.current = { user, checked: true };
          if (user) {
            refreshNotifications();
            fetchInquiries();
          }
          if (splashDoneRef.current) navigateAfterSplash(user);
        }
      } catch {
        if (mounted) {
          authResultRef.current = { user: null, checked: true };
          if (splashDoneRef.current) navigateAfterSplash(null);
        }
      }
    };
    checkAuth();
    return () => { mounted = false; };
  }, [refreshNotifications, fetchInquiries, navigateAfterSplash]);

  // Real-time notifications and chat reordering socket
  useEffect(() => {
    if (!currentUser) return;

    const socket = io(CHAT_BACKEND_URL, {
      transports: ["polling", "websocket"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("Global socket connected");
      socket.emit("join", { room: `student_${currentUser.id}` });
    });

    socket.on("new_notification", (data) => {
      console.log("New notification received:", data);
      refreshNotifications();
    });

    socket.on("conversation_updated", (data) => {
      console.log("Conversation updated:", data);
      // Reorder and update preview instantly
      setInquiries((prev) => {
        const index = prev.findIndex((i) => i.id === data.inquiry_id);
        if (index === -1) {
          // If new inquiry not in list, reload entire list
          fetchInquiries();
          return prev;
        }
        
        const updated = [...prev];
        const [item] = updated.splice(index, 1);
        
        // Update item with new data
        const newItem = {
          ...item,
          latestMessagePreview: data.latest_message,
          updatedAt: data.updated_at,
          status: data.status,
          // Add a temporary flag for animation/highlight
          isRecentlyUpdated: true
        };
        
        // Move to top
        return [newItem, ...updated];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser, refreshNotifications, fetchInquiries]);

  // Handle native back button and swipe-back gestures
  useEffect(() => {
    const onBackPress = () => {
      // Logic for where to go back based on current screen
      switch (screen) {
        case "videoCall":
          setScreen("counselingDetails");
          return true;
        case "counselingDetails":
          setScreen("counseling");
          return true;
        case "newCounseling":
          setScreen("counseling");
          return true;
        case "chat":
          setScreen("inquiryList");
          return true;
        case "newInquiry":
          setScreen("inquiryList");
          return true;
        case "profile":
        case "notifications":
        case "counseling":
          // Bottom tab screens usually go back to the main list
          setScreen("inquiryList");
          return true;
        case "login":
        case "register":
        case "campus":
          setScreen("welcome");
          return true;
        case "welcome":
        case "inquiryList":
        case "splash":
          // At the root screens, allow the default behavior (exit app)
          return false;
        default:
          return false;
      }
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => subscription.remove();
  }, [screen]);


  const handleSplashComplete = useCallback(() => {
    splashDoneRef.current = true;
    if (authResultRef.current.checked) {
      navigateAfterSplash(authResultRef.current.user);
    }
  }, [navigateAfterSplash]);

  const handleLoginSuccess = ({ email }: { email: string; password: string }) => {
    setLoginEmail(email);
    setLoginNotice(null);
    getCurrentUser().then((user) => {
      if (user) {
        setCurrentUser(user);
        refreshNotifications();
        fetchInquiries();
      }
    });
    setScreen("inquiryList");
  };

  const handleGetStarted = () => setWelcomeExiting(true);

  const handleWelcomeExitComplete = () => {
    setWelcomeExiting(false);
    setScreen("campus");
  };

  const handleCampusContinue = (campus: MobileCampus) => {
    setSelectedCampus(campus);
    setCampusExiting(true);
  };

  const handleCampusExitComplete = () => {
    setCampusExiting(false);
    setScreen("login");
  };

  const handleBackToCampus = () => setScreen("campus");

  const handleLogout = useCallback(() => {
    setLoginEmail("");
    setCurrentUser(null);
    setScreen("login");
  }, []);

  const handleSelectInquiry = (inquiryId: number, officeName?: string) => {
    setActiveInquiryId(inquiryId);
    if (officeName) setActiveOfficeName(officeName);
    setScreen("chat");
  };

  const handleOpenNotifications = () => {
    setScreen("notifications");
  };

  const handleRegisterComplete = ({
    fullName,
    email,
    message,
  }: {
    fullName: string;
    email: string;
    message?: string;
  }) => {
    setLoginEmail(email);
    setLoginNotice(message ?? `Account created for ${fullName}. Sign in to continue.`);
    setScreen("login");
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      <View style={styles.shell}>
        {screen === "splash" ? (
          <SplashScreen onComplete={handleSplashComplete} />
        ) : null}

        {screen === "profile" ? (
          <ProfileScreen
            user={currentUser}
            onBack={() => setScreen("inquiryList")}
            onLogout={handleLogout}
          />
        ) : null}

        {screen === "notifications" ? (
          <NotificationScreen
            notifications={notifications}
            onRefresh={refreshNotifications}
            onBack={() => setScreen("inquiryList")}
            onInquiries={() => setScreen("inquiryList")}
            onCounseling={() => setScreen("counseling")}
            onSelectInquiry={handleSelectInquiry}
            onProfile={() => setScreen("profile")}
            onLogout={handleLogout}
            notificationCount={unreadCount}
          />
        ) : null}

        {screen === "chat" && activeInquiryId ? (
          <ChatScreen
            inquiryId={activeInquiryId}
            officeName={activeOfficeName}
            currentUserId={currentUser?.id}
            onBack={() => setScreen("inquiryList")}
          />
        ) : null}

        {screen === "inquiryList" ? (
          <InquiryListScreen
            currentUser={currentUser}
            inquiries={inquiries}
            isLoading={inquiriesLoading}
            onRefresh={fetchInquiries}
            onSelectInquiry={handleSelectInquiry}
            onNewInquiry={() => setScreen("newInquiry")}
            onCounseling={() => setScreen("counseling")}
            onProfile={() => setScreen("profile")}
            onNotifications={() => setScreen("notifications")}
            onLogout={handleLogout}
            notificationCount={unreadCount}
          />
        ) : null}

        {screen === "newInquiry" ? (
          <NewInquiryScreen
            onBack={() => setScreen("inquiryList")}
            onCreated={(id) => {
              setActiveInquiryId(id);
              setActiveOfficeName("Office");
              // Refresh inquiries to include the new one
              fetchInquiries();
              setScreen("chat");
            }}
          />
        ) : null}

        {screen === "welcome" ? (
          <WelcomeScreen
            exiting={welcomeExiting}
            onExitComplete={handleWelcomeExitComplete}
            onGetStarted={handleGetStarted}
          />
        ) : null}

        {screen === "campus" ? (
          <CampusSelectionScreen
            exiting={campusExiting}
            onExitComplete={handleCampusExitComplete}
            onContinue={handleCampusContinue}
            onBack={() => setScreen("welcome")}
          />
        ) : null}

        {screen === "login" ? (
          <LoginScreen
            initialEmail={loginEmail}
            campusLabel={selectedCampus?.shortName}
            notice={loginNotice}
            onLogin={handleLoginSuccess}
            onCreateAccount={() => {
              setLoginNotice(null);
              setScreen("register");
            }}
            onBackToCampus={handleBackToCampus}
          />
        ) : null}

        {screen === "register" ? (
          <RegisterScreen
            initialEmail={loginEmail}
            campus={selectedCampus}
            onRegisterComplete={handleRegisterComplete}
            onBackToLogin={() => setScreen("login")}
            onBackToCampus={handleBackToCampus}
          />
        ) : null}

        {screen === "counseling" ? (
          <CounselingScreen
            onNewCounseling={() => setScreen("newCounseling")}
            onVideoCall={(id) => {
              setActiveCounselingId(id);
              setScreen("counselingDetails");
            }}
            onProfile={() => setScreen("profile")}
            onNotifications={() => setScreen("notifications")}
            onInquiries={() => setScreen("inquiryList")}
            notificationCount={unreadCount}
          />
        ) : null}

        {screen === "counselingDetails" && activeCounselingId ? (
          <CounselingDetailsScreen
            sessionId={activeCounselingId}
            onBack={() => setScreen("counseling")}
            onJoinCall={(id) => {
              setActiveCounselingId(id);
              setScreen("videoCall");
            }}
            onProfile={() => setScreen("profile")}
            onNotifications={() => setScreen("notifications")}
            onInquiries={() => setScreen("inquiryList")}
            notificationCount={unreadCount}
          />
        ) : null}

        {screen === "newCounseling" ? (
          <NewCounselingScreen
            onBack={() => setScreen("counseling")}
            onSuccess={() => setScreen("counseling")}
          />
        ) : null}

        {screen === "videoCall" && activeCounselingId ? (
          <VideoCallScreen
            sessionId={activeCounselingId}
            onBack={() => setScreen("counselingDetails")}
            user={currentUser}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  shell: { flex: 1, position: "relative", overflow: "hidden" },
});
