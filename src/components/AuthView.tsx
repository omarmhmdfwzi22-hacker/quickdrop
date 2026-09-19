import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Sparkles, 
  RefreshCw,
  Send,
  ShieldCheck,
  Camera,
  Laptop,
  Copy,
  Check,
  Code2,
  Trash2,
  UploadCloud
} from 'lucide-react';
import { 
  signInUser, 
  signUpUser, 
  verifyEmailCode, 
  resendVerificationCode, 
  signInWithGoogle,
  checkIsSupabaseConfigured,
  getSupabaseCredentials,
  saveSupabaseConfig,
  clearSupabaseConfig,
  getPendingVerificationCode,
  checkEmailConfirmationStatus,
  evaluatePasswordStrength,
  quickGuestLogin,
  generateDeterministicAvatar,
  SQL_PROFILES_MIGRATION
} from '../lib/auth.ts';
import { UserProfile, PasswordStrength } from '../types.ts';
import { UserAvatar } from './UserAvatar.tsx';

interface AuthViewProps {
  onAuthSuccess: (user: UserProfile) => void;
}

type AuthMode = 'login' | 'signup' | 'verify';

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [deviceName, setDeviceName] = useState('جهازي (My Device)');

  // Avatar upload state for Registration
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // 6-digit OTP code states
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [activeOtpCode, setActiveOtpCode] = useState<string | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend cooldown timer
  const [resendCooldown, setResendCooldown] = useState(0);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Supabase Configuration States
  const [hasSupabase, setHasSupabase] = useState<boolean>(() => checkIsSupabaseConfigured());
  const [showSupabaseModal, setShowSupabaseModal] = useState<boolean>(false);
  const [showSqlModal, setShowSqlModal] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  const [supabaseUrlInput, setSupabaseUrlInput] = useState<string>(() => getSupabaseCredentials().url);
  const [supabaseKeyInput, setSupabaseKeyInput] = useState<string>(() => getSupabaseCredentials().anonKey);
  const [supabaseConfigSuccess, setSupabaseConfigSuccess] = useState<string | null>(null);
  const [supabaseConfigError, setSupabaseConfigError] = useState<string | null>(null);

  // Check if user arrived via QR Code scan with join/code parameters
  const [incomingPairCode, setIncomingPairCode] = useState<string | null>(null);
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const join = params.get('join');
      if (code || join) {
        setIncomingPairCode(code || join);
      }
    } catch {}
  }, []);

  const handleQuickGuestPair = () => {
    const guestUser: UserProfile = {
      id: 'guest_mobile_' + Math.random().toString(36).substring(2, 9),
      email: 'mobile@quickdrop.local',
      name: 'هاتف محمول (Mobile)',
      deviceName: 'هاتف محمول (Sender)',
      createdAt: new Date().toISOString(),
      emailConfirmed: true,
    };
    try {
      localStorage.setItem('quickdrop_current_user_session', JSON.stringify(guestUser));
    } catch {}
    onAuthSuccess(guestUser);
  };

  const handleSaveSupabaseConfig = () => {
    setSupabaseConfigError(null);
    setSupabaseConfigSuccess(null);
    const cleanUrl = supabaseUrlInput.trim();
    const cleanKey = supabaseKeyInput.trim();

    if (!cleanUrl || !cleanKey) {
      setSupabaseConfigError('يرجى إدخال كل من رابط المشروع Project URL ومفتاح الـ Anon Key.');
      return;
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      setSupabaseConfigError('يجب أن يبدأ رابط المشروع بـ https:// (مثال: https://xxxx.supabase.co)');
      return;
    }

    saveSupabaseConfig(cleanUrl, cleanKey);
    setHasSupabase(true);
    setSupabaseConfigSuccess('تم ربط وحفظ مشروع Supabase بنجاح! يعمل النظام الآن عبر سحابة Supabase.');
    setTimeout(() => {
      setSupabaseConfigSuccess(null);
      setShowSupabaseModal(false);
    }, 1500);
  };

  const handleResetSupabaseConfig = () => {
    clearSupabaseConfig();
    setHasSupabase(false);
    setSupabaseUrlInput('');
    setSupabaseKeyInput('');
    setSupabaseConfigSuccess('تم فصل مشروع Supabase والعودة إلى المصادقة المحلية.');
    setTimeout(() => {
      setSupabaseConfigSuccess(null);
    }, 1500);
  };

  const [checkingStatus, setCheckingStatus] = useState(false);

  // Check if confirmation link was clicked in email
  const handleCheckConfirmationLink = async () => {
    clearMessages();
    setCheckingStatus(true);
    try {
      const res = await checkEmailConfirmationStatus(email, password);
      if (res.success && res.user) {
        setSuccessMessage('تم تأكيد الحساب بنجاح! جاري الدخول...');
        setTimeout(() => {
          onAuthSuccess(res.user!);
        }, 800);
      } else {
        setErrorMessage(res.error || 'لم يتم تأكيد الحساب بعد من الرابط. تأكد من فتح الرابط في الإيميل.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل فحص الرابط');
    } finally {
      setCheckingStatus(false);
    }
  };

  // Skip verification option - Immediate direct entry
  const handleSkipVerification = () => {
    const cleanEmail = (email.trim() || 'user@quickdrop.local').toLowerCase();
    const cleanName = fullName.trim() || cleanEmail.split('@')[0] || 'مستخدم QuickDrop';
    const cleanDevice = deviceName.trim() || 'جهاز QuickDrop السريع';
    const avatar = avatarPreview || generateDeterministicAvatar(cleanName);

    const fallbackUser: UserProfile = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email: cleanEmail,
      name: cleanName,
      avatarUrl: avatar,
      deviceName: cleanDevice,
      createdAt: new Date().toISOString(),
      emailConfirmed: true,
      provider: hasSupabase ? 'email' : undefined,
    };

    try {
      localStorage.setItem('quickdrop_current_user_session', JSON.stringify(fallbackUser));
    } catch {}

    onAuthSuccess(fallbackUser);
  };

  // Timer countdown effect for OTP resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const clearMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Avatar file selection handler
  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('يرجى اختيار ملف صورة صالح (JPEG, PNG, WebP, GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 5 ميجابايت');
      return;
    }

    setAvatarFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setErrorMessage(null);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!email.trim() || !password) {
      setErrorMessage('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);
    try {
      const res = await signInUser(email, password);
      if (res.success && res.user) {
        onAuthSuccess(res.user);
      } else if (res.needsEmailVerification) {
        setMode('verify');
        if (res.debugCode) {
          setActiveOtpCode(res.debugCode);
        }
        setErrorMessage(res.error || 'يرجى تأكيد بريدك الإلكتروني أولاً للدخول');
      } else {
        setErrorMessage(res.error || 'فشل تسجيل الدخول. تحقق من بياناتك المدخلة');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!email.trim() || !password) {
      setErrorMessage('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('يجب أن تكون كلمة المرور 6 أحرف على الأقل لحماية حسابك');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('كلمتا المرور غير متطابقتين');
      return;
    }

    setLoading(true);
    try {
      const res = await signUpUser({
        email,
        password,
        fullName,
        avatarFile,
        deviceName,
      });

      if (res.success) {
        if (res.needsEmailVerification) {
          setOtpDigits(['', '', '', '', '', '']);
          setResendCooldown(60);
          setMode('verify');
          if (res.debugCode) {
            setActiveOtpCode(res.debugCode);
          }
          setSuccessMessage(
            hasSupabase
              ? 'تم إرسال رمز التأكيد السري إلى بريدك الإلكتروني عبر Supabase!'
              : 'تم إنشاء حسابك بنجاح! تفقد رمز التحقق السريع أدناه لتأكيد حسابك.'
          );
        } else if (res.user) {
          onAuthSuccess(res.user);
        }
      } else {
        setErrorMessage(res.error || 'تعذر إنشاء الحساب');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ في التسجيل');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    if (!clean && val !== '') return;

    const newDigits = [...otpDigits];

    if (clean.length > 1) {
      // Handle paste of complete 6-digit code
      const pasted = clean.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setOtpDigits(newDigits);
      const nextIdx = Math.min(pasted.length, 5);
      otpInputRefs.current[nextIdx]?.focus();
      return;
    }

    newDigits[index] = clean;
    setOtpDigits(newDigits);

    if (clean && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Auto fill active OTP code
  const handleAutoFillCode = () => {
    if (!activeOtpCode) return;
    const digits = activeOtpCode.slice(0, 6).split('');
    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = digits[i] || '';
    }
    setOtpDigits(newDigits);
    otpInputRefs.current[5]?.focus();
  };

  // Handle OTP Verification Submit
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    const fullCode = otpDigits.join('');
    if (fullCode.length !== 6) {
      setErrorMessage('يرجى إدخال رمز التحقق المكون من 6 أرقام كاملاً');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyEmailCode(email, fullCode);
      if (res.success && res.user) {
        onAuthSuccess(res.user);
      } else {
        setErrorMessage(res.error || 'رمز التحقق غير صحيح أو انتهت صلاحيته');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل التحقق من الرمز');
    } finally {
      setLoading(false);
    }
  };

  // Resend code
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    clearMessages();
    setLoading(true);
    try {
      const res = await resendVerificationCode(email);
      if (res.success) {
        setResendCooldown(60);
        if (res.debugCode) {
          setActiveOtpCode(res.debugCode);
        }
        setSuccessMessage('تم إرسال رمز أمان جديد بنجاح إلى بريدك الإلكتروني!');
      } else {
        setErrorMessage(res.error || 'فشل إعادة الإرسال');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ في إعادة الإرسال');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuthClick = async () => {
    clearMessages();
    setLoading(true);
    try {
      const res = await signInWithGoogle();
      if (res.success && res.user) {
        onAuthSuccess(res.user);
      } else if (!res.success && res.error) {
        setErrorMessage(res.error);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل تشغيل Google Auth');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SQL_PROFILES_MIGRATION.trim());
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } catch {}
  };

  const passwordStrength: PasswordStrength = evaluatePasswordStrength(password);

  return (
    <div className="w-full max-w-md mx-auto px-2 sm:px-4 py-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl space-y-5 sm:space-y-6">
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            {mode === 'login' && 'تسجيل الدخول إلى QuickDrop'}
            {mode === 'signup' && 'إنشاء حساب جديد'}
            {mode === 'verify' && 'تأكيد الحساب والبريد'}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {mode === 'login' && 'أدخل بريدك الإلكتروني وكلمة المرور لمتابعة نقل ملفاتك'}
            {mode === 'signup' && 'أنشئ حسابك الشخصي لتأمين جلساتك وحفظ ملفاتك وصورتك الرمزية'}
            {mode === 'verify' && 'أدخل رمز الأمان السري المرسل إلى بريدك لتفعيل الحساب'}
          </p>
        </div>

        {/* System Automated Ready Badge */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-bold text-emerald-800 dark:text-emerald-300 text-[11px] sm:text-xs">
              ⚡ جاهز للعمل المباشر
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowSupabaseModal(true)}
            className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 underline cursor-pointer shrink-0"
            title="إعدادات متقدمة اختيارية للمطورين"
          >
            ⚙️ إعدادات
          </button>
        </div>

        {/* INSTANT ONE-CLICK DIRECT ACCESS BUTTON */}
        {mode !== 'verify' && (
          <button
            type="button"
            onClick={() => onAuthSuccess(quickGuestLogin())}
            id="instant-auto-login-btn"
            className="w-full py-3 px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-[0.99] transition-all cursor-pointer border border-emerald-400/30"
          >
            <Sparkles className="w-4 h-4 text-emerald-200 animate-bounce shrink-0" />
            <span>⚡ دخول فوري مباشر (بدون تسجيل)</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        )}

        {/* Alerts */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* QR Code Instant Mobile Pairing Banner */}
        {incomingPairCode && mode !== 'verify' && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg space-y-3 border border-blue-400/30">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold uppercase tracking-wider text-blue-100">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                اقتران سريع عبر QR Code
              </span>
              <span className="font-mono text-xs font-semibold text-blue-100 bg-blue-900/40 px-2 py-0.5 rounded">
                {incomingPairCode}
              </span>
            </div>
            <p className="text-xs text-blue-100 leading-relaxed">
              تم اكتشاف جلسة نقل ملفات جاهزة من الكمبيوتر. اضغط الزر أدناه للمتابعة كجهاز مرسل والاقتران فوراً دون تسجيل دخول:
            </p>
            <button
              type="button"
              onClick={handleQuickGuestPair}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-blue-50 active:scale-[0.99] text-blue-700 font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <span>📱 متابعة كجهاز مرسل والاقتران فوراً ⚡</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* REAL GOOGLE AUTH BUTTON */}
        {mode !== 'verify' && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleAuthClick}
              disabled={loading}
              id="google-signin-btn"
              className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-750 active:scale-[0.99] text-zinc-800 dark:text-zinc-100 font-medium text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-60"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>المتابعة باستخدام Google</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
              <span className="absolute bg-white dark:bg-zinc-900 px-3 text-xs text-zinc-400 font-medium">
                أو المتابعة بالبريد الإلكتروني
              </span>
            </div>
          </div>
        )}


        {/* 1. LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                البريد الإلكتروني (Email)
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-left"
                  dir="ltr"
                  id="login-email-input"
                />
                <Mail className="w-4 h-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                كلمة المرور (Password)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-left"
                  dir="ltr"
                  id="login-password-input"
                />
                <Lock className="w-4 h-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 focus:outline-none cursor-pointer"
                  aria-label="تبديل إظهار كلمة المرور"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 disabled:opacity-60 transition-all cursor-pointer"
              id="login-submit-btn"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>تسجيل الدخول</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 text-center">
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                ليس لديك حساب؟{' '}
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setMode('signup');
                  }}
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer transition-colors"
                  id="go-to-signup-btn"
                >
                  إنشاء حساب جديد (Register)
                </button>
              </p>
            </div>
          </form>
        )}

        {/* 2. SIGN UP FORM */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            {/* AVATAR UPLOAD AND CIRCULAR PREVIEW */}
            <div className="flex flex-col items-center justify-center space-y-2 pb-1">
              <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                <UserAvatar
                  name={fullName || 'New User'}
                  avatarUrl={avatarPreview}
                  size="xl"
                  className="shadow-md group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <button
                  type="button"
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 ring-2 ring-white dark:ring-zinc-900 shadow-md hover:scale-105 transition-all cursor-pointer"
                  title="اختر صورة شخصية"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFileSelect}
              />

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer"
                >
                  {avatarFile ? 'تغيير الصورة' : 'رفع صورة رمزية (اختياري)'}
                </button>
                {avatarFile && (
                  <>
                    <span className="text-zinc-400">•</span>
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="text-rose-500 hover:underline cursor-pointer"
                    >
                      إزالة
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* FULL NAME */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                الاسم الكامل (Display Name)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: عمر محمد"
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  id="signup-name-input"
                />
                <User className="w-4 h-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* EMAIL */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                البريد الإلكتروني (Email)
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-left"
                  dir="ltr"
                  id="signup-email-input"
                />
                <Mail className="w-4 h-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* DEVICE NAME */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                اسم الجهاز المقترن (Device Name)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="مثل: كمبيوتر أحمد أو آيفون 15"
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  id="signup-devicename-input"
                />
                <Laptop className="w-4 h-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* PASSWORD WITH STRENGTH INDICATOR */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  كلمة المرور (Password)
                </label>
                {password.length > 0 && (
                  <span className="text-[11px] font-bold text-zinc-500">
                    القوة: <strong className="text-zinc-800 dark:text-zinc-200">{passwordStrength.label}</strong>
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8 أحرف مع أرقام ورموز"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-left"
                  dir="ltr"
                  id="signup-password-input"
                />
                <Lock className="w-4 h-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 focus:outline-none cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter Bar */}
              {password.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="grid grid-cols-4 gap-1 h-1.5">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-full rounded-full transition-all duration-300 ${
                          passwordStrength.score >= step
                            ? passwordStrength.color
                            : 'bg-zinc-200 dark:bg-zinc-750'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] text-zinc-500 dark:text-zinc-400 pt-0.5">
                    <span className={passwordStrength.hasMinLength ? 'text-emerald-500 font-bold' : ''}>
                      ✓ 8 خانات
                    </span>
                    <span className={(passwordStrength.hasUppercase && passwordStrength.hasLowercase) ? 'text-emerald-500 font-bold' : ''}>
                      ✓ أحرف كبيرة وصغيرة
                    </span>
                    <span className={passwordStrength.hasNumber ? 'text-emerald-500 font-bold' : ''}>
                      ✓ أرقام
                    </span>
                    <span className={passwordStrength.hasSpecialChar ? 'text-emerald-500 font-bold' : ''}>
                      ✓ رمز خاص
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                تأكيد كلمة المرور (Confirm Password)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="أعد كتابة كلمة المرور"
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-left"
                  dir="ltr"
                  id="signup-confirm-password-input"
                />
                <KeyRound className="w-4 h-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-[11px] text-rose-500 font-medium">كلمتا المرور غير متطابقتين</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 disabled:opacity-60 transition-all cursor-pointer"
              id="signup-submit-btn"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>إنشاء الحساب وتفعيل الأمان</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 text-center">
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                لديك حساب بالفعل؟{' '}
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setMode('login');
                  }}
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer transition-colors"
                  id="go-to-login-btn"
                >
                  تسجيل الدخول
                </button>
              </p>
            </div>
          </form>
        )}

        {/* 3. VERIFY CODE FORM */}
        {mode === 'verify' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5 text-center">
            {/* BIG PROMINENT INSTANT ENTRY BUTTON */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 space-y-2 text-center">
              <p className="text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                لم يصلك الكود إلى بريدك أو تريد الدخول فوراً؟
              </p>
              <button
                type="button"
                onClick={handleSkipVerification}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                <span>⚡ اضغط هنا للمتابعة والدخول المباشر بدون كود</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              <span>أو إذا كان لديك الرمز، تم إرساله إلى: </span>
              <strong className="font-mono text-zinc-900 dark:text-zinc-100">{email}</strong>
            </div>

            {/* Quick Auto-fill banner if debugCode available */}
            {activeOtpCode && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>رمز التحقق السريع: <strong className="font-mono font-bold tracking-widest text-sm">{activeOtpCode}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={handleAutoFillCode}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                >
                  تعبئة تلقائياً ⚡
                </button>
              </div>
            )}

            {/* 6 Digit Inputs */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                أدخل رمز التأكيد المكون من 6 أرقام
              </label>
              <div className="flex items-center justify-center gap-2 sm:gap-2.5" dir="ltr">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpInputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold font-mono rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 disabled:opacity-60 transition-all cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>تأكيد الرمز والدخول</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Check email confirmation link */}
            <button
              type="button"
              onClick={handleCheckConfirmationLink}
              disabled={checkingStatus}
              className="w-full py-2 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checkingStatus ? 'animate-spin' : ''}`} />
              <span>تحقق من تفعيل الرابط (إذا ضغطت عليه في الإيميل) 🔄</span>
            </button>

            {/* Resend and Skip */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading || resendCooldown > 0}
                  className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>
                    {resendCooldown > 0 ? `إعادة الإرسال بعد (${resendCooldown}ث)` : 'إعادة إرسال الرمز أو الرابط'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleSkipVerification}
                  className="text-amber-600 dark:text-amber-400 hover:underline font-bold cursor-pointer flex items-center gap-1 text-xs"
                >
                  <span>تخطي التأكيد والدخول ⚡</span>
                </button>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setMode('login');
                  }}
                  className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-xs cursor-pointer"
                >
                  العودة إلى شاشة تسجيل الدخول
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Supabase Configuration Modal */}
        {showSupabaseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 space-y-4 text-right">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <button
                  type="button"
                  onClick={() => setShowSupabaseModal(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  ✕
                </button>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">إعدادات وربط Supabase</span>
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs">
                    ⚡
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300 space-y-2">
                <p className="font-bold flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400">
                  <span>💡 ملاحظة هامة: لست بحاجة لإدخال أي شيء هنا!</span>
                </p>
                <p className="leading-relaxed">
                  تطبيق QuickDrop مبرمج ليعمل ذاتياً وتلقائياً 100% بنظام التخزين والمصادقة المحلي المحمي مع نقل الملفات بدون أي إعدادات. هذه الشاشة اختيارية فقط للمطورين.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowSupabaseModal(false);
                    onAuthSuccess(quickGuestLogin());
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>⚡ إغلاق والتشغيل التلقائي فوراً (بدون إعدادات)</span>
                </button>
              </div>

              {supabaseConfigError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300">
                  {supabaseConfigError}
                </div>
              )}

              {supabaseConfigSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-700 dark:text-emerald-300">
                  {supabaseConfigSuccess}
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                    Supabase Project URL:
                  </label>
                  <input
                    type="url"
                    placeholder="https://xyzproject.supabase.co"
                    value={supabaseUrlInput}
                    onChange={(e) => setSupabaseUrlInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 text-left font-mono"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                    Supabase Anon Public Key:
                  </label>
                  <input
                    type="text"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={supabaseKeyInput}
                    onChange={(e) => setSupabaseKeyInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 text-left font-mono"
                    dir="ltr"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveSupabaseConfig}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    حفظ وربط Supabase
                  </button>
                  {hasSupabase && (
                    <button
                      type="button"
                      onClick={handleResetSupabaseConfig}
                      className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                    >
                      فصل المشروع
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SQL Migration Script Modal */}
        {showSqlModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-xl max-h-[85vh] flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 text-right">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <button
                  type="button"
                  onClick={() => setShowSqlModal(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  ✕
                </button>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    كود تهيئة جداول Supabase (SQL Migration)
                  </span>
                  <Code2 className="w-4 h-4 text-blue-500" />
                </div>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 leading-relaxed">
                انسخ هذا الكود والصقه في <strong>Supabase Dashboard ➔ SQL Editor</strong> ثم اضغط <strong>RUN</strong> لإنشاء جدول <code>profiles</code> وسلة التخزين <code>avatars</code> مع كامل سياسات الأمان والقوادح التلقائية:
              </p>

              <div className="flex-1 my-3 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-200 text-xs font-mono p-3 relative">
                <pre className="h-64 overflow-y-auto text-left selection:bg-blue-600 select-all whitespace-pre-wrap" dir="ltr">
                  {SQL_PROFILES_MIGRATION.trim()}
                </pre>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowSqlModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  إغلاق
                </button>

                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>تم النسخ بنجاح!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>نسخ كود الـ SQL بالكامل</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
