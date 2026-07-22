import { Link } from "expo-router";
import { ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { Button, Card, Text } from "react-native-paper";

const features = [
  ["Live route visibility", "Give approved administrators and families a clear, role-based view of active transportation activity."],
  ["Driver-first workflows", "Keep essential credentials, assignments, alerts, and incident tools organized without unnecessary complexity."],
  ["Safer communication", "Share timely operational updates while keeping access controlled by organization and user role."],
  ["Incident readiness", "Document, review, and respond to transportation incidents from one consistent system of record."],
  ["Multi-organization support", "Separate data and access across schools, programs, fleets, or transportation partners."],
  ["Mobile and web access", "Support drivers and families on mobile while giving administrators a practical desktop workspace."],
];

export default function MarketingPage() {
  const { width } = useWindowDimensions();
  const compact = width < 760;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.nav}>
        <Text variant="titleLarge" style={styles.brand}>SecureStop</Text>
        <View style={styles.navActions}>
          <Link href="/login" asChild><Button mode="text">Sign in</Button></Link>
          <Link href="/request-access" asChild><Button mode="contained">Request access</Button></Link>
        </View>
      </View>

      <View style={[styles.hero, compact && styles.heroCompact]}>
        <View style={styles.heroCopy}>
          <Text variant="labelLarge" style={styles.eyebrow}>TRANSPORTATION SAFETY, CONNECTED</Text>
          <Text variant={compact ? "displaySmall" : "displayMedium"} style={styles.headline}>
            Better visibility for every secure stop.
          </Text>
          <Text variant="titleMedium" style={styles.subhead}>
            SecureStop helps transportation teams coordinate drivers, administrators, and families through one role-based safety and operations platform.
          </Text>
          <View style={styles.ctaRow}>
            <Link href="/request-access" asChild><Button mode="contained" contentStyle={styles.cta}>Request access</Button></Link>
            <Link href="/login" asChild><Button mode="outlined" contentStyle={styles.cta}>Open SecureStop</Button></Link>
          </View>
        </View>

        <Card style={styles.heroCard} mode="contained">
          <Card.Content style={styles.heroCardContent}>
            <Text variant="titleLarge">One coordinated view</Text>
            <View style={styles.metric}><Text variant="headlineMedium">3</Text><Text>purpose-built role experiences</Text></View>
            <View style={styles.divider} />
            <Text variant="bodyLarge">Administrators oversee operations.</Text>
            <Text variant="bodyLarge">Drivers stay focused on assigned work.</Text>
            <Text variant="bodyLarge">Families receive the visibility intended for them.</Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.section}>
        <Text variant="headlineMedium" style={styles.center}>Designed for real transportation operations</Text>
        <Text variant="bodyLarge" style={styles.sectionIntro}>
          SecureStop brings the most important day-to-day transportation information into a focused experience that is easier to understand, manage, and act on.
        </Text>
        <View style={styles.grid}>
          {features.map(([title, body]) => (
            <Card key={title} style={[styles.featureCard, compact && styles.featureCardCompact]} mode="outlined">
              <Card.Content style={styles.featureContent}>
                <Text variant="titleMedium">{title}</Text>
                <Text variant="bodyMedium" style={styles.muted}>{body}</Text>
              </Card.Content>
            </Card>
          ))}
        </View>
      </View>

      <View style={[styles.band, compact && styles.bandCompact]}>
        <View style={styles.bandCopy}>
          <Text variant="headlineSmall">Built around appropriate access</Text>
          <Text variant="bodyLarge" style={styles.bandText}>
            SecureStop uses role-based experiences and organization context to help keep users focused on the information and actions relevant to their responsibilities.
          </Text>
        </View>
        <Link href="/privacy" asChild><Button mode="contained-tonal">Review privacy practices</Button></Link>
      </View>

      <View style={styles.section}>
        <Text variant="headlineMedium" style={styles.center}>Who SecureStop serves</Text>
        <View style={styles.audienceRow}>
          {[
            ["Administrators", "Monitor operations, organize driver records, review incidents, and manage access."],
            ["Drivers", "See assigned information, receive alerts, and complete essential workflows from mobile devices."],
            ["Families", "Access the transportation information and notifications made available by their organization."],
          ].map(([title, body]) => (
            <View key={title} style={[styles.audience, compact && styles.audienceCompact]}>
              <Text variant="titleLarge">{title}</Text>
              <Text variant="bodyMedium" style={styles.muted}>{body}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.finalCta}>
        <Text variant="headlineMedium" style={styles.center}>Make transportation coordination clearer.</Text>
        <Text variant="bodyLarge" style={styles.centerMuted}>Request access for your organization or sign in to an existing SecureStop account.</Text>
        <View style={styles.ctaRowCentered}>
          <Link href="/request-access" asChild><Button mode="contained" contentStyle={styles.cta}>Request access</Button></Link>
          <Link href="/login" asChild><Button mode="outlined" contentStyle={styles.cta}>Sign in</Button></Link>
        </View>
      </View>

      <View style={[styles.footer, compact && styles.footerCompact]}>
        <View>
          <Text variant="titleMedium">SecureStop</Text>
          <Text variant="bodySmall" style={styles.muted}>Transportation safety and operations software.</Text>
        </View>
        <View style={styles.footerLinks}>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/acceptable-use">Acceptable Use</Link>
          <Link href="/accessibility">Accessibility</Link>
          <Link href="/support">Support</Link>
        </View>
        <Text variant="bodySmall" style={styles.muted}>© {new Date().getFullYear()} AlphaZoneLabs, LLC. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F6F8FB" },
  content: { minHeight: "100%", alignItems: "center" },
  nav: { width: "100%", maxWidth: 1180, paddingHorizontal: 24, paddingVertical: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { fontWeight: "800", color: "#123A5A" },
  navActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  hero: { width: "100%", maxWidth: 1180, paddingHorizontal: 24, paddingVertical: 72, flexDirection: "row", gap: 48, alignItems: "center" },
  heroCompact: { flexDirection: "column", paddingVertical: 44, alignItems: "stretch" },
  heroCopy: { flex: 1, gap: 20 },
  eyebrow: { color: "#147D92", fontWeight: "800", letterSpacing: 1.4 },
  headline: { color: "#102C44", fontWeight: "800", lineHeight: 62 },
  subhead: { color: "#526575", lineHeight: 30, maxWidth: 680 },
  ctaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
  cta: { minHeight: 48, paddingHorizontal: 14 },
  heroCard: { flex: 0.72, minWidth: 310, backgroundColor: "#123A5A", borderRadius: 28 },
  heroCardContent: { padding: 28, gap: 16 },
  metric: { flexDirection: "row", alignItems: "baseline", gap: 10 },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,.2)" },
  section: { width: "100%", maxWidth: 1180, paddingHorizontal: 24, paddingVertical: 64 },
  center: { textAlign: "center", color: "#102C44", fontWeight: "700" },
  centerMuted: { textAlign: "center", color: "#5E6F7D" },
  sectionIntro: { textAlign: "center", color: "#5E6F7D", maxWidth: 760, alignSelf: "center", marginTop: 14, lineHeight: 28 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 36 },
  featureCard: { width: "31.8%", minWidth: 270, backgroundColor: "#FFFFFF", borderColor: "#DCE5EC" },
  featureCardCompact: { width: "100%" },
  featureContent: { gap: 10, minHeight: 150, paddingTop: 22 },
  muted: { color: "#60717E", lineHeight: 22 },
  band: { width: "100%", backgroundColor: "#DDEFF2", paddingHorizontal: 32, paddingVertical: 40, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 24 },
  bandCompact: { flexDirection: "column", alignItems: "flex-start" },
  bandCopy: { maxWidth: 760, gap: 8 },
  bandText: { color: "#365668", lineHeight: 27 },
  audienceRow: { flexDirection: "row", gap: 28, marginTop: 34 },
  audience: { flex: 1, gap: 10, borderTopWidth: 3, borderTopColor: "#147D92", paddingTop: 18 },
  audienceCompact: { width: "100%", flex: 0 },
  finalCta: { width: "100%", backgroundColor: "#FFFFFF", paddingHorizontal: 24, paddingVertical: 70, alignItems: "center", gap: 14 },
  ctaRowCentered: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 12 },
  footer: { width: "100%", maxWidth: 1180, paddingHorizontal: 24, paddingVertical: 30, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 20 },
  footerCompact: { flexDirection: "column", alignItems: "flex-start" },
  footerLinks: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
});