import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Switch, Alert } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { getAuth, updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase/config';

export default function UserSettingsScreen({ navigation }: any) {
  const auth = getAuth();
  const user = auth.currentUser;
  const [notifications, setNotifactions] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [loading, setLoading] = useState(false);

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
    <View style={styles.container}>
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
      <TouchableOpacity
        style={styles.passwordButton}
        onPress={() => navigation.navigate("PasswordUpdate")}
        >
        <Text style={styles.subtitle}>
            Change password
        </Text>
      </TouchableOpacity>
      <Text style={styles.subtitle}>Turn on notifications?</Text>
      <Switch
        value={notifications}
        onValueChange={setNotifactions}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSave}
        disabled={loading}
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
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
});