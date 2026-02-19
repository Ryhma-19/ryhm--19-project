import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable, TextInput, Switch, Button, Alert } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, TYPOGRAPHY, getColors } from '../../constants/theme';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { auth } from '../../services/firebase/config';


export default function PasswordUpdateScreen({ navigation }: any) {
  const user = auth.currentUser;
  const { theme } = useTheme();
  const colors = getColors(theme);
  const styles = createStyles(colors);
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
        placeholderTextColor={colors.text.secondary}
        style={styles.input}
        secureTextEntry
      />
      <Text style={styles.subtitle}>New password</Text>
      <TextInput
        placeholder=""
        value={newPassword}
        onChangeText={setNewPassword}
        placeholderTextColor={colors.text.secondary}
        style={styles.input}
        secureTextEntry
      />
      <Text style={styles.subtitle}>Confirm new password</Text>
      <TextInput
        placeholder=""
        value={confirmedNewPassword}
        onChangeText={setConfirmedNewPassword}
        placeholderTextColor={colors.text.secondary}
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

const createStyles = (colors: ReturnType<typeof getColors>) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: SPACING.lg,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: colors.text.secondary,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    width: '100%',
    borderColor: colors.border,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    color: colors.text.primary,
  },
  button: {
    backgroundColor: colors.primary,
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
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
});