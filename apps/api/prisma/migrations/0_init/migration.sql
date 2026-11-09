-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'PARTNER', 'ADMIN', 'MODERATOR');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('SCHEDULED', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'AWAITING_CONFIRM', 'DISPUTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RequirementSource" AS ENUM ('SERVICE_INCLUDES', 'CUSTOMER_NOTE', 'MANUAL');

-- CreateEnum
CREATE TYPE "ComplaintResolutionAction" AS ENUM ('REFUND', 'RELEASE', 'RETRY_IN_PROGRESS', 'RETRY_AWAITING', 'NONE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'HELD', 'RELEASED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('TOP_UP', 'WITHDRAW', 'ESCROW_HOLD', 'ESCROW_REFUND', 'PARTNER_PAYOUT', 'ADMIN_ADJUSTMENT', 'APPLY_DEPOSIT', 'APPLY_REFUND', 'APPLY_FORFEIT');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('APPLIED', 'SELECTED', 'REJECTED', 'WITHDRAWN', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PartnerServicePostStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "HomeShoutKind" AS ENUM ('GREETING', 'AVAILABLE', 'PROMO', 'LOOKING', 'THANKS');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PAID', 'SETTLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "SupportThreadStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "googleId" TEXT,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneOtpKey" TEXT,
    "phoneOtpExpiresAt" TIMESTAMP(3),
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailOtpCode" TEXT,
    "emailOtpExpiresAt" TIMESTAMP(3),
    "emailPending" TEXT,
    "emailOtpSendCount" INTEGER NOT NULL DEFAULT 0,
    "emailOtpWindowStartedAt" TIMESTAMP(3),
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "chatBanned" BOOLEAN NOT NULL DEFAULT false,
    "termsAcceptedAt" TIMESTAMP(3),
    "walletBalance" INTEGER NOT NULL DEFAULT 0,
    "bankBin" TEXT,
    "bankCode" TEXT,
    "bankName" TEXT,
    "bankAccountNo" TEXT,
    "bankAccountName" TEXT,
    "bankVerified" BOOLEAN NOT NULL DEFAULT false,
    "bankVerifyOtpCode" TEXT,
    "bankVerifyOtpExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "metaJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "partnerUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "city" TEXT DEFAULT 'Hồ Chí Minh',
    "districts" TEXT,
    "ratingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "onlineSeconds" INTEGER NOT NULL DEFAULT 0,
    "lastOnlineAt" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "bankVerified" BOOLEAN NOT NULL DEFAULT false,
    "bankName" TEXT,
    "bankAccountNo" TEXT,
    "bankAccountName" TEXT,
    "phoneOtpCode" TEXT,
    "phoneOtpExpiresAt" TIMESTAMP(3),
    "bankVerifyIntentId" TEXT,
    "bankVerifyExpiresAt" TIMESTAMP(3),
    "avatarUrl" TEXT,
    "galleryJson" TEXT,
    "skillsJson" TEXT,
    "acceptingJobs" BOOLEAN NOT NULL DEFAULT true,
    "workModes" TEXT DEFAULT 'onsite',
    "responseMinutes" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerServicePost" (
    "id" TEXT NOT NULL,
    "partnerProfileId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "coverUrl" TEXT,
    "imagesJson" TEXT,
    "status" "PartnerServicePostStatus" NOT NULL DEFAULT 'PENDING',
    "rejectReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerServicePost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeShout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "servicePostId" TEXT NOT NULL,
    "kind" "HomeShoutKind" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomeShout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerService" (
    "id" TEXT NOT NULL,
    "partnerProfileId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "price" INTEGER,
    "priceMin" INTEGER,
    "priceMax" INTEGER,
    "headline" TEXT,
    "experienceYears" INTEGER NOT NULL DEFAULT 0,
    "includes" TEXT,
    "excludes" TEXT,
    "coverageNote" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceGroup" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "supportsOnline" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "basePrice" INTEGER NOT NULL,
    "priceMin" INTEGER NOT NULL DEFAULT 0,
    "priceMax" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'giờ',
    "durationMin" INTEGER NOT NULL DEFAULT 60,
    "supportsOnline" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "partnerId" TEXT,
    "serviceId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "publishAt" TIMESTAMP(3),
    "jobTitle" TEXT,
    "note" TEXT,
    "budgetMin" INTEGER,
    "budgetMax" INTEGER,
    "applyDepositBps" INTEGER NOT NULL DEFAULT 1000,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "totalPrice" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "commissionBps" INTEGER NOT NULL DEFAULT 1500,
    "commissionAmount" INTEGER NOT NULL DEFAULT 0,
    "partnerPayout" INTEGER NOT NULL DEFAULT 0,
    "paidAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "confirmDeadlineAt" TIMESTAMP(3),
    "matchingDeadlineAt" TIMESTAMP(3),
    "responseDeadlineAt" TIMESTAMP(3),
    "disputeResultNote" TEXT,
    "settlementPercent" INTEGER,
    "settlementProposedBy" "Role",
    "customerSettlementApprovedAt" TIMESTAMP(3),
    "partnerSettlementApprovedAt" TIMESTAMP(3),
    "settlementResolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingApplication" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "depositAmount" INTEGER NOT NULL,
    "depositStatus" "PaymentStatus" NOT NULL DEFAULT 'HELD',
    "status" "ApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookingId" TEXT,
    "type" "WalletTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTopUpIntent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "orderCode" INTEGER NOT NULL,
    "intentToken" TEXT NOT NULL,
    "paymentLinkId" TEXT,
    "provider" TEXT NOT NULL,
    "transferNote" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTopUpIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "partnerId" TEXT,
    "customerName" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "commissionAmount" INTEGER NOT NULL DEFAULT 0,
    "partnerPayout" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PAID',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingRequirement" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "source" "RequirementSource" NOT NULL DEFAULT 'SERVICE_INCLUDES',
    "partnerDone" BOOLEAN NOT NULL DEFAULT false,
    "partnerDoneAt" TIMESTAMP(3),
    "customerConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "customerConfirmedAt" TIMESTAMP(3),
    "evidenceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingMessage" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "redacted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportThread" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "status" "SupportThreadStatus" NOT NULL DEFAULT 'OPEN',
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "redacted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "reporterUserId" TEXT NOT NULL,
    "partnerUserId" TEXT NOT NULL,
    "againstUserId" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirementIdsJson" TEXT,
    "evidenceNote" TEXT,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'SUBMITTED',
    "deductionPoints" INTEGER,
    "adminNote" TEXT,
    "resolutionAction" "ComplaintResolutionAction",
    "resolvedAt" TIMESTAMP(3),
    "resolvedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerReputationPeriod" (
    "id" TEXT NOT NULL,
    "partnerUserId" TEXT NOT NULL,
    "periodIndex" INTEGER NOT NULL,
    "startingPoints" INTEGER NOT NULL DEFAULT 1000,
    "currentPoints" INTEGER NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerReputationPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReputationLedgerEntry" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "complaintId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReputationLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_actorId_createdAt_idx" ON "AdminAuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_action_idx" ON "AdminAuditLog"("action");

-- CreateIndex
CREATE INDEX "PartnerFavorite_userId_createdAt_idx" ON "PartnerFavorite"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PartnerFavorite_partnerUserId_idx" ON "PartnerFavorite"("partnerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerFavorite_userId_partnerUserId_key" ON "PartnerFavorite"("userId", "partnerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerProfile_userId_key" ON "PartnerProfile"("userId");

-- CreateIndex
CREATE INDEX "PartnerServicePost_partnerProfileId_status_idx" ON "PartnerServicePost"("partnerProfileId", "status");

-- CreateIndex
CREATE INDEX "PartnerServicePost_serviceId_idx" ON "PartnerServicePost"("serviceId");

-- CreateIndex
CREATE INDEX "PartnerServicePost_status_createdAt_idx" ON "PartnerServicePost"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerServicePost_partnerProfileId_serviceId_key" ON "PartnerServicePost"("partnerProfileId", "serviceId");

-- CreateIndex
CREATE INDEX "HomeShout_createdAt_idx" ON "HomeShout"("createdAt");

-- CreateIndex
CREATE INDEX "HomeShout_userId_createdAt_idx" ON "HomeShout"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "HomeShout_servicePostId_idx" ON "HomeShout"("servicePostId");

-- CreateIndex
CREATE INDEX "PartnerService_serviceId_idx" ON "PartnerService"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerService_partnerProfileId_serviceId_key" ON "PartnerService"("partnerProfileId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceGroup_slug_key" ON "ServiceGroup"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_groupId_idx" ON "Category"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

-- CreateIndex
CREATE INDEX "Service_categoryId_idx" ON "Service"("categoryId");

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

-- CreateIndex
CREATE INDEX "Booking_partnerId_idx" ON "Booking"("partnerId");

-- CreateIndex
CREATE INDEX "Booking_serviceId_idx" ON "Booking"("serviceId");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_paymentStatus_idx" ON "Booking"("paymentStatus");

-- CreateIndex
CREATE INDEX "Booking_scheduledAt_idx" ON "Booking"("scheduledAt");

-- CreateIndex
CREATE INDEX "Booking_publishAt_idx" ON "Booking"("publishAt");

-- CreateIndex
CREATE INDEX "Booking_matchingDeadlineAt_idx" ON "Booking"("matchingDeadlineAt");

-- CreateIndex
CREATE INDEX "Booking_responseDeadlineAt_idx" ON "Booking"("responseDeadlineAt");

-- CreateIndex
CREATE INDEX "BookingApplication_bookingId_status_idx" ON "BookingApplication"("bookingId", "status");

-- CreateIndex
CREATE INDEX "BookingApplication_partnerId_createdAt_idx" ON "BookingApplication"("partnerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BookingApplication_bookingId_partnerId_key" ON "BookingApplication"("bookingId", "partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTransaction_reference_key" ON "WalletTransaction"("reference");

-- CreateIndex
CREATE INDEX "WalletTransaction_userId_createdAt_idx" ON "WalletTransaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "WalletTransaction_bookingId_idx" ON "WalletTransaction"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTopUpIntent_orderCode_key" ON "WalletTopUpIntent"("orderCode");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTopUpIntent_intentToken_key" ON "WalletTopUpIntent"("intentToken");

-- CreateIndex
CREATE INDEX "WalletTopUpIntent_userId_createdAt_idx" ON "WalletTopUpIntent"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_bookingId_key" ON "Invoice"("bookingId");

-- CreateIndex
CREATE INDEX "Invoice_customerId_issuedAt_idx" ON "Invoice"("customerId", "issuedAt");

-- CreateIndex
CREATE INDEX "Invoice_partnerId_issuedAt_idx" ON "Invoice"("partnerId", "issuedAt");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "BookingRequirement_bookingId_sortOrder_idx" ON "BookingRequirement"("bookingId", "sortOrder");

-- CreateIndex
CREATE INDEX "BookingMessage_bookingId_createdAt_idx" ON "BookingMessage"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "BookingMessage_senderId_idx" ON "BookingMessage"("senderId");

-- CreateIndex
CREATE INDEX "SupportThread_customerId_status_idx" ON "SupportThread"("customerId", "status");

-- CreateIndex
CREATE INDEX "SupportThread_assigneeId_idx" ON "SupportThread"("assigneeId");

-- CreateIndex
CREATE INDEX "SupportThread_lastMessageAt_idx" ON "SupportThread"("lastMessageAt");

-- CreateIndex
CREATE INDEX "SupportMessage_threadId_createdAt_idx" ON "SupportMessage"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "SupportMessage_senderId_idx" ON "SupportMessage"("senderId");

-- CreateIndex
CREATE INDEX "Review_toUserId_idx" ON "Review"("toUserId");

-- CreateIndex
CREATE INDEX "Review_bookingId_idx" ON "Review"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_fromUserId_key" ON "Review"("bookingId", "fromUserId");

-- CreateIndex
CREATE INDEX "Complaint_partnerUserId_status_idx" ON "Complaint"("partnerUserId", "status");

-- CreateIndex
CREATE INDEX "Complaint_reporterUserId_idx" ON "Complaint"("reporterUserId");

-- CreateIndex
CREATE INDEX "Complaint_againstUserId_idx" ON "Complaint"("againstUserId");

-- CreateIndex
CREATE INDEX "Complaint_bookingId_idx" ON "Complaint"("bookingId");

-- CreateIndex
CREATE INDEX "Complaint_status_createdAt_idx" ON "Complaint"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PartnerReputationPeriod_partnerUserId_idx" ON "PartnerReputationPeriod"("partnerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerReputationPeriod_partnerUserId_periodIndex_key" ON "PartnerReputationPeriod"("partnerUserId", "periodIndex");

-- CreateIndex
CREATE INDEX "ReputationLedgerEntry_periodId_createdAt_idx" ON "ReputationLedgerEntry"("periodId", "createdAt");

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerFavorite" ADD CONSTRAINT "PartnerFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerFavorite" ADD CONSTRAINT "PartnerFavorite_partnerUserId_fkey" FOREIGN KEY ("partnerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerProfile" ADD CONSTRAINT "PartnerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerServicePost" ADD CONSTRAINT "PartnerServicePost_partnerProfileId_fkey" FOREIGN KEY ("partnerProfileId") REFERENCES "PartnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerServicePost" ADD CONSTRAINT "PartnerServicePost_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeShout" ADD CONSTRAINT "HomeShout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeShout" ADD CONSTRAINT "HomeShout_servicePostId_fkey" FOREIGN KEY ("servicePostId") REFERENCES "PartnerServicePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerService" ADD CONSTRAINT "PartnerService_partnerProfileId_fkey" FOREIGN KEY ("partnerProfileId") REFERENCES "PartnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerService" ADD CONSTRAINT "PartnerService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ServiceGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingApplication" ADD CONSTRAINT "BookingApplication_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingApplication" ADD CONSTRAINT "BookingApplication_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTopUpIntent" ADD CONSTRAINT "WalletTopUpIntent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRequirement" ADD CONSTRAINT "BookingRequirement_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingMessage" ADD CONSTRAINT "BookingMessage_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingMessage" ADD CONSTRAINT "BookingMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportThread" ADD CONSTRAINT "SupportThread_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportThread" ADD CONSTRAINT "SupportThread_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "SupportThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_partnerUserId_fkey" FOREIGN KEY ("partnerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_againstUserId_fkey" FOREIGN KEY ("againstUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerReputationPeriod" ADD CONSTRAINT "PartnerReputationPeriod_partnerUserId_fkey" FOREIGN KEY ("partnerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReputationLedgerEntry" ADD CONSTRAINT "ReputationLedgerEntry_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "PartnerReputationPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReputationLedgerEntry" ADD CONSTRAINT "ReputationLedgerEntry_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

