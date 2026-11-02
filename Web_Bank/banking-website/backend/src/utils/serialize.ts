import { Prisma } from "@prisma/client";
import { maskAccountNumber } from "./helpers";

type Decimalish = Prisma.Decimal | number | string | null | undefined;

export function toNumber(value: Decimalish): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "object" ? Number(value.toString()) : Number(value);
}

/* eslint-disable @typescript-eslint/no-explicit-any */

export function serializeAccount(account: any, mask = false) {
  return {
    id: account.id,
    accountNumber: mask ? maskAccountNumber(account.accountNumber) : account.accountNumber,
    maskedNumber: maskAccountNumber(account.accountNumber),
    type: account.type,
    name: account.name,
    balance: toNumber(account.balance),
    availableBalance: toNumber(account.availableBalance),
    currency: account.currency,
    status: account.status,
    interestRate: toNumber(account.interestRate),
    branch: account.branch,
    openedAt: account.openedAt,
  };
}

export function serializeTransaction(txn: any) {
  return {
    id: txn.id,
    accountId: txn.accountId,
    type: txn.type,
    category: txn.category,
    amount: toNumber(txn.amount),
    balanceAfter: toNumber(txn.balanceAfter),
    description: txn.description,
    merchant: txn.merchant,
    reference: txn.reference,
    status: txn.status,
    createdAt: txn.createdAt,
  };
}

export function serializeTransfer(transfer: any) {
  return {
    id: transfer.id,
    type: transfer.type,
    amount: toNumber(transfer.amount),
    fee: toNumber(transfer.fee),
    currency: transfer.currency,
    status: transfer.status,
    note: transfer.note,
    reference: transfer.reference,
    scheduledAt: transfer.scheduledAt,
    recurring: transfer.recurring,
    fromAccountId: transfer.fromAccountId,
    toAccountId: transfer.toAccountId,
    beneficiaryId: transfer.beneficiaryId,
    createdAt: transfer.createdAt,
  };
}
