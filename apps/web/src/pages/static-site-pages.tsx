import { StaticDoc } from '../components/content/static-doc';
import {
  aboutPage,
  bookingGuidePage,
  complaintPage,
  helpCenterPage,
  partnerPolicyPage,
  partnerProcessPage,
  privacyPage,
  refundPage,
  rulesPage,
  termsPage,
  warrantyPage,
} from '../content/site-pages';

export function AboutPage() {
  return <StaticDoc doc={aboutPage} />;
}

export function TermsPage() {
  return <StaticDoc doc={termsPage} />;
}

export function PrivacyPage() {
  return <StaticDoc doc={privacyPage} />;
}

export function RulesPage() {
  return <StaticDoc doc={rulesPage} dashboardIcon="shield" />;
}

export function HelpCenterPage() {
  return <StaticDoc doc={helpCenterPage} dashboardIcon="headset" />;
}

export function BookingGuidePage() {
  return <StaticDoc doc={bookingGuidePage} />;
}

export function WarrantyPage() {
  return <StaticDoc doc={warrantyPage} />;
}

export function RefundPage() {
  return <StaticDoc doc={refundPage} />;
}

export function ComplaintPage() {
  return <StaticDoc doc={complaintPage} dashboardIcon="message" />;
}

export function PartnerProcessPage() {
  return <StaticDoc doc={partnerProcessPage} dashboardIcon="shield" />;
}

export function PartnerPolicyPage() {
  return <StaticDoc doc={partnerPolicyPage} />;
}
