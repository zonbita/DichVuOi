-- CreateIndex
CREATE INDEX "Booking_status_confirmDeadlineAt_idx" ON "Booking"("status", "confirmDeadlineAt");

-- CreateIndex
CREATE INDEX "Booking_status_matchingDeadlineAt_idx" ON "Booking"("status", "matchingDeadlineAt");

-- CreateIndex
CREATE INDEX "Booking_status_responseDeadlineAt_idx" ON "Booking"("status", "responseDeadlineAt");

-- CreateIndex
CREATE INDEX "BookingApplication_bookingId_depositStatus_idx" ON "BookingApplication"("bookingId", "depositStatus");

