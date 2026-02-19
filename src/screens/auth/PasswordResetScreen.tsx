import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { AuthService } from '../../services/firebase/auth.service';
import { SPACING, TYPOGRAPHY, getColors } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

export default function PasswordResetScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const colors = getColors(theme);
  const styles = createStyles(colors);

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please provide an email');
      return;
    }

    setLoading(true);
    try {
      await AuthService.resetUserPassword(email)
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
      navigation.goBack()
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.subtitle}>Please insert your email</Text>
        <Text style={styles.subtitle}>An email will be sent to you to change your password</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor={colors.text.secondary}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handlePasswordReset}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            Change password
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ReturnType<typeof getColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    marginBottom: '50%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: colors.text.primary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: colors.text.secondary,
    marginBottom: SPACING.xl,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
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
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  linkButton: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  linkText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: colors.text.secondary,
  },
  linkTextBold: {
    color: colors.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});