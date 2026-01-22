import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable, TextInput, Switch, Button, Alert } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { auth } from '../../services/firebase/config';


export default function PasswordUpdateScreen({ navigation }: any) {
  const user = auth.currentUser;
  const [loading, setLoading] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmedNewPassword, setConfirmedNewPassword] = useState('');

  const handlePasswordUpdate = async () => {
    setLoading(true)
    if (confirmedNewPassword !== newPassword) {
      Alert.alert("Passwords don't match")
      console.log("Passwords don't match")
      setLoading(false)
      return
    }

    if (user) {
      const credential = EmailAuthProvider.credential(
        user.email!,
        oldPassword
      )

      try {
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        console.log("Password updated");

        navigation.navigate("ProfileMain")
      } catch (error: any) {
        console.error(error.message);
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>Old Password</Text>
      <TextInput
        placeholder=""
        value={oldPassword}
        onChangeText={setOldPassword}
        style={styles.input}
        secureTextEntry
      />
      <Text style={styles.subtitle}>New password</Text>
      <TextInput
        placeholder=""
        value={newPassword}
        onChangeText={setNewPassword}
        style={styles.input}
        secureTextEntry
      />
      <Text style={styles.subtitle}>Confirm new password</Text>
      <TextInput
        placeholder=""
        value={confirmedNewPassword}
        onChangeText={setConfirmedNewPassword}
        style={styles.input}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handlePasswordUpdate}
        disabled={loading || !oldPassword || !newPassword || !confirmedNewPassword}
        >
        <Text style={styles.buttonText}>
            {loading ? 'Saving...' : 'Save'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    width: '100%',
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  passwordButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
});