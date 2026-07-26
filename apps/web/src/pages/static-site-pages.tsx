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

export function HelpCenterPage() {
  return <StaticDoc doc={helpCenterPage} />;
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
  return <StaticDoc doc={complaintPage} />;
}

export function PartnerProcessPage() {
  return <StaticDoc doc={partnerProcessPage} />;
}

export function PartnerPolicyPage() {
  return <StaticDoc doc={partnerPolicyPage} />;
}
