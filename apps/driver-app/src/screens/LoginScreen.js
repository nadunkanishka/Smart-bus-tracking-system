import React from 'react';
import { Text } from 'react-native';
import { COLORS } from '../shared/theme';
import { AuthLayout, Banner, Button, TextField } from '../shared/ui';
import { BusIcon, LockIcon } from '../shared/icons';
import { DISPATCH_PHONE } from '../constants';
import { D } from './LoginScreen.styles';

// No Register screen: bus accounts are created by the admin dashboard.
export function LoginScreen({ loginError, busRegistration, setBusRegistration, busPassword, setBusPassword, handleLogin, loginLoading }) {
  return (
    <AuthLayout
      scene="driver"
      brand="SmartBus Driver"
      tagline="Broadcast live GPS to passengers"
      title="Driver sign in"
      subtitle="Enter your bus registration details."
      footer={
        <Text style={D.authHelp}>
          Forgot your password? Ask Transit Dispatch at {DISPATCH_PHONE}.
        </Text>
      }
    >
      {loginError ? <Banner tone="danger">{loginError}</Banner> : null}
      <TextField
        label="Bus registration no."
        icon={<BusIcon color={COLORS.muted} size={20} />}
        value={busRegistration}
        onChangeText={setBusRegistration}
        placeholder="e.g. NB-4712"
        autoCapitalize="characters"
      />
      <TextField
        label="Security password"
        icon={<LockIcon color={COLORS.muted} size={20} />}
        secure
        value={busPassword}
        onChangeText={setBusPassword}
        placeholder="Enter driver password"
        onSubmitEditing={handleLogin}
      />
      <Button title="Sign in" onPress={handleLogin} loading={loginLoading} />
    </AuthLayout>
  );
}
