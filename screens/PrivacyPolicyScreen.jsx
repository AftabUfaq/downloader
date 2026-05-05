import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

const PrivacyPolicyScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ur';

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <View style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}>
             <ArrowLeft size={24} color="#000" />
          </View>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { marginLeft: isRTL ? 0 : 15, marginRight: isRTL ? 15 : 0 }]}>
          {t('pp_header')}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('pp_s1_title')}
        </Text>
        <Text style={[styles.text, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('pp_s1_text')}
        </Text>

        <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('pp_s2_title')}
        </Text>
        <Text style={[styles.text, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('pp_s2_text')}
        </Text>

        <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('pp_s3_title')}
        </Text>
        <Text style={[styles.text, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('pp_s3_text')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 20, marginBottom: 10, color: '#333' },
  text: { fontSize: 15, lineHeight: 22, color: '#666' }
});

export default PrivacyPolicyScreen;