import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { COLORS } from '../shared/theme';
import { AuthLayout, Banner, Button, Checkbox, StrengthMeter, TextField } from '../shared/ui';
import { LockIcon, PhoneCallIcon, UserIcon } from '../shared/icons';
import { S } from './AuthScreen.styles';

// One component for both forms, so switching between them keeps the same layout instance mounted.
export function AuthScreen({
  authMode, switchAuthMode, authError, authLoading, showToast, loginUsername,
  setLoginUsername, loginPassword, setLoginPassword, rememberMe, setRememberMe, handleLogin,
  regFullName, setRegFullName, regUsername, setRegUsername, regPhone, setRegPhone,
  regPassword, setRegPassword, regConfirm, setRegConfirm, regTerms, setRegTerms,
  passwordTooShort, confirmMismatch, registerBlocked, handleRegister,
}) {
  return authMode === 'login' ? (
    <AuthLayout
      scene="login"
      tagline="Real-time bus tracking for Colombo commuters"
      title="Welcome back"
      subtitle="Where are you going today?"
      footer={
        <Text style={S.authSwitch}>
          New here?{' '}
          <Text style={S.authSwitchLink} accessibilityRole="link" onPress={() => switchAuthMode('register')}>
            Create an account
          </Text>
        </Text>
      }
    >
      {authError ? <Banner tone="danger">{authError}</Banner> : null}
      <TextField
        label="Username"
        icon={<UserIcon color={COLORS.muted} size={20} />}
        value={loginUsername}
        onChangeText={setLoginUsername}
        placeholder="e.g. kasun_p"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="next"
      />
      <TextField
        label="Password"
        icon={<LockIcon color={COLORS.muted} size={20} />}
        secure
        value={loginPassword}
        onChangeText={setLoginPassword}
        placeholder="Your password"
        returnKeyType="go"
        onSubmitEditing={handleLogin}
      />
      <View style={S.authRow}>
        <Checkbox checked={rememberMe} onChange={setRememberMe}>Remember me</Checkbox>
        <Pressable
          onPress={() => showToast('Password reset is not available yet.')}
          accessibilityRole="link"
          style={S.linkTap}
        >
          <Text style={S.link}>Forgot password?</Text>
        </Pressable>
      </View>
      <Button title="Log in" onPress={handleLogin} loading={authLoading} />
    </AuthLayout>
  ) : (
    <AuthLayout
      scene="register"
      tagline="Personalise your daily commute"
      title="Create account"
      subtitle="It takes less than a minute."
      footer={
        <Text style={S.authSwitch}>
          Already have an account?{' '}
          <Text style={S.authSwitchLink} accessibilityRole="link" onPress={() => switchAuthMode('login')}>
            Log in
          </Text>
        </Text>
      }
    >
      {authError ? <Banner tone="danger">{authError}</Banner> : null}
      <TextField
        label="Full name"
        icon={<UserIcon color={COLORS.muted} size={20} />}
        value={regFullName}
        onChangeText={setRegFullName}
        placeholder="e.g. Kasun Perera"
        returnKeyType="next"
      />
      <TextField
        label="Username"
        icon={<UserIcon color={COLORS.muted} size={20} />}
        value={regUsername}
        onChangeText={setRegUsername}
        placeholder="e.g. kasun_p"
        hint="3-30 letters, numbers, dots or underscores"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="next"
      />
      <TextField
        label="Phone number (optional)"
        icon={<PhoneCallIcon color={COLORS.muted} size={20} />}
        value={regPhone}
        onChangeText={setRegPhone}
        placeholder="+94 77 123 4567"
        keyboardType="phone-pad"
        returnKeyType="next"
      />
      <TextField
        label="Password"
        icon={<LockIcon color={COLORS.muted} size={20} />}
        secure
        value={regPassword}
        onChangeText={setRegPassword}
        placeholder="At least 6 characters"
        error={passwordTooShort ? 'Use at least 6 characters.' : undefined}
        returnKeyType="next"
      />
      <StrengthMeter password={regPassword} />
      <TextField
        label="Confirm password"
        icon={<LockIcon color={COLORS.muted} size={20} />}
        secure
        value={regConfirm}
        onChangeText={setRegConfirm}
        placeholder="Re-enter password"
        error={confirmMismatch ? 'Passwords do not match.' : undefined}
        returnKeyType="done"
        onSubmitEditing={registerBlocked ? undefined : handleRegister}
      />
      <Checkbox checked={regTerms} onChange={setRegTerms}>
        I agree to the Terms of Service and Privacy Policy
      </Checkbox>
      <View style={S.gap16} />
      <Button title="Create account" onPress={handleRegister} loading={authLoading} disabled={registerBlocked} />
    </AuthLayout>
  );
}
