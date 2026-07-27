export type ComplaintStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';

export type Complaint = {
  id: string;
  bookingId: string;
  category: string;
  description: string;
  status: ComplaintStatus;
  deductionPoints: number | null;
  adminNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  booking: {
    id: string;
    customerName: string;
    status: string;
    service: { name: string; slug: string };
  };
  reporter: { id: string; fullName: string };
  partner: { id: string; fullName: string };
  resolvedBy: { id: string; fullName: string } | null;
};

export const COMPLAINT_CATEGORIES = [
  { value: 'quality', label: 'Chất lượng / không đúng mô tả' },
  { value: 'no_show', label: 'Không đến / trễ hẹn nghiêm trọng' },
  { value: 'conduct', label: 'Thái độ / vi phạm quy tắc sàn' },
  { value: 'payment', label: 'Thanh toán / hoàn tiền' },
  { value: 'other', label: 'Khác' },
] as const;

export const COMPLAINT_DEDUCTION_OPTIONS = [
  { value: 50, label: 'Nhẹ (−50)' },
  { value: 100, label: 'Vừa (−100)' },
  { value: 200, label: 'Nghiêm trọng (−200)' },
] as const;
