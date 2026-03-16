import { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import Onboarding from './screens/Onboarding';
import ChatList from './screens/ChatList';
import ChatRoom from './screens/ChatRoom';
import Dashboard from './screens/Dashboard';
import Profile from './screens/Profile';
import Search from './screens/Search';
import Preferences from './screens/Preferences';
import Pairing from './screens/Pairing';
import BottomNav from './components/BottomNav';
import UpdateBanner from './components/UpdateBanner';
import IOSInstallPrompt from './components/IOSInstallPrompt';
import { setActiveConnectionId } from './services/connectionStore';
import { useSwipeBack } from './hooks/useSwipeBack';
import { usePWAUpdate } from './hooks/usePWAUpdate';
import { useIOSPWA } from './hooks/useIOSPWA';

export type Screen = 'onboarding' | 'chats' | 'chat_room' | 'dashboard' | 'profile' | 'search' | 'preferences' | 'pairing';

const STORAGE_KEY_USER_ID = 'openclaw.userId';
const STORAGE_KEY_USER_NAME = 'openclaw.userName';

function createUserId() {
  return `web-user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getUserId(): string {
  let id = localStorage.getItem(STORAGE_KEY_USER_ID);
  if (!id) {
    id = createUserId();
    localStorage.setItem(STORAGE_KEY_USER_ID, id);
  }
  return id;
}

export function getUserName(): string {
  return localStorage.getItem(STORAGE_KEY_USER_NAME) || 'OpenClaw User';
}

export function setUserName(name: string) {
  localStorage.setItem(STORAGE_KEY_USER_NAME, name);
}

/* ---- URL ⇄ Screen 同步层 ---- */

const SCREEN_TO_PATH: Record<Screen, string> = {
  onboarding: '/',
  chats: '/chats',
  chat_room: '/chat',  // + /:chatId
  dashboard: '/dashboard',
  profile: '/profile',
  search: '/search',
  preferences: '/preferences',
  pairing: '/pairing',
};

function pathToScreen(pathname: string): { screen: Screen; chatId?: string } {
  if (pathname.startsWith('/chat/')) {
    return { screen: 'chat_room', chatId: pathname.slice('/chat/'.length) };
  }
  for (const [screen, path] of Object.entries(SCREEN_TO_PATH)) {
    if (pathname === path) return { screen: screen as Screen };
  }
  return { screen: 'onboarding' };
}

function AppShell() {
  const location = useLocation();
  const routerNavigate = useNavigate();

  // 根据 localStorage 判断是否已登录过
  const hasUserId = !!localStorage.getItem(STORAGE_KEY_USER_ID);
  const initialFromUrl = pathToScreen(location.pathname);
  const initialScreen: Screen = hasUserId ? (initialFromUrl.screen === 'onboarding' && location.pathname === '/' ? 'chats' : initialFromUrl.screen) : 'onboarding';

  const [currentScreen, setCurrentScreen] = useState<Screen>(initialScreen);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(initialFromUrl.chatId ?? null);

  // PWA update detection
  const { updateAvailable, applyUpdate, dismissUpdate } = usePWAUpdate();

  // iOS PWA optimizations
  const { showInstallPrompt } = useIOSPWA();

  // URL → Screen（浏览器前进/后退）
  useEffect(() => {
    const { screen, chatId } = pathToScreen(location.pathname);
    setCurrentScreen(screen);
    if (chatId) setActiveAgentId(chatId);
  }, [location.pathname]);

  const navigate = useCallback((screen: Screen, chatId?: string) => {
    setCurrentScreen(screen);
    if (chatId) setActiveAgentId(chatId);

    // Screen → URL
    if (screen === 'chat_room' && chatId) {
      routerNavigate(`/chat/${chatId}`);
    } else {
      routerNavigate(SCREEN_TO_PATH[screen]);
    }
  }, [routerNavigate]);

  // Handle swipe-back gesture
  const handleSwipeBack = useCallback(() => {
    // Use browser history to go back
    window.history.back();
  }, []);

  // Determine if swipe-back should be enabled
  const canGoBack = ['chat_room', 'preferences', 'pairing'].includes(currentScreen);

  // Use swipe-back hook for iOS-style gestures
  const swipeState = useSwipeBack({
    onSwipeBack: handleSwipeBack,
    threshold: 100,
    enabled: canGoBack,
  });

  const renderScreen = () => {
    switch (currentScreen) {
      case 'onboarding':
        return <Onboarding onGetStarted={() => navigate('chats')} />;
      case 'chats':
        return <ChatList onOpenChat={(agentId) => navigate('chat_room', agentId)} onAddServer={() => navigate('pairing')} />;
      case 'chat_room':
        return <ChatRoom agentId={activeAgentId} onBack={() => navigate('chats')} />;
      case 'dashboard':
        return <Dashboard />;
      case 'profile':
        return <Profile onNavigate={navigate} />;
      case 'search':
        return <Search />;
      case 'preferences':
        return <Preferences onBack={() => navigate('profile')} />;
      case 'pairing':
        return <Pairing onBack={() => navigate('profile')} onPaired={(connId) => { setActiveConnectionId(connId); navigate('chats'); }} />;
      default:
        return <Onboarding onGetStarted={() => navigate('chats')} />;
    }
  };

  const showBottomNav = ['chats', 'dashboard', 'profile', 'search'].includes(currentScreen);

  // Calculate animation values based on swipe state
  const animateX = swipeState.isDragging ? swipeState.dragX : 0;
  const animateOpacity = swipeState.isDragging ? 1 - swipeState.dragProgress * 0.3 : 1;
  const animateTransition = swipeState.isDragging
    ? { type: 'tween' as const, duration: 0 }
    : { type: 'spring' as const, stiffness: 300, damping: 30 };

  return (
    <div className="relative w-full h-[100dvh] bg-[#F8FAFB] dark:bg-[#1a1b2e] text-[#2D3436] dark:text-[#e2e8f0] overflow-hidden flex justify-center font-sans">
      <div className="w-full max-w-md h-full relative bg-[#F8FAFB] dark:bg-[#1a1b2e] shadow-2xl overflow-hidden">
        {/* PWA Update Banner */}
        <UpdateBanner
          isVisible={updateAvailable}
          onUpdate={applyUpdate}
          onDismiss={dismissUpdate}
        />

        {/* iOS Install Prompt */}
        <IOSInstallPrompt show={showInstallPrompt} />

        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, x: 40 }}
            animate={{
              opacity: animateOpacity,
              x: animateX,
            }}
            exit={{ opacity: 0, x: -40 }}
            transition={animateTransition}
            className="absolute inset-0 overflow-y-auto"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>

        {showBottomNav && (
          <BottomNav currentScreen={currentScreen} onNavigate={navigate} />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
