import { Link } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";

type DocumentKey = "privacy" | "terms" | "acceptable-use" | "accessibility" | "support";

type Section = { heading: string; paragraphs: string[] };
type Document = { title: string; updated: string; intro: string; sections: Section[] };

const documents: Record<DocumentKey, Document> = {
  privacy: {
    title: "Privacy Policy",
    updated: "July 22, 2026",
    intro: "This Privacy Policy explains how AlphaZoneLabs, LLC (\"AlphaZoneLabs,\" \"we,\" \"us,\" or \"our\") handles information in connection with SecureStop.",
    sections: [
      { heading: "Information we collect", paragraphs: ["Depending on how SecureStop is configured and used, we may process account and profile information, organization and role information, transportation assignments, driver credential information, incident records, device and application information, support communications, notification tokens, and location information when enabled and permitted.", "Organizations using SecureStop may provide or direct the collection of information about their personnel, drivers, families, riders, routes, vehicles, or operations. Those organizations are responsible for determining what information they submit and for providing any notices or permissions required by law."] },
      { heading: "How we use information", paragraphs: ["We use information to provide, secure, maintain, troubleshoot, and improve SecureStop; authenticate users; enforce role-based access; deliver alerts and support; investigate incidents; prevent misuse; comply with legal obligations; and protect users, organizations, AlphaZoneLabs, and the public."] },
      { heading: "Location information", paragraphs: ["SecureStop may collect precise or approximate location information from a driver device when an organization enables location features and the user grants device permission. Location information may be used for authorized transportation visibility, operational coordination, safety, and incident response. Device permissions can be managed through device settings, although disabling them may limit related features."] },
      { heading: "How information is shared", paragraphs: ["We may share information with the organization that provides or manages an account, with authorized users based on their role, with vendors that help us operate SecureStop, when required by law, in connection with a business transaction, or when reasonably necessary to protect rights, safety, and security. We do not sell personal information for money."] },
      { heading: "Data retention and security", paragraphs: ["We retain information for as long as reasonably necessary to provide SecureStop, meet contractual and legal obligations, resolve disputes, enforce agreements, and support legitimate operational needs. We use administrative, technical, and organizational safeguards designed to protect information, but no system can guarantee absolute security."] },
      { heading: "Children and student information", paragraphs: ["SecureStop is intended for use under the direction of authorized organizations and adults. It is not intended for children to create accounts independently. When an organization uses SecureStop in an educational or youth transportation context, the organization is responsible for determining its legal basis, obtaining required consent, and configuring access appropriately."] },
      { heading: "Your choices and requests", paragraphs: ["Account and data requests should generally be directed first to the organization that manages the relevant SecureStop account. You may also contact AlphaZoneLabs through the Support page. We may need to verify identity and coordinate with the account organization before completing a request."] },
      { heading: "Changes to this policy", paragraphs: ["We may update this Privacy Policy as SecureStop, our practices, or legal requirements change. The updated date above identifies the latest revision. Material changes may also be communicated through the service or the relevant organization."] },
    ],
  },
  terms: {
    title: "Terms and Conditions",
    updated: "July 22, 2026",
    intro: "These Terms and Conditions govern access to and use of SecureStop, a service provided by AlphaZoneLabs, LLC. By accessing or using SecureStop, you agree to these Terms.",
    sections: [
      { heading: "Authorized use", paragraphs: ["You may use SecureStop only for lawful transportation, safety, administrative, communication, and related purposes authorized by the organization associated with your account. You must follow your organization’s policies and all applicable laws."] },
      { heading: "Accounts and access", paragraphs: ["You are responsible for maintaining the confidentiality of account credentials and for activity under your account. You must provide accurate information, use only the role and organization access assigned to you, and promptly report suspected unauthorized access. AlphaZoneLabs or the account organization may suspend or revoke access when reasonably necessary."] },
      { heading: "Safety responsibilities", paragraphs: ["SecureStop is a coordination and information tool. It does not replace trained personnel, safe driving practices, emergency services, required inspections, supervision, or an organization’s legal and operational responsibilities. Drivers must not interact with SecureStop in a manner that distracts from safe vehicle operation."] },
      { heading: "Organization responsibilities", paragraphs: ["Organizations are responsible for their users, configurations, notices, permissions, data accuracy, retention requirements, and compliance obligations. Organizations must grant access only to appropriate users and promptly remove access when no longer needed."] },
      { heading: "Intellectual property", paragraphs: ["SecureStop, including its software, design, branding, documentation, and related materials, is owned by AlphaZoneLabs or its licensors and is protected by applicable intellectual property laws. These Terms grant a limited, revocable, nonexclusive, nontransferable right to use SecureStop as authorized; they do not transfer ownership."] },
      { heading: "Service availability and changes", paragraphs: ["We may update, modify, suspend, or discontinue features to maintain security, reliability, compliance, or product quality. We do not guarantee uninterrupted or error-free operation. Planned or emergency maintenance may affect availability."] },
      { heading: "Disclaimers", paragraphs: ["TO THE MAXIMUM EXTENT PERMITTED BY LAW, SECURESTOP IS PROVIDED \"AS IS\" AND \"AS AVAILABLE.\" ALPHAZONELABS DISCLAIMS IMPLIED WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. SOME JURISDICTIONS DO NOT ALLOW CERTAIN DISCLAIMERS, SO SOME OF THESE TERMS MAY NOT APPLY."] },
      { heading: "Limitation of liability", paragraphs: ["TO THE MAXIMUM EXTENT PERMITTED BY LAW, ALPHAZONELABS WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, LOST PROFITS, LOST DATA, OR BUSINESS INTERRUPTION ARISING FROM SECURESTOP. ANY DIRECT LIABILITY WILL BE LIMITED TO THE AMOUNT PAID TO ALPHAZONELABS FOR THE AFFECTED SERVICE DURING THE TWELVE MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM, UNLESS A DIFFERENT LIMIT IS REQUIRED BY LAW OR A WRITTEN AGREEMENT."] },
      { heading: "Termination", paragraphs: ["You may stop using SecureStop at any time. AlphaZoneLabs or the account organization may restrict or terminate access for breach, risk, nonpayment, legal requirements, or discontinuation of service. Provisions that by their nature should survive termination will remain effective."] },
      { heading: "Governing terms and changes", paragraphs: ["A separate written agreement between AlphaZoneLabs and an organization may control over conflicting provisions of these Terms. We may revise these Terms by posting an updated version. Continued use after the effective date constitutes acceptance where permitted by law."] },
    ],
  },
  "acceptable-use": {
    title: "Acceptable Use Policy",
    updated: "July 22, 2026",
    intro: "This Acceptable Use Policy protects SecureStop users, organizations, systems, and data. It applies to every person and organization using the service.",
    sections: [
      { heading: "You may not", paragraphs: ["Use SecureStop unlawfully; access information without authorization; share credentials; impersonate another person; bypass security or role controls; probe, scan, disrupt, overload, reverse engineer, scrape, or introduce malicious code; upload false, harmful, infringing, or unlawfully obtained content; use the service to harass, discriminate, threaten, surveil improperly, or endanger another person; or use SecureStop while operating a vehicle when doing so would be unsafe or unlawful."] },
      { heading: "Sensitive information", paragraphs: ["Do not enter payment card information, government identification numbers, medical records, or other highly sensitive information unless the applicable SecureStop workflow expressly requests it and your organization has authorized the collection."] },
      { heading: "Enforcement", paragraphs: ["We may investigate suspected violations and preserve or disclose relevant information when permitted by law. We may remove content, restrict features, suspend accounts, notify an account organization, or terminate access. Serious or unlawful conduct may be reported to appropriate authorities."] },
      { heading: "Reporting concerns", paragraphs: ["Report suspected misuse, security issues, or unsafe use through the SecureStop Support page. Do not publicly disclose a vulnerability before AlphaZoneLabs has had a reasonable opportunity to investigate and address it."] },
    ],
  },
  accessibility: {
    title: "Accessibility Statement",
    updated: "July 22, 2026",
    intro: "AlphaZoneLabs, LLC is committed to making SecureStop usable by people with diverse abilities, devices, and access needs.",
    sections: [
      { heading: "Our approach", paragraphs: ["We aim to use clear language, logical navigation, readable contrast, scalable layouts, meaningful labels, keyboard-compatible web interactions, and platform accessibility features where practical. Accessibility is considered throughout design, development, testing, and support."] },
      { heading: "Ongoing improvement", paragraphs: ["SecureStop is an evolving product, and some areas may not yet meet every accessibility standard or user need. We review feedback and prioritize improvements that reduce barriers to essential transportation and safety workflows."] },
      { heading: "Request assistance", paragraphs: ["If you experience an accessibility barrier, use the Support page and include the page or feature involved, your device and browser or operating system, the assistive technology used, and the task you were trying to complete. We will make reasonable efforts to provide an accessible alternative and address the issue."] },
    ],
  },
  support: {
    title: "Support",
    updated: "July 22, 2026",
    intro: "Use the guidance below to get help with SecureStop while protecting account and transportation information.",
    sections: [
      { heading: "Account and access help", paragraphs: ["For invitations, role assignments, organization access, driver records, family access, or password issues, contact the SecureStop administrator for your organization first. Organization administrators control most user access and operational records."] },
      { heading: "Technical support", paragraphs: ["When reporting a technical issue, include what you were trying to do, what happened, the approximate date and time, device type, operating system or browser, and any non-sensitive error message. Do not include passwords, full government identifiers, medical details, or unnecessary student information."] },
      { heading: "Safety and emergencies", paragraphs: ["SecureStop support is not an emergency service. For an immediate threat, crash, missing person, medical emergency, or other urgent danger, contact 911 or the appropriate local emergency authority and follow your organization’s emergency procedures."] },
      { heading: "Privacy, security, and accessibility", paragraphs: ["You may use your organization’s support channel to submit privacy or data requests. Security concerns and accessibility barriers should be clearly identified so they can be routed appropriately. AlphaZoneLabs may need to coordinate with your organization before changing account-controlled information."] },
      { heading: "Contact", paragraphs: ["Use the support contact method provided inside your SecureStop account or by your organization. Until a dedicated public support address is configured, organization administrators should contact their AlphaZoneLabs implementation representative."] },
    ],
  },
};

export function LegalDocument({ documentKey }: { documentKey: DocumentKey }) {
  const document = documents[documentKey];
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.nav}>
        <Link href="/marketing" asChild><Button mode="text">← SecureStop</Button></Link>
        <Link href="/login" asChild><Button mode="contained">Sign in</Button></Link>
      </View>
      <View style={styles.article}>
        <Text variant="displaySmall" style={styles.title}>{document.title}</Text>
        <Text variant="bodySmall" style={styles.updated}>Last updated: {document.updated}</Text>
        <Text variant="titleMedium" style={styles.intro}>{document.intro}</Text>
        {document.sections.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text variant="headlineSmall" style={styles.heading}>{section.heading}</Text>
            {section.paragraphs.map((paragraph) => <Text key={paragraph} variant="bodyLarge" style={styles.paragraph}>{paragraph}</Text>)}
          </View>
        ))}
        <Text variant="bodySmall" style={styles.notice}>These public policies are general product terms and should be reviewed by qualified legal counsel before commercial launch or use in a regulated deployment.</Text>
      </View>
      <View style={styles.footer}>
        <View style={styles.links}>
          <Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/acceptable-use">Acceptable Use</Link><Link href="/accessibility">Accessibility</Link><Link href="/support">Support</Link>
        </View>
        <Text variant="bodySmall" style={styles.updated}>© {new Date().getFullYear()} AlphaZoneLabs, LLC. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7F9FB" },
  content: { alignItems: "center", minHeight: "100%" },
  nav: { width: "100%", maxWidth: 980, paddingHorizontal: 22, paddingVertical: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  article: { width: "100%", maxWidth: 840, paddingHorizontal: 24, paddingTop: 54, paddingBottom: 72 },
  title: { color: "#102C44", fontWeight: "800" },
  updated: { color: "#6A7985", marginTop: 8 },
  intro: { color: "#3F5667", lineHeight: 29, marginTop: 26, marginBottom: 12 },
  section: { marginTop: 34, gap: 12 },
  heading: { color: "#123A5A", fontWeight: "700" },
  paragraph: { color: "#435866", lineHeight: 29 },
  notice: { color: "#6A7985", lineHeight: 20, borderTopWidth: 1, borderTopColor: "#D9E1E7", paddingTop: 20, marginTop: 44 },
  footer: { width: "100%", maxWidth: 980, borderTopWidth: 1, borderTopColor: "#D9E1E7", paddingHorizontal: 22, paddingVertical: 28, gap: 14 },
  links: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
});