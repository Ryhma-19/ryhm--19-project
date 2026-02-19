import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Switch, Alert, ScrollView } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, getColors } from '../../constants/theme';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, ThemeType } from '../../contexts/ThemeContext';

export default function UserSettingsScreen({ navigation }: any) {
  const { signOut } = useAuth()
  const { theme, setTheme } = useTheme();
  const user = auth.currentUser;
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [loading, setLoading] = useState(false);
  const [weight, setWeight] = useState('');
  const colors = getColors(theme);
  const styles = createStyles(colors);

  const handleSave = async () => {
    setLoading(true)
    if (!user) {
      Alert.alert("No user detected")
      return
    }

    try {
        if (displayName !== user?.displayName) {
            updateProfile(user, {displayName})

            const userRef = doc(db, 'users', user.uid);

            await updateDoc(userRef, {
                displayName: displayName
            });
            console.log("Display name updated")
        }

        if (email !== user?.email) {
            const userRef = doc(db, 'users', user.uid);

            await updateDoc(userRef, {
                email: email
            });
            console.log("Email address updated")
        }
    } catch (error: any) {
    console.error(error.message);
    } finally {
    setLoading(false);
    }
  }

  return (
    <ScrollView
    contentContainerStyle={styles.container}
    keyboardShouldPersistTaps="handled"
    showsVerticalScrollIndicator={false}
    >
      
        <Text style={styles.subtitle}>Change display name</Text>
        <TextInput
          placeholder="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          style={styles.input}
        />

        <Text style={styles.subtitle}>Change email address</Text>
        <TextInput
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.subtitle}>Change your weight</Text>
        <TextInput
          placeholder="weight"
          value={weight}
          onChangeText={setWeight}
          style={styles.input}
          keyboardType='decimal-pad'
        />

        <TouchableOpacity
          style={styles.passwordButton}
          onPress={() => navigation.navigate("PasswordUpdate")}
          >
          <Text style={styles.subtitle}>
            Change password
          </Text>
        </TouchableOpacity>

        <Text style={styles.subtitle}>Choose Theme</Text>
        <View style={styles.themeContainer}>
          {(['normal', 'dark', 'light'] as ThemeType[]).map((themeOption) => (
            <TouchableOpacity
              key={themeOption}
              style={[
                styles.themeButton,
                theme === themeOption && styles.themeButtonActive,
              ]}
              onPress={() => setTheme(themeOption)}
            >
              <Text
                style={[
                  styles.themeButtonText,
                  theme === themeOption && styles.themeButtonTextActive,
                ]}
              >
                {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSave}
          disabled={loading}
          >
          <Text style={styles.buttonText}>
              {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      
    </ScrollView>
  );
}


const createStyles = (colors: ReturnType<typeof getColors>) => StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: SPACING.lg,
    paddingBottom: 40,
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
    marginTop: SPACING.sm,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  passwordButton: {
    borderRadius: 8,
    padding: SPACING.sm,
    alignItems: 'center',
    marginBottom: 16,
  },
  signOutButton: {
    backgroundColor: colors.error,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: 40,
  },
  themeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  themeButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  themeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  themeButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: colors.text.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  themeButtonTextActive: {
    color: '#FFFFFF',
  },
});