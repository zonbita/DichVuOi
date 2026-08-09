import { Suspense, lazy, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { TermsAcceptGate } from './components/auth/terms-accept-gate';
import { SiteLayout } from './components/layout/site-layout';
import { UserDashboardLayout } from './components/layout/user-dashboard-layout';

const HomePage = lazy(() =>
  import('./pages/home-page').then((m) => ({ default: m.HomePage })),
);
const CompanyInfoPage = lazy(() =>
  import('./pages/company-info-page').then((m) => ({
    default: m.CompanyInfoPage,
  })),
);
const GroupsPage = lazy(() =>
  import('./pages/groups-page').then((m) => ({ default: m.GroupsPage })),
);
const ServicePostsPage = lazy(() =>
  import('./pages/service-posts-page').then((m) => ({
    default: m.ServicePostsPage,
  })),
);
const GroupDetailPage = lazy(() =>
  import('./pages/group-detail-page').then((m) => ({
    default: m.GroupDetailPage,
  })),
);
const ServiceDetailPage = lazy(() =>
  import('./pages/service-detail-page').then((m) => ({
    default: m.ServiceDetailPage,
  })),
);
const PartnerProfilePage = lazy(() =>
  import('./pages/partner-profile-page').then((m) => ({
    default: m.PartnerProfilePage,
  })),
);
const PartnerServicePostDetailPage = lazy(() =>
  import('./pages/partner-service-post-detail-page').then((m) => ({
    default: m.PartnerServicePostDetailPage,
  })),
);
const BookingSuccessPage = lazy(() =>
  import('./pages/booking-success-page').then((m) => ({
    default: m.BookingSuccessPage,
  })),
);
const LoginPage = lazy(() =>
  import('./pages/login-page').then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import('./pages/register-page').then((m) => ({ default: m.RegisterPage })),
);
const MyBookingsPage = lazy(() =>
  import('./pages/my-bookings-page').then((m) => ({
    default: m.MyBookingsPage,
  })),
);
const CustomerBookingDetailPage = lazy(() =>
  import('./pages/customer-booking-detail-page').then((m) => ({
    default: m.CustomerBookingDetailPage,
  })),
);
const HireServicePage = lazy(() =>
  import('./pages/hire-service-page').then((m) => ({
    default: m.HireServicePage,
  })),
);
const CustomerPublishSchedulePage = lazy(() =>
  import('./pages/customer-publish-schedule-page').then((m) => ({
    default: m.CustomerPublishSchedulePage,
  })),
);
const PartnerDashboardPage = lazy(() =>
  import('./pages/partner-dashboard-page').then((m) => ({
    default: m.PartnerDashboardPage,
  })),
);
const PartnerServicePostsPage = lazy(() =>
  import('./pages/partner-service-posts-page').then((m) => ({
    default: m.PartnerServicePostsPage,
  })),
);
const PartnerBookingDetailPage = lazy(() =>
  import('./pages/partner-booking-detail-page').then((m) => ({
    default: m.PartnerBookingDetailPage,
  })),
);
const OpenJobDetailPage = lazy(() =>
  import('./pages/open-job-detail-page').then((m) => ({
    default: m.OpenJobDetailPage,
  })),
);
const WalletPage = lazy(() =>
  import('./pages/wallet-page').then((m) => ({ default: m.WalletPage })),
);
const WithdrawPage = lazy(() =>
  import('./pages/withdraw-page').then((m) => ({ default: m.WithdrawPage })),
);
const InvoicesPage = lazy(() =>
  import('./pages/invoices-page').then((m) => ({ default: m.InvoicesPage })),
);
const InvoiceDetailPage = lazy(() =>
  import('./pages/invoices-page').then((m) => ({
    default: m.InvoiceDetailPage,
  })),
);

const AboutPage = lazy(() =>
  import('./pages/static-site-pages').then((m) => ({ default: m.AboutPage })),
);
const TermsPage = lazy(() =>
  import('./pages/static-site-pages').then((m) => ({ default: m.TermsPage })),
);
const PrivacyPage = lazy(() =>
  import('./pages/static-site-pages').then((m) => ({ default: m.PrivacyPage })),
);
const RulesPage = lazy(() =>
  import('./pages/static-site-pages').then((m) => ({ default: m.RulesPage })),
);
const HelpCenterPage = lazy(() =>
  import('./pages/static-site-pages').then((m) => ({
    default: m.HelpCenterPage,
  })),
);
const BookingGuidePage = lazy(() =>
  import('./pages/static-site-pages').then((m) => ({
    default: m.BookingGuidePage,
  })),
);
const WarrantyPage = lazy(() =>
  import('./pages/static-site-pages').then((m) => ({
    default: m.WarrantyPage,
  })),
);
const RefundPage = lazy(() =>
  import('./pages/static-site-pages').then((m) => ({ default: m.RefundPage })),
);
const ComplaintPage = lazy(() =>
  import('./pages/static-site-pages').then((m) => ({
    default: m.ComplaintPage,
  })),
);
const PartnerProcessPage = lazy(() =>
  import('./pages/static-site-pages').then((m) => ({
    default: m.PartnerProcessPage,
  })),
);
const PartnerPolicyPage = lazy(() =>
  import('./pages/static-site-pages').then((m) => ({
    default: m.PartnerPolicyPage,
  })),
);

const AdminLayout = lazy(() =>
  import('./pages/admin/admin-layout').then((m) => ({
    default: m.AdminLayout,
  })),
);
const AdminOverviewPage = lazy(() =>
  import('./pages/admin/admin-overview-page').then((m) => ({
    default: m.AdminOverviewPage,
  })),
);
const AdminSupportChatPage = lazy(() =>
  import('./pages/admin/admin-support-chat-page').then((m) => ({
    default: m.AdminSupportChatPage,
  })),
);
const AdminUsersPage = lazy(() =>
  import('./pages/admin/admin-users-page').then((m) => ({
    default: m.AdminUsersPage,
  })),
);
const AdminPartnersPage = lazy(() =>
  import('./pages/admin/admin-partners-page').then((m) => ({
    default: m.AdminPartnersPage,
  })),
);
const AdminBookingsPage = lazy(() =>
  import('./pages/admin/admin-bookings-page').then((m) => ({
    default: m.AdminBookingsPage,
  })),
);
const AdminBookingDetailPage = lazy(() =>
  import('./pages/admin/admin-booking-detail-page').then((m) => ({
    default: m.AdminBookingDetailPage,
  })),
);
const AdminReviewsPage = lazy(() =>
  import('./pages/admin/admin-reviews-page').then((m) => ({
    default: m.AdminReviewsPage,
  })),
);
const AdminServicePostsPage = lazy(() =>
  import('./pages/admin/admin-service-posts-page').then((m) => ({
    default: m.AdminServicePostsPage,
  })),
);
const AdminServicePostDetailPage = lazy(() =>
  import('./pages/admin/admin-service-post-detail-page').then((m) => ({
    default: m.AdminServicePostDetailPage,
  })),
);
const AdminComplaintsPage = lazy(() =>
  import('./pages/admin/admin-complaints-page').then((m) => ({
    default: m.AdminComplaintsPage,
  })),
);
const AdminFlaggedPage = lazy(() =>
  import('./pages/admin/admin-flagged-page').then((m) => ({
    default: m.AdminFlaggedPage,
  })),
);
const AdminAuditLogsPage = lazy(() =>
  import('./pages/admin/admin-audit-logs-page').then((m) => ({
    default: m.AdminAuditLogsPage,
  })),
);
const AdminFinancePage = lazy(() =>
  import('./pages/admin/admin-finance-page').then((m) => ({
    default: m.AdminFinancePage,
  })),
);
const AdminCatalogPage = lazy(() =>
  import('./pages/admin/admin-catalog-page').then((m) => ({
    default: m.AdminCatalogPage,
  })),
);

function RedirectNguoiToUser() {
  const { userId = '' } = useParams();
  return <Navigate to={`/user/${userId}`} replace />;
}

function RedirectDonThueToViecMoi() {
  const { id = '' } = useParams();
  return <Navigate to={`/viec-moi/${id}`} replace />;
}

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--color-muted)]">
      Đang tải trang…
    </div>
  );
}

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

export default function App() {
  return (
    <BrowserRouter>
      <TermsAcceptGate>
        <SiteLayout>
          <Lazy>
            <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/thong-tin-cong-ty" element={<CompanyInfoPage />} />
            <Route path="/gioi-thieu" element={<AboutPage />} />
            <Route path="/dieu-khoan" element={<TermsPage />} />
            <Route path="/chinh-sach-bao-mat" element={<PrivacyPage />} />
            <Route path="/noi-quy" element={<RulesPage />} />
            <Route path="/tro-giup" element={<HelpCenterPage />} />
            <Route path="/huong-dan-dat-dich-vu" element={<BookingGuidePage />} />
            <Route path="/chinh-sach-bao-hanh" element={<WarrantyPage />} />
            <Route path="/chinh-sach-hoan-tien" element={<RefundPage />} />
            <Route path="/khieu-nai" element={<ComplaintPage />} />
            <Route path="/quy-trinh-doi-tac" element={<PartnerProcessPage />} />
            <Route path="/chinh-sach-doi-tac" element={<PartnerPolicyPage />} />
            <Route path="/nhom" element={<GroupsPage />} />
            <Route path="/bai-dang" element={<ServicePostsPage />} />
            <Route path="/viec-moi/:id" element={<OpenJobDetailPage />} />
            <Route
              path="/doi-tac/don-thue/:id"
              element={<RedirectDonThueToViecMoi />}
            />
            <Route path="/nhom/:slug" element={<GroupDetailPage />} />
            <Route path="/dich-vu/:slug" element={<ServiceDetailPage />} />
            <Route path="/user/:userId" element={<PartnerProfilePage />} />
            <Route
              path="/user/:userId/dich-vu/:postId"
              element={<PartnerServicePostDetailPage />}
            />
            <Route path="/nguoi/:userId" element={<RedirectNguoiToUser />} />
            <Route path="/dat-lich/:id" element={<BookingSuccessPage />} />
            <Route path="/dang-nhap" element={<LoginPage />} />
            <Route path="/dang-ky" element={<RegisterPage />} />
            <Route element={<UserDashboardLayout />}>
              <Route path="/don-cua-toi" element={<MyBookingsPage />} />
              <Route
                path="/don-cua-toi/don/:id"
                element={<CustomerBookingDetailPage />}
              />
              <Route path="/don-cua-toi/thue" element={<HireServicePage />} />
              <Route
                path="/don-cua-toi/lich-dang"
                element={<CustomerPublishSchedulePage />}
              />
              <Route
                path="/don-cua-toi/ho-so"
                element={<PartnerDashboardPage />}
              />
              <Route
                path="/don-cua-toi/vi"
                element={<WalletPage basePath="/don-cua-toi" />}
              />
              <Route
                path="/don-cua-toi/rut-tien"
                element={<WithdrawPage basePath="/don-cua-toi" />}
              />
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
              <Route path="/don-cua-toi/noi-quy" element={<RulesPage />} />
              <Route path="/doi-tac" element={<PartnerDashboardPage />} />
              <Route path="/doi-tac/don-thue" element={<PartnerDashboardPage />} />
              <Route path="/doi-tac/viec" element={<PartnerDashboardPage />} />
              <Route
                path="/doi-tac/viec/:id"
                element={<PartnerBookingDetailPage />}
              />
              <Route
                path="/doi-tac/vi"
                element={<WalletPage basePath="/doi-tac" />}
              />
              <Route
                path="/doi-tac/rut-tien"
                element={<WithdrawPage basePath="/doi-tac" />}
              />
              <Route
                path="/doi-tac/hoa-don"
                element={<InvoicesPage basePath="/doi-tac" />}
              />
              <Route
                path="/doi-tac/hoa-don/:id"
                element={<InvoiceDetailPage basePath="/doi-tac" />}
              />
              <Route path="/doi-tac/ho-so" element={<PartnerDashboardPage />} />
              <Route
                path="/doi-tac/dich-vu"
                element={<PartnerServicePostsPage />}
              />
              <Route path="/doi-tac/cap-do" element={<PartnerDashboardPage />} />
              <Route path="/doi-tac/quy-trinh" element={<PartnerProcessPage />} />
            </Route>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverviewPage />} />
              <Route path="support" element={<AdminSupportChatPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="partners" element={<AdminPartnersPage />} />
              <Route path="bookings" element={<AdminBookingsPage />} />
              <Route path="bookings/:id" element={<AdminBookingDetailPage />} />
              <Route path="reviews" element={<AdminReviewsPage />} />
              <Route path="service-posts" element={<AdminServicePostsPage />} />
              <Route
                path="service-posts/:postId"
                element={<AdminServicePostDetailPage />}
              />
              <Route path="complaints" element={<AdminComplaintsPage />} />
              <Route path="flagged" element={<AdminFlaggedPage />} />
              <Route path="audit" element={<AdminAuditLogsPage />} />
              <Route path="finance" element={<AdminFinancePage />} />
              <Route path="catalog" element={<AdminCatalogPage />} />
            </Route>
          </Routes>
        </Lazy>
      </SiteLayout>
      </TermsAcceptGate>
    </BrowserRouter>
  );
}
