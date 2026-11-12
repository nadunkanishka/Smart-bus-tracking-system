import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Banner, Button, TextField } from '../shared/ui';
import { COLORS, TYPE } from '../shared/theme';
import { useS } from '../screens/ProfileScreen.styles';

// Edit details, change password and delete account, one form open at a time.
// onSaveProfile / onChangePassword / onDelete throw Error(message) on failure; showToast reports success.
export function AccountActions({ user, onSaveProfile, onChangePassword, onDelete, showToast }) {
  const S = useS();
  const [mode, setMode] = useState(null); // null | 'edit' | 'password' | 'delete'
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmNext, setConfirmNext] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const open = (m) => {
    setError('');
    setCurrent(''); setNext(''); setConfirmNext('');
    setName(user?.name || ''); setPhone(user?.phone || '');
    setMode(m);
  };

  async function run(action, doneMessage) {
    setError('');
    setBusy(true);
    try {
      await action();
      setMode(null);
      if (doneMessage) showToast(doneMessage);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const saveProfile = () => {
    if (!name.trim()) { setError('Full name is required.'); return; }
    run(() => onSaveProfile({ name: name.trim(), phone: phone.trim() }), 'Account updated.');
  };
  const savePassword = () => {
    if (next.length < 6) { setError('New password must be at least 6 characters.'); return; }
    if (next !== confirmNext) { setError('The new passwords do not match.'); return; }
    run(() => onChangePassword(current, next), 'Password changed.');
  };
  const confirmDelete = () => run(() => onDelete(current));

  if (!mode) {
    return (
      <View>
        <Button title="Edit Account Details" tone="soft" onPress={() => open('edit')} style={S.profileBtn} />
        <Button title="Change Password" tone="soft" onPress={() => open('password')} style={S.profileBtn} />
        <Button title="Delete Account" tone="dangerSoft" onPress={() => open('delete')} style={S.profileBtn} />
      </View>
    );
  }

  return (
    <View style={S.profileCard}>
      <Text style={{ ...TYPE.h3, color: COLORS.ink, marginBottom: 12 }}>
        {mode === 'edit' ? 'Edit account details' : mode === 'password' ? 'Change password' : 'Delete account'}
      </Text>
      {error ? <Banner tone="danger">{error}</Banner> : null}

      {mode === 'edit' && (
        <>
          <TextField label="Full name" value={name} onChangeText={setName} placeholder="Your name" />
          <TextField label="Phone (optional)" value={phone} onChangeText={setPhone} placeholder="07X XXX XXXX" keyboardType="phone-pad" />
        </>
      )}
      {mode === 'password' && (
        <>
          <TextField label="Current password" secure value={current} onChangeText={setCurrent} placeholder="Current password" />
          <TextField label="New password" secure value={next} onChangeText={setNext} placeholder="At least 6 characters" />
          <TextField label="Confirm new password" secure value={confirmNext} onChangeText={setConfirmNext} placeholder="Repeat the new password" />
        </>
      )}
      {mode === 'delete' && (
        <>
          <Text style={{ ...TYPE.body, color: COLORS.ink, marginBottom: 12 }}>This permanently removes your account. Enter your password to confirm.</Text>
          <TextField label="Password" secure value={current} onChangeText={setCurrent} placeholder="Your password" />
        </>
      )}

      <Button
        title={mode === 'delete' ? 'Delete My Account' : 'Save'}
        tone={mode === 'delete' ? 'dangerSoft' : 'ink'}
        loading={busy}
        disabled={busy || (mode !== 'edit' && !current && mode !== 'password') || (mode === 'password' && !current)}
        onPress={mode === 'edit' ? saveProfile : mode === 'password' ? savePassword : confirmDelete}
        style={S.profileBtn}
      />
      <Button title="Cancel" tone="soft" onPress={() => setMode(null)} disabled={busy} />
    </View>
  );
}
