import React from 'react';
import { 
  ShieldCheck, 
  HelpCircle, 
  Clock, 
  Sun, 
  Moon, 
  ArrowLeftRight, 
  History,
  XCircle,
  Wifi,
  WifiOff,
  User,
  LogOut
} from 'lucide-react';
import { AppTab, ConnectionState, DeviceInfo, UserProfile } from '../types.ts';
import { UserAvatar } from './UserAvatar.tsx';

interface NavbarProps {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  connectionState: ConnectionState;
  peerDeviceInfo?: DeviceInfo;
  sessionExpiresAt?: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onEndSession?: () => void;
  hasActiveSession: boolean;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  connectionState,
  peerDeviceInfo,
  sessionExpiresAt,
  theme,
  onToggleTheme,
  onEndSession,
  hasActiveSession,
  currentUser,
  onLogout,
}) => {
  const [timeLeft, setTimeLeft] = React.useState<string>('');

  React.useEffect(() => {
    if (!sessionExpiresAt) {
      setTimeLeft('');
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((sessionExpiresAt - Date.now()) / 1000));
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [sessionExpiresAt]);

  const getConnectionBadge = () => {
    switch (connectionState) {
      case 'connected':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Connected {peerDeviceInfo ? `to ${peerDeviceInfo.name}` : ''}</span>
          </div>
        );
      case 'connecting':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span>Connecting...</span>
          </div>
        );
      case 'waiting':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Wifi className="w-3 h-3 animate-pulse" />
            <span>Waiting for peer</span>
          </div>
        );
      case 'reconnecting':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Wifi className="w-3 h-3 animate-spin" />
            <span>Reconnecting...</span>
          </div>
        );
      case 'disconnected':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <WifiOff className="w-3 h-3" />
            <span>Disconnected</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Logo and Brand */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button 
              onClick={() => onTabChange('transfer')}
              className="flex items-center gap-2 sm:gap-2.5 text-left group focus:outline-none"
              id="brand-home-btn"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <ArrowLeftRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm sm:text-base tracking-tight text-zinc-900 dark:text-zinc-100">
                  QuickDrop
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  P2P
                </span>
              </div>
            </button>
          </div>

          {/* Live Status and Session Expiration (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            {getConnectionBadge()}
            {timeLeft && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                <Clock className="w-3 h-3 text-zinc-400" />
                <span>Expires in {timeLeft}</span>
              </div>
            )}
          </div>

          {/* Navigation & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Desktop Navigation Tabs */}
            <nav className="hidden sm:flex items-center p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-xs font-medium">
              <button
                onClick={() => onTabChange('transfer')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  currentTab === 'transfer'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
                id="nav-tab-transfer"
              >
                Transfer
              </button>
              <button
                onClick={() => onTabChange('history')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                  currentTab === 'history'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
                id="nav-tab-history"
              >
                <History className="w-3.5 h-3.5" />
                <span>History</span>
              </button>
              <button
                onClick={() => onTabChange('privacy')}
                className={`hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  currentTab === 'privacy'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
                id="nav-tab-privacy"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Privacy</span>
              </button>
              <button
                onClick={() => onTabChange('help')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  currentTab === 'help'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
                id="nav-tab-help"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Help</span>
              </button>

              {/* Profile / Account Tab (Desktop) */}
              {currentUser && (
                <button
                  onClick={() => onTabChange('profile')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    currentTab === 'profile'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                  id="nav-tab-profile"
                  title="الحساب الشخصي"
                >
                  <UserAvatar
                    name={currentUser.name}
                    avatarUrl={currentUser.avatarUrl}
                    size="xs"
                  />
                  <span className="max-w-[80px] md:max-w-[110px] truncate">{currentUser.name || 'حسابي'}</span>
                </button>
              )}
            </nav>

            {/* End Session Button if in session */}
            {hasActiveSession && onEndSession && (
              <button
                onClick={onEndSession}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
                id="end-session-btn"
                title="إنهاء الجلسة"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">End</span>
              </button>
            )}

            {/* Quick Logout Button if logged in */}
            {currentUser && onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="p-2 rounded-lg text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer focus:outline-none"
                title="تسجيل الخروج (Log out)"
                aria-label="تسجيل الخروج"
                id="quick-logout-btn"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2 rounded-lg text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              id="theme-toggle-btn"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-zinc-700" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Fixed for phone screens) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-200 dark:border-zinc-800 py-1.5 px-3 pb-safe shadow-lg transition-colors">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <button
            type="button"
            onClick={() => onTabChange('transfer')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              currentTab === 'transfer'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 font-medium'
            }`}
            id="mobile-nav-transfer"
          >
            <ArrowLeftRight className={`w-5 h-5 ${currentTab === 'transfer' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[11px] mt-0.5">نقل</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('history')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              currentTab === 'history'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 font-medium'
            }`}
            id="mobile-nav-history"
          >
            <History className={`w-5 h-5 ${currentTab === 'history' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[11px] mt-0.5">السجل</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('help')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              currentTab === 'help'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 font-medium'
            }`}
            id="mobile-nav-help"
          >
            <HelpCircle className={`w-5 h-5 ${currentTab === 'help' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[11px] mt-0.5">مساعدة</span>
          </button>

          {currentUser ? (
            <button
              type="button"
              onClick={() => onTabChange('profile')}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
                currentTab === 'profile'
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 font-medium'
              }`}
              id="mobile-nav-profile"
            >
              <UserAvatar
                name={currentUser.name}
                avatarUrl={currentUser.avatarUrl}
                size="xs"
                className={currentTab === 'profile' ? 'ring-2 ring-blue-500' : ''}
              />
              <span className="text-[11px] mt-0.5 max-w-[65px] truncate">{currentUser.name || 'حسابي'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onTabChange('profile')}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
                currentTab === 'profile'
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 font-medium'
              }`}
              id="mobile-nav-login"
            >
              <User className={`w-5 h-5 ${currentTab === 'profile' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[11px] mt-0.5">دخول</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};

