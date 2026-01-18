import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable, TextInput, Switch, Button } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';

export default function UserSettingsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [notifications, setNotifactions] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [loading, setLoading] = useState(false);

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
      />
      <Text style={styles.subtitle}>Turn on notifications?</Text>
      <Switch
        value={notifications}
        onValueChange={setNotifactions}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.goBack()}
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
});