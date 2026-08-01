export type SupportThreadStatus = 'OPEN' | 'CLOSED';

export type SupportSender = {
  id: string;
  fullName: string;
  role: string;
};

export type SupportMessage = {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  redacted: boolean;
  createdAt: string;
  sender: SupportSender;
};

export type SupportThread = {
  id: string;
  customerId: string;
  assigneeId: string | null;
  status: SupportThreadStatus;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
  };
  assignee: SupportSender | null;
  lastPreview: {
    body: string;
    createdAt: string;
    senderName: string;
    senderRole: string;
  } | null;
  messageCount?: number;
};

export type SupportThreadDetail = {
  thread: SupportThread;
  messages: SupportMessage[];
};
