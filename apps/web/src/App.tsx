import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { SiteLayout } from './components/layout/site-layout';
import { UserDashboardLayout } from './components/layout/user-dashboard-layout';
import { AdminBookingDetailPage } from './pages/admin/admin-booking-detail-page';
import { AdminBookingsPage } from './pages/admin/admin-bookings-page';
import { AdminCatalogPage } from './pages/admin/admin-catalog-page';
import { AdminComplaintsPage } from './pages/admin/admin-complaints-page';
import { AdminFlaggedPage } from './pages/admin/admin-flagged-page';
import { AdminLayout } from './pages/admin/admin-layout';
import { AdminOverviewPage } from './pages/admin/admin-overview-page';
import { AdminPartnersPage } from './pages/admin/admin-partners-page';
import { AdminReviewsPage } from './pages/admin/admin-reviews-page';
import { AdminUsersPage } from './pages/admin/admin-users-page';
import { BookingSuccessPage } from './pages/booking-success-page';
import { CompanyInfoPage } from './pages/company-info-page';
import { CustomerBookingDetailPage } from './pages/customer-booking-detail-page';
import { GroupDetailPage } from './pages/group-detail-page';
import { GroupsPage } from './pages/groups-page';
import { HireServicePage } from './pages/hire-service-page';
import { HomePage } from './pages/home-page';
import { InvoiceDetailPage, InvoicesPage } from './pages/invoices-page';
import { LoginPage } from './pages/login-page';
import { MyBookingsPage } from './pages/my-bookings-page';
import { PartnerBookingDetailPage } from './pages/partner-booking-detail-page';
import { PartnerDashboardPage } from './pages/partner-dashboard-page';
import { PartnerProfilePage } from './pages/partner-profile-page';
import { RegisterPage } from './pages/register-page';
import { ServiceDetailPage } from './pages/service-detail-page';
import { WalletPage } from './pages/wallet-page';
import {
  AboutPage,
  BookingGuidePage,
  ComplaintPage,
  HelpCenterPage,
  PartnerPolicyPage,
  PartnerProcessPage,
  PrivacyPage,
  RefundPage,
  TermsPage,
  WarrantyPage,
} from './pages/static-site-pages';

function RedirectNguoiToUser() {
  const { userId = '' } = useParams();
  return <Navigate to={`/user/${userId}`} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <SiteLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/thong-tin-cong-ty" element={<CompanyInfoPage />} />
          <Route path="/gioi-thieu" element={<AboutPage />} />
          <Route path="/dieu-khoan" element={<TermsPage />} />
          <Route path="/chinh-sach-bao-mat" element={<PrivacyPage />} />
          <Route path="/tro-giup" element={<HelpCenterPage />} />
          <Route path="/huong-dan-dat-dich-vu" element={<BookingGuidePage />} />
          <Route path="/chinh-sach-bao-hanh" element={<WarrantyPage />} />
          <Route path="/chinh-sach-hoan-tien" element={<RefundPage />} />
          <Route path="/khieu-nai" element={<ComplaintPage />} />
          <Route path="/quy-trinh-doi-tac" element={<PartnerProcessPage />} />
          <Route path="/chinh-sach-doi-tac" element={<PartnerPolicyPage />} />
          <Route path="/nhom" element={<GroupsPage />} />
          <Route path="/nhom/:slug" element={<GroupDetailPage />} />
          <Route path="/dich-vu/:slug" element={<ServiceDetailPage />} />
          <Route path="/user/:userId" element={<PartnerProfilePage />} />
          <Route path="/nguoi/:userId" element={<RedirectNguoiToUser />} />
          <Route path="/dat-lich/:id" element={<BookingSuccessPage />} />
          <Route path="/dang-nhap" element={<LoginPage />} />
          <Route path="/dang-ky" element={<RegisterPage />} />
          <Route element={<UserDashboardLayout />}>
            <Route path="/don-cua-toi" element={<MyBookingsPage />} />
            <Route path="/don-cua-toi/don/:id" element={<CustomerBookingDetailPage />} />
            <Route path="/don-cua-toi/thue" element={<HireServicePage />} />
            <Route path="/don-cua-toi/ho-so" element={<PartnerDashboardPage />} />
            <Route path="/don-cua-toi/vi" element={<WalletPage basePath="/don-cua-toi" />} />
            <Route
              path="/don-cua-toi/hoa-don"
              element={<InvoicesPage basePath="/don-cua-toi" />}
            />
            <Route
              path="/don-cua-toi/hoa-don/:id"
              element={<InvoiceDetailPage basePath="/don-cua-toi" />}
            />
            <Route path="/don-cua-toi/tro-giup" element={<HelpCenterPage />} />
            <Route path="/don-cua-toi/khieu-nai" element={<ComplaintPage />} />
            <Route path="/doi-tac" element={<PartnerDashboardPage />} />
            <Route path="/doi-tac/viec" element={<PartnerDashboardPage />} />
            <Route path="/doi-tac/viec/:id" element={<PartnerBookingDetailPage />} />
            <Route path="/doi-tac/vi" element={<WalletPage basePath="/doi-tac" />} />
            <Route path="/doi-tac/hoa-don" element={<InvoicesPage basePath="/doi-tac" />} />
            <Route
              path="/doi-tac/hoa-don/:id"
              element={<InvoiceDetailPage basePath="/doi-tac" />}
            />
            <Route path="/doi-tac/ho-so" element={<PartnerDashboardPage />} />
            <Route path="/doi-tac/cap-do" element={<PartnerDashboardPage />} />
            <Route path="/doi-tac/quy-trinh" element={<PartnerProcessPage />} />
          </Route>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverviewPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="partners" element={<AdminPartnersPage />} />
            <Route path="bookings" element={<AdminBookingsPage />} />
            <Route path="bookings/:id" element={<AdminBookingDetailPage />} />
            <Route path="reviews" element={<AdminReviewsPage />} />
            <Route path="complaints" element={<AdminComplaintsPage />} />
            <Route path="flagged" element={<AdminFlaggedPage />} />
            <Route path="catalog" element={<AdminCatalogPage />} />
          </Route>
        </Routes>
      </SiteLayout>
    </BrowserRouter>
  );
}
