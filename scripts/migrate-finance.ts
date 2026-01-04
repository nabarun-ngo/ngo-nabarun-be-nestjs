import { MongoClient, Db } from 'mongodb';
import { PrismaClient, Prisma } from '@prisma/client';


const prisma = new PrismaClient({
    datasourceUrl: process.env.MIG_POSTGRES_URL,
});

// Configuration
const MONGO_URI = process.env.MIG_MONGODB_URL || 'mongodb://localhost:27017/nabarun_stage';
const BATCH_SIZE = 100;

// Collections
const COLLECTIONS = {
    ACCOUNTS: 'accounts',
    DONATIONS: 'donations', // MongoDB collection name
    TRANSACTIONS: 'transactions',
    EXPENSES: 'expenses',
};

// Helper to get database from MongoDB client
const getDatabase = (client: MongoClient): Db => {
    // If MONGO_DB is explicitly set, use it; otherwise use the database from the connection URI
    return process.env.MONGO_DB ? client.db(process.env.MONGO_DB) : client.db();
};

// User Mapping
let userMapping: Map<string, string> = new Map();
let accountMapping: Set<string> = new Set();

async function initMappings() {
    console.log('Initializing mappings...');

    // User mapping
    const users = await prisma.userProfile.findMany({
        select: { id: true, authUserId: true }
    });
    users.forEach(u => {
        if (u.id) userMapping.set(u.id, u.id);
        if (u.authUserId) userMapping.set(u.authUserId, u.id);
    });
    console.log(`Mapped ${userMapping.size} user IDs (including Auth0 IDs)`);

    // Account mapping (to check existence)
    const accounts = await prisma.account.findMany({
        select: { id: true }
    });
    accounts.forEach(a => accountMapping.add(a.id));
    console.log(`Mapped ${accountMapping.size} accounts`);
}

const resolveUserId = (id: string | null | undefined): string | null => {
    if (!id) return null;
    return userMapping.get(id) || null;
};

const resolveAccountId = (id: string | null | undefined): string | null => {
    if (!id) return null;
    return accountMapping.has(id) ? id : null;
};

// Utility function to parse MongoDB ID
const parseId = (id: any): string => {
    if (typeof id === 'string') return id;
    if (id && typeof id === 'object' && id.$oid) return id.$oid;
    return id?.toString() || '';
};

// Parse MongoDB Date
const parseDate = (date: any): Date | null => {
    if (!date) return null;
    if (date.$date) return new Date(date.$date);
    if (typeof date === 'string') return new Date(date);
    if (date instanceof Date) return date;
    return null;
};

// Parse MongoDB Double
const parseDouble = (value: any): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (value.$numberDouble) {
        const val = value.$numberDouble;
        if (val === 'Infinity') return Number.MAX_VALUE;
        if (val === '-Infinity') return Number.MIN_VALUE;
        if (val === 'NaN') return 0;
        return parseFloat(val);
    }
    return parseFloat(value) || 0;
};

// Map Account Status
const mapAccountStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
        'ACTIVE': 'ACTIVE',
        'INACTIVE': 'INACTIVE',
        'BLOCKED': 'BLOCKED',
    };
    return statusMap[status] || 'ACTIVE';
};

// Map Account Type
const mapAccountType = (type: string): string => {
    const typeMap: Record<string, string> = {
        'PRINCIPAL': 'PRINCIPAL',
        'GENERAL': 'GENERAL',
        'DONATION': 'DONATION',
        'PUBLIC_DONATION': 'PUBLIC_DONATION',
    };
    return typeMap[type] || 'GENERAL';
};

// Map Donation Status
const mapDonationStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
        'RAISED': 'RAISED',
        'PAID': 'PAID',
        'PENDING': 'PENDING',
        'PAYMENT_FAILED': 'PAYMENT_FAILED',
        'PAY_LATER': 'PAY_LATER',
        'CANCELLED': 'CANCELLED',
        'UPDATE_MISTAKE': 'UPDATE_MISTAKE',
    };
    return statusMap[status] || 'RAISED';
};

// Map Donation Type
const mapDonationType = (type: string): string => {
    const typeMap: Record<string, string> = {
        'REGULAR': 'REGULAR',
        'ONETIME': 'ONETIME',
    };
    return typeMap[type] || 'ONETIME';
};

// Map Transaction Status
const mapTransactionStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
        'PENDING': 'PENDING',
        'COMPLETED': 'COMPLETED',
        'FAILED': 'FAILED',
        'REVERSED': 'REVERSED',
        'SUCCESS': 'COMPLETED',
    };
    return statusMap[status] || 'COMPLETED';
};

// Map Transaction Type
const mapTransactionType = (type: string): string => {
    const typeMap: Record<string, string> = {
        'DONATION': 'DONATION',
        'EXPENSE': 'EXPENSE',
        'EARNING': 'EARNING',
        'TRANSFER': 'TRANSFER',
        'IN': 'TRANSFER',
        'OUT': 'TRANSFER',
    };
    return typeMap[type] || 'TRANSFER';
};

// Map Expense Status
const mapExpenseStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
        'PENDING': 'DRAFT',
        'APPROVED': 'APPROVED',
        'PAID': 'PAID',
        'REJECTED': 'REJECTED',
        'SETTLED': 'SETTLED',
    };
    return statusMap[status] || 'DRAFT';
};

// --- Mongo Document Interfaces ---
interface MongoAccountDoc {
    _id: any;
    accountName?: string;
    accountType: string;
    currentBalance?: any;
    accountStatus: string;
    bankAccountHolderName?: string;
    bankName?: string;
    bankBranchName?: string;
    bankAccountNumber?: string;
    bankAccountType?: string;
    bankIFSCNumber?: string;
    upiPayeeName?: string;
    upiId?: string;
    upiMobileNumber?: string;
    profile?: string;
    activatedOn?: any;
    createdOn?: any;
    deleted?: boolean;
    createdById?: string;
}

interface MongoDonationDoc {
    _id: any;
    isGuest?: boolean;
    profile?: string;
    donorName?: string;
    guestFullNameOrOrgName?: string;
    donorEmailAddress?: string;
    guestEmailAddress?: string;
    donorContactNumber?: string;
    guestContactNumber?: string;
    type: string;
    amount: any;
    status: string;
    startDate?: any;
    endDate?: any;
    raisedOn?: any;
    paidOn?: any;
    paymentConfirmedBy?: string;
    paymentConfirmedOn?: any;
    paymentMethod?: string;
    accountId?: string;
    eventId?: string;
    paidUPIName?: string;
    isPaymentNotified?: boolean;
    transactionRefNumber?: string;
    comment?: string;
    cancelReason?: string;
    payLaterReason?: string;
    paymentFailDetail?: string;
    customFields?: any[];
    deleted?: boolean;
}

interface MongoTransactionDoc {
    _id: any;
    transactionType: string;
    status: string;
    transactionAmt: any;
    transactionDescription?: string;
    transactionRefId?: string;
    transactionRef?: string;
    transactionRefType?: string;
    fromAccount?: string;
    toAccount?: string;
    fromAccBalAfterTxn?: any;
    toAccBalAfterTxn?: any;
    transactionDate?: any;
    creationDate?: any;
    createdById?: string;
    revertedTransaction?: boolean;
    [key: string]: any;
}

interface MongoExpenseDoc {
    _id: any;
    expenseTitle?: string;
    expenseItems?: string;
    expenseAmount: any;
    status: string;
    expenseDescription?: string;
    expenseRefId?: string;
    expenseRefType?: string;
    deligated?: boolean;
    createdById?: string;
    paidById?: string;
    finalizedById?: string;
    finalizedOn?: any;
    settledById?: string;
    settledOn?: any;
    rejectedById?: string;
    updatedById?: string;
    updatedOn?: any;
    expenseAccountId?: string;
    expenseAccountName?: string;
    transactionRefNumber?: string;
    expenseDate?: any;
    expenseCreatedOn?: any;
    remarks?: string;
    deleted?: boolean;
}


// Map MongoDB Account to Prisma Account
const mapToAccount = (doc: MongoAccountDoc): Prisma.AccountUncheckedCreateInput => {
    const bankDetail: any = {};
    if (doc.bankAccountHolderName) bankDetail.bankAccountHolderName = doc.bankAccountHolderName;
    if (doc.bankName) bankDetail.bankName = doc.bankName;
    if (doc.bankBranchName) bankDetail.bankBranch = doc.bankBranchName;
    if (doc.bankAccountNumber) bankDetail.bankAccountNumber = doc.bankAccountNumber;
    if (doc.bankAccountType) bankDetail.bankAccountType = doc.bankAccountType;
    if (doc.bankIFSCNumber) bankDetail.IFSCNumber = doc.bankIFSCNumber;

    const upiDetail: any = {};
    if (doc.upiPayeeName) upiDetail.payeeName = doc.upiPayeeName;
    if (doc.upiId) upiDetail.upiId = doc.upiId;
    if (doc.upiMobileNumber) upiDetail.mobileNumber = doc.upiMobileNumber;

    return {
        id: parseId(doc._id),
        name: doc.accountName || 'Unnamed Account',
        type: mapAccountType(doc.accountType),
        balance: new Prisma.Decimal(parseDouble(doc.currentBalance)),
        currency: 'INR',
        status: mapAccountStatus(doc.accountStatus),
        description: null,
        accountHolderName: doc.bankAccountHolderName || null,
        accountHolderId: resolveUserId(doc.profile),
        activatedOn: parseDate(doc.activatedOn),
        bankDetail: Object.keys(bankDetail).length > 0 ? JSON.stringify(bankDetail) : null,
        upiDetail: Object.keys(upiDetail).length > 0 ? JSON.stringify(upiDetail) : null,
        createdAt: parseDate(doc.createdOn) || new Date(),
        updatedAt: new Date(),
        version: 0,
        deletedAt: doc.deleted ? new Date() : null,
        createdById: resolveUserId(doc.createdById),
    };
};

// Map MongoDB Donation to Prisma Donation
const mapToDonation = (doc: MongoDonationDoc): Prisma.DonationUncheckedCreateInput => {
    // Determine donor information
    const donorName = doc.guestFullNameOrOrgName || doc.donorName;
    const donorEmail = doc.guestEmailAddress || doc.donorEmailAddress;
    const donorPhone = doc.guestContactNumber || doc.donorContactNumber;

    return {
        id: parseId(doc._id),
        type: mapDonationType(doc.type),
        amount: new Prisma.Decimal(parseDouble(doc.amount)),
        currency: 'INR',
        status: mapDonationStatus(doc.status),
        donorId: resolveUserId(doc.profile),
        donorName: donorName,
        donorEmail: donorEmail,
        donorPhone: donorPhone,
        isGuest: doc.isGuest,
        startDate: parseDate(doc.startDate),
        endDate: parseDate(doc.endDate),
        raisedOn: parseDate(doc.raisedOn) || new Date(),
        paidOn: parseDate(doc.paidOn),
        confirmedById: doc.paymentConfirmedBy,
        confirmedOn: parseDate(doc.paymentConfirmedOn),
        paymentMethod: doc.paymentMethod || null,
        paidToAccountId: resolveAccountId(doc.accountId),
        forEventId: doc.eventId || null,
        paidUsingUPI: doc.paidUPIName || null,
        transactionRef: doc.transactionRefNumber || null,
        remarks: doc.comment || null,
        cancelletionReason: doc.cancelReason || null,
        laterPaymentReason: doc.payLaterReason || null,
        paymentFailureDetail: doc.paymentFailDetail || null,
        createdAt: parseDate(doc.raisedOn) || new Date(),
        updatedAt: new Date(),
        version: 0,
        deletedAt: doc.deleted ? new Date() : null,
    };
};

// Map MongoDB Transaction to Prisma Transaction
const mapToTransaction = (doc: MongoTransactionDoc): Prisma.TransactionUncheckedCreateInput => {
    return {
        id: parseId(doc._id),
        type: mapTransactionType(doc.transactionType),
        status: mapTransactionStatus(doc.status),
        amount: new Prisma.Decimal(parseDouble(doc.transactionAmt)),
        description: doc.transactionDescription || '',
        referenceId: doc.transactionRefId || doc.transactionRef || null,
        referenceType: doc.transactionRefType || null,
        currency: 'INR',
        fromAccountId: resolveAccountId(doc.fromAccount),
        toAccountId: resolveAccountId(doc.toAccount),
        fromAccountBalance: new Prisma.Decimal(parseDouble(doc.fromAccBalAfterTxn) || 0),
        toAccountBalance: new Prisma.Decimal(parseDouble(doc.toAccBalAfterTxn) || 0),
        transactionDate: parseDate(doc.transactionDate) || new Date(),
        particulars: doc.transactionDescription || '',
        createdAt: parseDate(doc.creationDate) || new Date(),
        createdById: resolveUserId(doc.createdById),
        updatedAt: new Date(),
        version: 0,
        deletedAt: doc.revertedTransaction ? new Date() : null,
    };
};

// Map MongoDB Expense to Prisma Expense
const mapToExpense = (doc: MongoExpenseDoc): Prisma.ExpenseUncheckedCreateInput => {
    return {
        id: parseId(doc._id),
        title: doc.expenseTitle || 'Untitled Expense',
        items: doc.expenseItems || null,
        amount: new Prisma.Decimal(parseDouble(doc.expenseAmount)),
        currency: 'INR',
        status: mapExpenseStatus(doc.status),
        description: doc.expenseDescription || null,
        referenceId: doc.expenseRefId || null,
        referenceType: doc.expenseRefType || null,
        isDelegated: doc.deligated || false, // Note: MongoDB has typo 'deligated'

        // Creator information
        createdById: resolveUserId(doc.createdById) || '',

        // Paid by information
        paidById: resolveUserId(doc.paidById) || '',

        // Finalized by information
        finalizedById: resolveUserId(doc.finalizedById) || null,
        finalizedOn: parseDate(doc.finalizedOn),

        // Settled by information
        settledById: resolveUserId(doc.settledById) || null,
        settledOn: parseDate(doc.settledOn),

        // Rejected by information
        rejectedById: resolveUserId(doc.rejectedById) || null,

        // Updated by information
        updatedById: resolveUserId(doc.updatedById) || null,
        updatedOn: parseDate(doc.updatedOn),

        // Account information
        accountId: doc.expenseAccountId || null,
        accountName: doc.expenseAccountName || null,

        transactionRef: doc.transactionRefNumber || null,
        submittedById: resolveUserId(doc.createdById) || '',
        rejectedOn: parseDate(doc.updatedOn),


        // Dates
        expenseDate: parseDate(doc.expenseDate) || new Date(),
        remarks: doc.remarks || null,

        createdAt: parseDate(doc.expenseCreatedOn) || new Date(),
        updatedAt: new Date(),
        version: 0,
        deletedAt: doc.deleted ? new Date() : null,
    };
};

// Migrate Accounts
async function migrateAccounts(db: Db): Promise<{ success: number; failed: number; errors: any[] }> {
    console.log('\n=== Migrating Accounts ===');
    const collection = db.collection(COLLECTIONS.ACCOUNTS);

    const totalDocs = await collection.countDocuments();
    console.log(`Found ${totalDocs} accounts to migrate`);

    let processed = 0;
    let success = 0;
    let failed = 0;
    const errors: any[] = [];

    const cursor = collection.find({});

    while (await cursor.hasNext()) {
        const batch: MongoAccountDoc[] = [];

        for (let i = 0; i < BATCH_SIZE && await cursor.hasNext(); i++) {
            const nextDoc = await cursor.next();
            if (nextDoc) {
                batch.push(nextDoc as MongoAccountDoc);
            }
        }

        if (batch.length === 0) break;

        try {
            // Map all documents in the batch
            const accountsData = batch.map(doc => mapToAccount(doc));

            // Bulk insert with skipDuplicates
            const result = await prisma.account.createMany({
                data: accountsData, // Cast to any to avoid strict relations check in createMany
                skipDuplicates: true,
            });

            // Update account mapping for successful insertions
            accountsData.forEach(a => {
                if (a.id) accountMapping.add(a.id);
            });

            success += result.count;
            processed += batch.length;

            console.log(`Progress: ${processed}/${totalDocs} (${success} inserted, ${processed - success} skipped/failed)`);
        } catch (error: any) {
            // If bulk insert fails, fall back to individual inserts for this batch
            console.warn(`Bulk insert failed for batch, trying individual inserts: ${error.message}`);

            for (const doc of batch) {
                try {
                    const accountData = mapToAccount(doc);
                    await prisma.account.create({
                        data: accountData,
                    });
                    if (accountData.id) accountMapping.add(accountData.id);
                    success++;
                } catch (individualError: any) {
                    failed++;
                    errors.push({
                        id: parseId(doc._id),
                        name: doc.accountName,
                        error: individualError.message,
                    });
                    console.error(`Error migrating account ${doc.accountName}:`, individualError.message);
                }
                processed++;
            }
        }
    }

    console.log(`\nAccounts Migration Complete: ${success} success, ${failed} failed`);
    return { success, failed, errors };
}

// Migrate Donations
async function migrateDonations(db: Db): Promise<{ success: number; failed: number; errors: any[] }> {
    console.log('\n=== Migrating Donations ===');
    const collection = db.collection(COLLECTIONS.DONATIONS);

    const totalDocs = await collection.countDocuments();
    console.log(`Found ${totalDocs} donations to migrate`);

    let processed = 0;
    let success = 0;
    let failed = 0;
    const errors: any[] = [];

    const cursor = collection.find({});

    while (await cursor.hasNext()) {
        const batch: MongoDonationDoc[] = [];

        for (let i = 0; i < BATCH_SIZE && await cursor.hasNext(); i++) {
            const nextDoc = await cursor.next();
            if (nextDoc) {
                batch.push(nextDoc as MongoDonationDoc);
            }
        }

        if (batch.length === 0) break;

        try {
            const donationsData = batch.map(doc => mapToDonation(doc));

            // Bulk insert with skipDuplicates
            const result = await prisma.donation.createMany({
                data: donationsData,
                skipDuplicates: true,
            });

            success += result.count;
            processed += batch.length;

            console.log(`Progress: ${processed}/${totalDocs} (${success} inserted, ${processed - success} skipped/failed)`);
        } catch (error: any) {
            // If bulk insert fails, fall back to individual inserts for this batch
            console.warn(`Bulk insert failed for batch, trying individual inserts: ${error.message}`);

            for (const doc of batch) {
                try {
                    const donationData = mapToDonation(doc);
                    await prisma.donation.create({
                        data: donationData,
                    });
                    success++;
                } catch (individualError: any) {
                    failed++;
                    errors.push({
                        id: parseId(doc._id),
                        donor: doc.donorName || doc.guestFullNameOrOrgName,
                        error: individualError.message,
                    });
                    console.error(`Error migrating donation ${doc.donorName}:`, individualError.message);
                }
                processed++;
            }
        }
    }

    console.log(`\nDonations Migration Complete: ${success} success, ${failed} failed`);
    return { success, failed, errors };
}

// Migrate Transactions
async function migrateTransactions(db: Db): Promise<{ success: number; failed: number; errors: any[] }> {
    console.log('\n=== Migrating Transactions ===');
    const collection = db.collection(COLLECTIONS.TRANSACTIONS);

    const totalDocs = await collection.countDocuments();
    console.log(`Found ${totalDocs} transactions to migrate`);

    let processed = 0;
    let success = 0;
    let failed = 0;
    const errors: any[] = [];

    const cursor = collection.find({});

    while (await cursor.hasNext()) {
        const batch: MongoTransactionDoc[] = [];

        for (let i = 0; i < BATCH_SIZE && await cursor.hasNext(); i++) {
            const nextDoc = await cursor.next();
            if (nextDoc) {
                batch.push(nextDoc as MongoTransactionDoc);
            }
        }

        if (batch.length === 0) break;

        try {
            const transactionsData = batch.map(doc => mapToTransaction(doc));

            // Filter out transactions with no accounts
            const validTransactions = transactionsData.filter(t =>
                t.fromAccountId !== null || t.toAccountId !== null
            );

            if (validTransactions.length === 0) {
                processed += batch.length;
                console.log(`Skipped ${batch.length} transactions with no valid accounts`);
                continue;
            }

            // Batch validate account references
            const accountIds = [...new Set([
                ...validTransactions.filter(t => t.fromAccountId).map(t => t.fromAccountId as string),
                ...validTransactions.filter(t => t.toAccountId).map(t => t.toAccountId as string)
            ])];

            const existingAccounts = accountIds.length > 0
                ? new Set((await prisma.account.findMany({ where: { id: { in: accountIds } }, select: { id: true } })).map(a => a.id))
                : new Set();

            // Filter transactions with valid account references
            const transactionsToInsert = validTransactions.filter(t => {
                const fromValid = t.fromAccountId === null || existingAccounts.has(t.fromAccountId);
                const toValid = t.toAccountId === null || existingAccounts.has(t.toAccountId);
                return fromValid && toValid;
            });

            if (transactionsToInsert.length === 0) {
                processed += batch.length;
                console.log(`Skipped ${batch.length} transactions with invalid account references`);
                continue;
            }

            // Bulk insert with skipDuplicates
            const result = await prisma.transaction.createMany({
                data: transactionsToInsert,
                skipDuplicates: true,
            });

            success += result.count;
            processed += batch.length;

            console.log(`Progress: ${processed}/${totalDocs} (${success} inserted, ${processed - success} skipped/failed)`);
        } catch (error: any) {
            // If bulk insert fails, fall back to individual inserts for this batch
            console.warn(`Bulk insert failed for batch, trying individual inserts: ${error.message}`);

            for (const doc of batch) {
                try {
                    const transactionData = mapToTransaction(doc);

                    // Check undefined because mapToTransaction returns connect objects
                    if (!transactionData.fromAccountId && !transactionData.toAccountId) {
                        console.log(`Skipping transaction with unknown from and to accounts: ${parseId(doc._id)}`);
                        processed++;
                        continue;
                    }

                    await prisma.transaction.create({
                        data: transactionData,
                    });
                    success++;
                } catch (individualError: any) {
                    failed++;
                    errors.push({
                        id: parseId(doc._id),
                        description: doc.transactionDescription,
                        error: individualError.message,
                    });
                    console.error(`Error migrating transaction ${doc.transactionDescription}:`, individualError.message);
                }
                processed++;
            }
        }
    }

    console.log(`\nTransactions Migration Complete: ${success} success, ${failed} failed`);
    return { success, failed, errors };
}

// Migrate Expenses
async function migrateExpenses(db: Db): Promise<{ success: number; failed: number; errors: any[] }> {
    console.log('\n=== Migrating Expenses ===');
    const collection = db.collection(COLLECTIONS.EXPENSES);

    const totalDocs = await collection.countDocuments();
    console.log(`Found ${totalDocs} expenses to migrate`);

    let processed = 0;
    let success = 0;
    let failed = 0;
    const errors: any[] = [];

    const cursor = collection.find({});

    while (await cursor.hasNext()) {
        const batch: MongoExpenseDoc[] = [];

        for (let i = 0; i < BATCH_SIZE && await cursor.hasNext(); i++) {
            const nextDoc = await cursor.next();
            if (nextDoc) {
                batch.push(nextDoc as MongoExpenseDoc);
            }
        }

        if (batch.length === 0) break;

        try {
            // Map to Scalars for Bulk Insert
            const expensesData = batch.map(doc => mapToExpense(doc));

            // Batch validate account references
            const accountIds = [...new Set(expensesData.filter(e => e.accountId).map(e => e.accountId as string))];

            const existingAccounts = accountIds.length > 0
                ? new Set((await prisma.account.findMany({ where: { id: { in: accountIds } }, select: { id: true } })).map(a => a.id))
                : new Set();

            // Clean up invalid account references
            expensesData.forEach(expense => {
                if (expense.accountId && !existingAccounts.has(expense.accountId)) {
                    expense.accountId = null;
                    expense.accountName = null;
                }
            });

            // Bulk insert with skipDuplicates
            const result = await prisma.expense.createMany({
                data: expensesData,
                skipDuplicates: true,
            });

            success += result.count;
            processed += batch.length;

            console.log(`Progress: ${processed}/${totalDocs} (${success} inserted, ${processed - success} skipped/failed)`);
        } catch (error: any) {
            // If bulk insert fails, fall back to individual inserts for this batch
            console.warn(`Bulk insert failed for batch, trying individual inserts: ${error.message}`);

            for (const doc of batch) {
                try {
                    const expenseData = mapToExpense(doc);

                    await prisma.expense.create({
                        data: expenseData,
                    });
                    success++;
                } catch (individualError: any) {
                    failed++;
                    errors.push({
                        id: parseId(doc._id),
                        title: doc.expenseTitle,
                        error: individualError.message,
                    });
                    console.error(`Error migrating expense ${doc.expenseTitle}:`, individualError.message);
                }
                processed++;
            }
        }
    }

    console.log(`\nExpenses Migration Complete: ${success} success, ${failed} failed`);
    return { success, failed, errors };
}

interface MigrationResult {
    success: number;
    failed: number;
    errors: any[];
}

// Main migration function
export async function migrateFinance() {
    const mongoClient = new MongoClient(MONGO_URI);

    try {
        console.log('Connecting to MongoDB...');
        await mongoClient.connect();
        console.log('Connected to MongoDB successfully');

        const db = getDatabase(mongoClient);

        await initMappings();



        const results: Record<string, MigrationResult> = {
            accounts: { success: 0, failed: 0, errors: [] },
            donations: { success: 0, failed: 0, errors: [] },
            transactions: { success: 0, failed: 0, errors: [] },
            expenses: { success: 0, failed: 0, errors: [] },
        };

        // Migrate in order: Accounts -> Donations -> Transactions -> Expenses
        results.accounts = await migrateAccounts(db);
        results.donations = await migrateDonations(db);
        results.transactions = await migrateTransactions(db);
        results.expenses = await migrateExpenses(db);

        console.log('\n=== Overall Migration Summary ===');
        console.log(`Accounts: ${results.accounts.success} success, ${results.accounts.failed} failed`);
        console.log(`Donations: ${results.donations.success} success, ${results.donations.failed} failed`);
        console.log(`Transactions: ${results.transactions.success} success, ${results.transactions.failed} failed`);
        console.log(`Expenses: ${results.expenses.success} success, ${results.expenses.failed} failed`);

        if (results.accounts.errors.length > 0) {
            console.log('\nAccount Errors:');
            results.accounts.errors.forEach((e: any) => {
                console.log(`  - ${e.name} (${e.id}): ${e.error}`);
            });
        }
        // ... (similar error logging for other entities, keeping it simple to fit)

    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    } finally {
        await mongoClient.close();
        await prisma.$disconnect();
    }
}

// Verification function
export async function verifyMigration() {
    const mongoClient = new MongoClient(MONGO_URI);

    try {
        console.log('\n=== Verifying Migration ===');
        await mongoClient.connect();
        const db = getDatabase(mongoClient);

        // Verify Accounts
        const mongoAccountsCount = await db.collection(COLLECTIONS.ACCOUNTS).countDocuments();
        const pgAccountsCount = await prisma.account.count();
        console.log(`\nAccounts:`);
        console.log(`  MongoDB: ${mongoAccountsCount}`);
        console.log(`  PostgreSQL: ${pgAccountsCount}`);
        console.log(`  Match: ${mongoAccountsCount === pgAccountsCount ? '✓' : '✗'}`);

        // Verify Donations
        const mongoDonationsCount = await db.collection(COLLECTIONS.DONATIONS).countDocuments();
        const pgDonationsCount = await prisma.donation.count();
        console.log(`\nDonations:`);
        console.log(`  MongoDB: ${mongoDonationsCount}`);
        console.log(`  PostgreSQL: ${pgDonationsCount}`);
        console.log(`  Match: ${mongoDonationsCount === pgDonationsCount ? '✓' : '✗'}`);

        // Verify Transactions
        const mongoTransactionsCount = await db.collection(COLLECTIONS.TRANSACTIONS).countDocuments();
        const pgTransactionsCount = await prisma.transaction.count();
        console.log(`\nTransactions:`);
        console.log(`  MongoDB: ${mongoTransactionsCount}`);
        console.log(`  PostgreSQL: ${pgTransactionsCount}`);
        console.log(`  Match: ${mongoTransactionsCount === pgTransactionsCount ? '✓' : '✗'}`);

        // Verify Expenses
        const mongoExpensesCount = await db.collection(COLLECTIONS.EXPENSES).countDocuments();
        const pgExpensesCount = await prisma.expense.count();
        console.log(`\nExpenses:`);
        console.log(`  MongoDB: ${mongoExpensesCount}`);
        console.log(`  PostgreSQL: ${pgExpensesCount}`);
        console.log(`  Match: ${mongoExpensesCount === pgExpensesCount ? '✓' : '✗'}`);

    } finally {
        await mongoClient.close();
        await prisma.$disconnect();
    }
}

async function main() {
    const args = process.argv.slice(2);
    const verify = args.includes('--verify');

    if (verify) {
        await verifyMigration();
    } else {
        await migrateFinance();
        console.log('\nRunning verification...');
        await verifyMigration();
    }
}

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });