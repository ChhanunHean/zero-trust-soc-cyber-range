import { PrismaClient, TxnType } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

function acct(): string {
  let n = "";
  for (let i = 0; i < 12; i++) n += Math.floor(Math.random() * 10).toString();
  return n;
}
function ref(prefix = "TXN"): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

const MERCHANTS: Record<string, string[]> = {
  Groceries: ["Whole Foods", "Trader Joe's", "Local Market"],
  Dining: ["Starbucks", "Chipotle", "Sushi House"],
  Transport: ["Uber", "Shell Gas", "Metro Transit"],
  Shopping: ["Amazon", "Apple Store", "Nike"],
  Utilities: ["City Power", "AquaWorks", "FiberNet"],
  Entertainment: ["Netflix", "Spotify", "Cinema City"],
  Income: ["ACME Corp Payroll", "Freelance Payout"],
};

async function seedTransactions(accountId: string, startingBalance: number) {
  let balance = startingBalance;
  const categories = Object.keys(MERCHANTS).filter((c) => c !== "Income");
  const txns: {
    accountId: string;
    type: TxnType;
    category: string;
    amount: number;
    balanceAfter: number;
    description: string;
    merchant: string;
    reference: string;
    createdAt: Date;
  }[] = [];

  for (let i = 40; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // Monthly salary credit on/around the 1st
    if (date.getDate() === 1 || (i === 40 && Math.random() > 0.5)) {
      const amount = 4200;
      balance += amount;
      txns.push({
        accountId,
        type: "CREDIT",
        category: "Income",
        amount,
        balanceAfter: balance,
        description: "Salary deposit",
        merchant: MERCHANTS.Income[0],
        reference: ref(),
        createdAt: date,
      });
    }

    // 0-2 spends per day
    const spends = Math.floor(Math.random() * 3);
    for (let s = 0; s < spends; s++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const merchants = MERCHANTS[category];
      const merchant = merchants[Math.floor(Math.random() * merchants.length)];
      const amount = Math.round((5 + Math.random() * 120) * 100) / 100;
      if (balance - amount < 0) continue;
      balance = Math.round((balance - amount) * 100) / 100;
      txns.push({
        accountId,
        type: "DEBIT",
        category,
        amount,
        balanceAfter: balance,
        description: `${category} purchase`,
        merchant,
        reference: ref(),
        createdAt: date,
      });
    }
  }

  await prisma.transaction.createMany({ data: txns });
  return balance;
}

async function main() {
  console.log("🌱 Seeding database...");

  // Clean slate
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.billPayment.deleteMany();
  await prisma.biller.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.beneficiary.deleteMany();
  await prisma.account.deleteMany();
  await prisma.application.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Password123", 12);

  // --- Demo customer ---
  const demo = await prisma.user.create({
    data: {
      email: "demo@bank.com",
      username: "demo",
      passwordHash,
      firstName: "Alex",
      lastName: "Morgan",
      phone: "+1 555 0100",
      role: "CUSTOMER",
      mfaEnabled: false,
    },
  });

  const checking = await prisma.account.create({
    data: {
      userId: demo.id,
      accountNumber: acct(),
      type: "CHECKING",
      name: "Everyday Checking",
      currency: "USD",
      branch: "Downtown Branch",
      balance: 0,
      availableBalance: 0,
    },
  });

  const savings = await prisma.account.create({
    data: {
      userId: demo.id,
      accountNumber: acct(),
      type: "SAVINGS",
      name: "High-Yield Savings",
      currency: "USD",
      branch: "Downtown Branch",
      interestRate: 3.5,
      balance: 0,
      availableBalance: 0,
    },
  });

  const creditCard = await prisma.account.create({
    data: {
      userId: demo.id,
      accountNumber: acct(),
      type: "CREDIT",
      name: "Platinum Rewards Card",
      currency: "USD",
      branch: "Downtown Branch",
      balance: -1240.55,
      availableBalance: 8759.45,
    },
  });

  const checkingBalance = await seedTransactions(checking.id, 2500);
  await prisma.account.update({
    where: { id: checking.id },
    data: { balance: checkingBalance, availableBalance: checkingBalance },
  });

  await prisma.account.update({
    where: { id: savings.id },
    data: { balance: 18250.75, availableBalance: 18250.75 },
  });
  await prisma.transaction.createMany({
    data: [
      {
        accountId: savings.id,
        type: "CREDIT",
        category: "Income",
        amount: 18000,
        balanceAfter: 18000,
        description: "Opening deposit",
        merchant: "Branch Deposit",
        reference: ref(),
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      },
      {
        accountId: savings.id,
        type: "CREDIT",
        category: "Income",
        amount: 250.75,
        balanceAfter: 18250.75,
        description: "Interest payment",
        merchant: "Interest",
        reference: ref(),
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    ],
  });
  void creditCard;

  // Beneficiaries
  await prisma.beneficiary.createMany({
    data: [
      {
        userId: demo.id,
        name: "Jamie Lee",
        nickname: "Jamie",
        bankName: "First National Bank",
        accountNumber: "987654321",
        routingNumber: "021000021",
        type: "DOMESTIC",
      },
      {
        userId: demo.id,
        name: "Global Supplies Ltd",
        nickname: "Supplier",
        bankName: "HSBC UK",
        accountNumber: "GB29NWBK60161331926819",
        iban: "GB29NWBK60161331926819",
        swift: "HBUKGB4B",
        type: "INTERNATIONAL",
      },
    ],
  });

  // Billers
  await prisma.biller.createMany({
    data: [
      { userId: demo.id, name: "City Power & Light", category: "Utilities", accountNumber: "EL-558211", nickname: "Electricity" },
      { userId: demo.id, name: "FiberNet Internet", category: "Telecom", accountNumber: "FN-99213", nickname: "Internet" },
      { userId: demo.id, name: "AquaWorks Water", category: "Utilities", accountNumber: "AW-77310" },
    ],
  });

  // Notifications
  await prisma.notification.createMany({
    data: [
      { userId: demo.id, type: "SECURITY", title: "New device login", message: "A new sign-in was detected from Chrome on macOS." },
      { userId: demo.id, type: "REMINDER", title: "Bill due soon", message: "Your FiberNet Internet bill is due in 3 days." },
      { userId: demo.id, type: "INFO", title: "Welcome to the bank!", message: "Explore your dashboard to get started.", read: true },
    ],
  });

  // Sample application
  await prisma.application.create({
    data: {
      userId: demo.id,
      type: "CREDIT_CARD",
      referenceNumber: ref("APP"),
      status: "UNDER_REVIEW",
      data: { product: "Travel Rewards Card", income: 72000 },
    },
  });

  // --- Admin user ---
  await prisma.user.create({
    data: {
      email: "admin@bank.com",
      username: "admin",
      passwordHash,
      firstName: "Sam",
      lastName: "Rivera",
      role: "ADMIN",
    },
  });

  console.log("✅ Seed complete.");
  console.log("   Customer login: demo@bank.com / Password123");
  console.log("   Admin login:    admin@bank.com / Password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
