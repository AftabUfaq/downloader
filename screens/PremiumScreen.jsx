import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView 
} from 'react-native';
import { 
  X, 
  Download, 
  ShieldCheck, 
  Zap, 
  Clock, 
  CheckCircle2, 
  Infinity as InfinityIcon, 
  Eraser 
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

export default function PremiumScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors, isDarkMode } = useTheme();

  // Helper for Feature Cards
  const FeatureCard = ({ icon: Icon, title, desc }) => (
    <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? '#2A2A2A' : '#F0F7FF' }]}>
        <Icon size={22} color="#2196F3" />
      </View>
      <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.featureDesc, { color: colors.subText }]}>{desc}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header - Close Button */}
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={[styles.closeButton, { backgroundColor: colors.border }]}
        >
          <X size={20} color={colors.text} />
        </TouchableOpacity>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.mainIconContainer}>
             <View style={styles.blueCircle}>
                <Download size={50} color="white" />
                <View style={styles.checkBadge}>
                    <CheckCircle2 size={24} color="#4CAF50" fill="white" />
                </View>
             </View>
             {/* Small Floating Badges */}
             <View style={[styles.badge, styles.badgeLeft]}>
                <Text style={styles.badgeText}>{t('premium_badge_no_ads')}</Text>
             </View>
             <View style={[styles.badge, styles.badgeRight]}>
                <Text style={styles.badgeText}>{t('premium_badge_hd')}</Text>
             </View>
          </View>

          <Text style={[styles.headline, { color: colors.text }]}>{t('premium_headline')}</Text>
          <Text style={[styles.subHeadline, { color: colors.subText }]}>
            {t('premium_subheadline')}
          </Text>
        </View>

        {/* Features Grid */}
        <View style={styles.grid}>
          <FeatureCard
            icon={InfinityIcon}
            title={t('premium_feat_unlimited')}
            desc={t('premium_feat_unlimited_desc')}
          />
          <FeatureCard
            icon={Eraser}
            title={t('premium_feat_watermark')}
            desc={t('premium_feat_watermark_desc')}
          />
          <FeatureCard
            icon={Zap}
            title={t('premium_feat_speed')}
            desc={t('premium_feat_speed_desc')}
          />
          <FeatureCard
            icon={Clock}
            title={t('premium_feat_support')}
            desc={t('premium_feat_support_desc')}
          />
        </View>

        <TouchableOpacity style={styles.viewPlans}>
            <Text style={{ color: '#2196F3', fontWeight: '600' }}>{t('premium_view_plans')}</Text>
        </TouchableOpacity>

        {/* CTA Button */}
        <TouchableOpacity style={styles.ctaButton}>
            <ShieldCheck size={20} color="white" style={{ marginRight: 10 }} />
            <View>
                <Text style={styles.ctaText}>{t('premium_cta')}</Text>
                <Text style={styles.ctaSubText}>{t('premium_cta_sub')}</Text>
            </View>
        </TouchableOpacity>

        {/* Footer Links */}
        <Text style={[styles.footerText, { color: colors.subText }]}>
            {t('premium_footer')}
        </Text>
        <View style={styles.footerLinks}>
            <Text style={styles.link}>{t('premium_terms')}</Text>
            <Text style={styles.link}>{t('premium_restore')}</Text>
            <Text style={styles.link}>{t('privacy')}</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, alignItems: 'center' },
  closeButton: {
    alignSelf: 'flex-start',
    padding: 8,
    borderRadius: 20,
    marginBottom: 10,
  },
  heroSection: { alignItems: 'center', marginBottom: 30 },
  mainIconContainer: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  blueCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBadge: { position: 'absolute', bottom: 0, right: 0 },
  badge: {
    position: 'absolute',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    backgroundColor: 'white',
    elevation: 5,
    shadowOpacity: 0.1,
  },
  badgeLeft: { top: 20, left: -40 },
  badgeRight: { top: 10, right: -40 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  headline: { fontSize: 24, fontWeight: '900', marginTop: 10 },
  subHeadline: { textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  featureCard: {
    width: '48%',
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: 15,
    alignItems: 'center',
  },
  iconCircle: { padding: 10, borderRadius: 20, marginBottom: 10 },
  featureTitle: { fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
  featureDesc: { fontSize: 10, textAlign: 'center', marginTop: 4 },
  viewPlans: { marginVertical: 15 },
  ctaButton: {
    backgroundColor: '#2196F3',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  ctaText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  ctaSubText: { color: 'white', fontSize: 12, opacity: 0.8 },
  footerText: { marginTop: 15, fontSize: 12 },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginTop: 10,
    marginBottom: 30
  },
  link: { color: '#2196F3', fontSize: 12, textDecorationLine: 'underline' }
});