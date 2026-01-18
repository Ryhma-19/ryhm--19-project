import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';


export default function ProfileScreen({navigation}: any) {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Pressable style={styles.settingsButton} onPress={() => navigation.navigate('UserSettings')}>
        <Ionicons name="settings-sharp" size={32}/>
      </Pressable>
      
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>{user?.displayName}</Text>
      <Text style={styles.email}>{user?.email}</Text>

      <TouchableOpacity style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
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
  title: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  email: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text.light,
    marginBottom: SPACING.xl,
  },
  button: {
    backgroundColor: COLORS.error,
    borderRadius: 8,
    padding: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  settingsButton: {
    alignSelf: 'flex-end',
    position: 'absolute',
    right: 20,
    top: 50,
  }
});