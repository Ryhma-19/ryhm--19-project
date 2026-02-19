import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SPACING, TYPOGRAPHY, getColors } from "../../constants/theme";
import { useTheme } from "../../contexts/ThemeContext";
import { StoreService, Pack } from "../../services/store/store.service";

type TabType = 'training' | 'diet';

export default function StoreScreen() {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const styles = createStyles(colors);
  const [activeTab, setActiveTab] = useState<TabType>('training');

  const trainingPacks = StoreService.getTrainingPacks();
  const dietPacks = StoreService.getDietPacks();
  const currentPacks = activeTab === 'training' ? trainingPacks : dietPacks;

  const handlePurchase = (pack: Pack) => {
    Alert.alert(
      'Purchase',
      `Purchase ${pack.title} for €${pack.price}?`,
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Buy',
          onPress: () => {
            Alert.alert('Success', `You purchased ${pack.title}! 🎉`);
          },
        },
      ]
    );
  };

  const renderPackCard = ({ item }: { item: Pack }) => (
    <View style={styles.packCard}>
      <View style={styles.packHeader}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={activeTab === 'training' ? 'fitness' : 'restaurant'}
            size={28}
            color="#fff"
          />
        </View>
        <View style={styles.packInfo}>
          <Text style={styles.packTitle}>{item.title}</Text>
          <Text style={styles.packDuration}>{item.duration}</Text>
        </View>
      </View>

      <Text style={styles.packDescription}>{item.description}</Text>

      <View style={styles.packFooter}>
        <Text style={styles.packPrice}>€{item.price}</Text>
        <TouchableOpacity
          style={styles.buyButton}
          onPress={() => handlePurchase(item)}
        >
          <Ionicons name="cart-outline" size={18} color="#fff" />
          <Text style={styles.buyButtonText}>Buy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'training' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('training')}
        >
          <Ionicons
            name="fitness"
            size={20}
            color={activeTab === 'training' ? '#fff' : '#888'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'training' && styles.activeTabText,
            ]}
          >
            Training
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'diet' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('diet')}
        >
          <Ionicons
            name="restaurant"
            size={20}
            color={activeTab === 'diet' ? '#fff' : '#888'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'diet' && styles.activeTabText,
            ]}
          >
            Diet
          </Text>
        </TouchableOpacity>
      </View>

      {/* Packs List */}
      <FlatList
        data={currentPacks}
        keyExtractor={(item) => item.id}
        renderItem={renderPackCard}
        contentContainerStyle={styles.listContainer}
        scrollEnabled={true}
      />
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof getColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  activeTabText: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  packCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  packHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  packInfo: {
    flex: 1,
  },
  packTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  packDuration: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  packDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  packFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  packPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
