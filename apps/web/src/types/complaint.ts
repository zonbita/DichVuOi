export type ComplaintStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';

export type ComplaintResolutionAction =
  | 'REFUND'
  | 'RELEASE'
  | 'RETRY_IN_PROGRESS'
  | 'RETRY_AWAITING'
  | 'NONE';

export type Complaint = {
  id: string;
  bookingId: string;
  category: string;
  description: string;
  status: ComplaintStatus;
  deductionPoints: number | null;
  adminNote: string | null;
  resolutionAction: ComplaintResolutionAction | null;
  requirementIds: string[];
  evidenceNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  booking: {
    id: string;
    customerName: string;
    status: string;
    paymentStatus?: string;
    service: { name: string; slug: string };
    requirements?: Array<{
      id: string;
      content: string;
      partnerDone: boolean;
      customerConfirmed: boolean;
    }>;
  };
  reporter: { id: string; fullName: string };
  partner: { id: string; fullName: string };
  against: { id: string; fullName: string } | null;
  resolvedBy: { id: string; fullName: string } | null;
};

export const COMPLAINT_CATEGORIES_CUSTOMER = [
  { value: 'quality', label: 'Việc chưa đúng checklist / thiếu mục' },
  { value: 'conduct', label: 'Thái độ / đúng giờ / chất lượng' },
  { value: 'payment', label: 'Thanh toán / hoàn tiền' },
  { value: 'other', label: 'Khác' },
] as const;

export const COMPLAINT_CATEGORIES_PARTNER = [
  { value: 'no_confirm', label: 'Khách không xác nhận dù đã làm đủ' },
  { value: 'scope_creep', label: 'Khách đòi thêm việc ngoài checklist' },
  { value: 'conduct', label: 'Khách hủy / thiếu hợp tác / xúc phạm' },
  { value: 'scope', label: 'Tranh chấp phạm vi đã thỏa thuận' },
  { value: 'other', label: 'Khác' },
] as const;

/** Legacy + gộp cho admin filter. */
export const COMPLAINT_CATEGORIES = [
  ...COMPLAINT_CATEGORIES_CUSTOMER,
  { value: 'no_show', label: 'Không đến / trễ hẹn nghiêm trọng' },
  { value: 'no_confirm', label: 'Khách không xác nhận dù đã làm đủ' },
  { value: 'scope_creep', label: 'Khách đòi thêm việc ngoài checklist' },
  { value: 'scope', label: 'Tranh chấp phạm vi đã thỏa thuận' },
] as const;

export const COMPLAINT_DEDUCTION_OPTIONS = [
  { value: 50, label: 'Nhẹ (−50)' },
  { value: 100, label: 'Vừa (−100)' },
  { value: 200, label: 'Nghiêm trọng (−200)' },
] as const;

export const RESOLUTION_ACTION_LABELS: Record<ComplaintResolutionAction, string> = {
  REFUND: 'Chấp nhận khách, hoàn cọc',
  RELEASE: 'Giải ngân + hoàn thành',
  RETRY_IN_PROGRESS: 'Làm lại, đang làm',
  RETRY_AWAITING: 'Quay lại chờ xác nhận',
  NONE: 'Chỉ ghi nhận',
};
