import React, { useState, useRef } from 'react';
import { 
  User, 
  Mail, 
  Camera, 
  Laptop, 
  Calendar, 
  CheckCircle, 
  Save, 
  LogOut, 
  ShieldCheck, 
  Trash2, 
  UploadCloud,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  Code2,
  Copy,
  Check,
  Sparkles
} from 'lucide-react';
import { UserProfile, PasswordStrength } from '../types.ts';
import { 
  updateUserProfile, 
  uploadUserAvatar, 
  updateUserPassword, 
  evaluatePasswordStrength,
  isSupabaseConfigured,
  SQL_PROFILES_MIGRATION,
  generateDeterministicAvatar
} from '../lib/auth.ts';
import { UserAvatar } from './UserAvatar.tsx';

interface ProfileViewProps {
  user: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onLogout: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onUpdateUser,
  onLogout,
}) => {
  const [name, setName] = useState(user.name);
  const [deviceName, setDeviceName] = useState(user.deviceName || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Password update state
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // SQL Migration Modal State
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const passwordStrength: PasswordStrength = evaluatePasswordStrength(newPassword);

  // Handle uploading and updating Avatar
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('يرجى اختيار ملف صورة صالح (PNG, JPG, WebP, GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 5 ميجابايت');
      return;
    }

    setUploadingAvatar(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await uploadUserAvatar(user.id, file);
      if (res.success && res.url) {
        setAvatarUrl(res.url);
        const updated: UserProfile = {
          ...user,
          avatarUrl: res.url,
          updatedAt: new Date().toISOString(),
        };
        onUpdateUser(updated);
        setSuccessMsg('تم رفع وتحديث صورتك الشخصية بنجاح! 📸');
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg(res.error || 'فشل رفع الصورة إلى Supabase');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Generate deterministic avatar
  const handleResetToGeneratedAvatar = async () => {
    const defaultUrl = generateDeterministicAvatar(name);
    setAvatarUrl(defaultUrl);
    setSaving(true);
    try {
      const res = await updateUserProfile({
        name: name.trim(),
        avatarUrl: defaultUrl,
        deviceName: deviceName.trim(),
      });
      if (res.success && res.user) {
        onUpdateUser(res.user);
        setSuccessMsg('تم تعيين صورة رمزية هندسية مميزة لحسابك!');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  // Save profile changes (name & device)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await updateUserProfile({
        name: name.trim(),
        avatarUrl,
        deviceName: deviceName.trim(),
      });

      if (res.success && res.user) {
        onUpdateUser(res.user);
        setSuccessMsg('تم حفظ وتحديث بيانات حسابك في Supabase بنجاح! ✅');
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg(res.error || 'تعذر حفظ التعديلات');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  // Update Password
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMsg('كلمتا المرور غير متطابقتين');
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await updateUserPassword(newPassword);
      if (res.success) {
        setSuccessMsg('تم تحديث كلمة المرور لحسابك بنجاح! 🔒');
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg(res.error || 'فشل تحديث كلمة المرور');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء تحديث كلمة المرور');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SQL_PROFILES_MIGRATION.trim());
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } catch {}
  };

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="break-words">إدارة الحساب الشخصي (Profile Settings)</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            بيانات حسابك وصورتك الرمزية محفوظة في قاعدة بيانات Supabase وسلة التخزين السحابي.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowSqlModal(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-900 transition-colors cursor-pointer"
            title="كود SQL لإنشاء جداول Supabase"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>كود SQL</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
            id="profile-logout-btn"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{successMsg}</span>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6 sm:space-y-8">

        {/* AVATAR SECTION */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <UserAvatar
              name={name || user.name}
              avatarUrl={avatarUrl}
              size="2xl"
              className="shadow-xl group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <button
              type="button"
              className="absolute bottom-1 right-1 p-2.5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 ring-2 ring-white dark:ring-zinc-900 shadow-md hover:scale-105 transition-all cursor-pointer"
              title="تغيير الصورة"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarFileChange}
          />

          <div className="space-y-2 text-center sm:text-right">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {name || user.name}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
              {user.email}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center sm:justify-start gap-2 pt-1 w-full">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="w-full sm:w-auto px-3.5 py-2 sm:py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{uploadingAvatar ? 'جاري الرفع لـ Storage...' : 'رفع صورة جديدة 📸'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetToGeneratedAvatar}
                className="w-full sm:w-auto px-3.5 py-2 sm:py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>صورة هندسية تلقائية</span>
              </button>
            </div>
          </div>
        </div>

        {/* PROFILE DETAILS FORM */}
        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {/* Display Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                الاسم الظاهر (Display Name)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="اسمك الكامل"
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-base sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  id="profile-name-input"
                />
                <User className="w-4 h-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Device Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                اسم الجهاز المقترن (Device Name)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="مثل: MacBook Pro أو iPhone 15"
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-base sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  id="profile-devicename-input"
                />
                <Laptop className="w-4 h-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>


            {/* Email Address (Readonly) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                البريد الإلكتروني (غير قابل للتعديل)
              </label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500 dark:text-zinc-400 font-mono text-left cursor-not-allowed"
                  dir="ltr"
                />
                <Mail className="w-4 h-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Account Creation Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                تاريخ التسجيل
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  value={user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : 'غير متوفر'}
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                />
                <Calendar className="w-4 h-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              id="save-profile-btn"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>حفظ التعديلات في Supabase</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* PASSWORD CHANGE SECTION */}
        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-blue-500" />
            <span>تحديث كلمة المرور (Change Password)</span>
          </h4>

          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  كلمة المرور الجديدة
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="8 خانات على الأقل"
                    className="w-full pl-10 pr-3 py-2.5 sm:py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-base sm:text-xs text-zinc-900 dark:text-zinc-100 text-left font-mono"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-3 sm:top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  تأكيد كلمة المرور
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="أعد إدخال كلمة المرور"
                  className="w-full px-3 py-2.5 sm:py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-base sm:text-xs text-zinc-900 dark:text-zinc-100 text-left font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            {newPassword.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500">مؤشر القوة:</span>
                  <span className="font-bold">{passwordStrength.label}</span>
                </div>
                <div className="grid grid-cols-4 gap-1 h-1">
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
              </div>
            )}

            <button
              type="submit"
              disabled={updatingPassword || !newPassword}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-700 dark:hover:bg-zinc-650 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {updatingPassword ? 'جاري التحديث...' : 'تأكيد تغيير كلمة المرور'}
            </button>
          </form>
        </div>
      </div>

      {/* SQL Migration Modal */}
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
  );
};
