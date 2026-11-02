export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: "CUSTOMER" | "ADMIN";
  mfaEnabled: boolean;
}

export type AccountType = "SAVINGS" | "CHECKING" | "CREDIT" | "LOAN" | "INVESTMENT";

export interface Account {
  id: string;
  accountNumber: string;
  maskedNumber: string;
  type: AccountType;
  name: string;
  balance: number;
  availableBalance: number;
  currency: string;
  status: string;
  interestRate: number;
  branch: string | null;
  openedAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  type: "DEBIT" | "CREDIT";
  category: string;
  amount: number;
  balanceAfter: number;
  description: string;
  merchant: string | null;
  reference: string;
  status: string;
  createdAt: string;
}

export interface Beneficiary {
  id: string;
  name: string;
  nickname?: string | null;
  bankName: string;
  accountNumber: string;
  routingNumber?: string | null;
  iban?: string | null;
  swift?: string | null;
  type: "DOMESTIC" | "INTERNATIONAL";
  createdAt: string;
}

export interface Biller {
  id: string;
  name: string;
  category: string;
  accountNumber: string;
  nickname?: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: "INFO" | "SECURITY" | "TRANSACTION" | "REMINDER";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Transfer {
  id: string;
  type: "INTERNAL" | "DOMESTIC" | "INTERNATIONAL";
  amount: number;
  fee: number;
  currency: string;
  status: string;
  note?: string | null;
  reference: string;
  scheduledAt?: string | null;
  recurring: boolean;
  createdAt: string;
}
