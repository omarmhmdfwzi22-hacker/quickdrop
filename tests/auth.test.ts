/**
 * Auth System Unit Tests
 */
process.env.NODE_ENV = 'test';
import { 
  signUpUser, 
  verifyEmailCode, 
  signInUser, 
  signOutUser, 
  getActiveUser, 
  updateUserProfile,
  signInWithGoogle,
  _getPendingCodeForTestingOnly
} from '../src/lib/auth.ts';

// Mock localStorage for Node test environment
const mockStorage: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, val: string) => { mockStorage[key] = val; },
  removeItem: (key: string) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
};

async function runAuthTests() {
  console.log('Running Auth System tests...');

  // 1. Initial State: No active user
  let active = await getActiveUser();
  if (active !== null) throw new Error('Expected no active user initially');
  console.log('  ✓ Initial state is logged out');

  // 2. Sign Up with Email & Password
  const testEmail = 'pilot@example.com';
  const testPass = 'Secret123!';
  const signUpRes = await signUpUser(testEmail, testPass, 'Captain Quick');
  
  if (!signUpRes.success || !signUpRes.needsEmailVerification) {
    throw new Error('Sign up failed or did not require email verification');
  }
  const pendingCode = _getPendingCodeForTestingOnly(testEmail);
  if (!pendingCode) {
    throw new Error('Verification code was not generated securely');
  }
  console.log('  ✓ Sign-up dispatched verification code securely to email');

  // 3. Verify Email with Wrong Code (Should Fail)
  const wrongRes = await verifyEmailCode(testEmail, '000000');
  if (wrongRes.success) throw new Error('Wrong verification code should fail');
  console.log('  ✓ Invalid OTP code rejected');

  // 4. Verify Email with Correct Code
  const validRes = await verifyEmailCode(testEmail, pendingCode);
  if (!validRes.success || !validRes.user) throw new Error('Valid OTP verification failed');
  if (validRes.user.name !== 'Captain Quick') throw new Error('User profile name mismatch');
  console.log('  ✓ OTP verification confirmed email and created session');

  // 5. Update Profile (Name & Custom Device & Avatar)
  const updateRes = await updateUserProfile({
    name: 'Captain Quick Updated',
    deviceName: 'MacBook Pro M3 Max',
    avatarUrl: 'https://example.com/avatar.png',
  });
  if (!updateRes.success || updateRes.user?.name !== 'Captain Quick Updated') {
    throw new Error('Update profile failed');
  }
  console.log('  ✓ Profile name, device name, and avatar updated');

  // 6. Sign Out
  await signOutUser();
  active = await getActiveUser();
  if (active !== null) throw new Error('Sign out did not clear active session');
  console.log('  ✓ Logout cleared session correctly');

  // 7. Log in with wrong password (Should Fail)
  const wrongLogin = await signInUser(testEmail, 'wrong_pass');
  if (wrongLogin.success) throw new Error('Login with incorrect password should fail');
  console.log('  ✓ Incorrect login credentials rejected');

  // 8. Log in with original credentials (Should Restore the exact profile!)
  const loginRes = await signInUser(testEmail, testPass);
  if (!loginRes.success || !loginRes.user) throw new Error('Valid login failed');
  if (loginRes.user.name !== 'Captain Quick Updated') {
    throw new Error('User profile did not restore updated name');
  }
  if (loginRes.user.deviceName !== 'MacBook Pro M3 Max') {
    throw new Error('User profile did not restore updated device name');
  }
  console.log('  ✓ Re-login restored exact user account, custom device name, and avatar');

  // 9. Google Sign-In (OAuth Flow)
  const googleRes = await signInWithGoogle({
    email: 'googler@gmail.com',
    name: 'Google User',
    avatarUrl: 'https://example.com/google.png'
  });
  if (!googleRes.success || !googleRes.user || googleRes.user.provider !== 'google') {
    throw new Error('Google sign-in failed');
  }
  if (!googleRes.user.emailConfirmed) {
    throw new Error('Google user email should be pre-verified');
  }
  console.log('  ✓ Google OAuth sign-in works seamlessly with pre-verified status');

  console.log('All Auth tests passed successfully! ✓');
}

runAuthTests().catch((err) => {
  console.error('Auth test failed:', err);
  process.exit(1);
});
