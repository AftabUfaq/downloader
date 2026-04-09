import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

const PrivacyPolicyScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>1. Data Collection</Text>
        <Text style={styles.text}>
          Snappy Save does not collect or store your personal media on our servers. All downloads are processed directly on your device.
        </Text>
        <Text style={styles.sectionTitle}>2. Permissions</Text>
        <Text style={styles.text}>
          We require storage permissions only to save media to your gallery. We do not access your private photos or files.
        </Text>
        <Text style={styles.sectionTitle}>3. Third-Party Ads</Text>
        <Text style={styles.text}>
          We use Google AdMob to serve ads. These services may collect device identifiers to provide personalized content.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 15 },
  content: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 20, marginBottom: 10, color: '#333' },
  text: { fontSize: 15, lineHeight: 22, color: '#666' }
});

export default PrivacyPolicyScreen;