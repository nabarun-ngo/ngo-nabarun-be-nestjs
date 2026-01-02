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
    WORKFLOWS: 'workflow',
};

// User Mapping
let userMapping: Map<string, string> = new Map();
let userMappingName: Map<string, string> = new Map();

async function initUserMapping() {
    console.log('Initializing user mapping...');
    const users = await prisma.userProfile.findMany({
        select: { id: true, authUserId: true, firstName: true, lastName: true }
    });
    users.forEach(u => {
        if (u.id) userMapping.set(u.id, u.id);
        if (u.authUserId) userMapping.set(u.authUserId, u.id);
        if (u.id) userMappingName.set(u.id, u.firstName + ' ' + u.lastName);
        if (u.authUserId) userMappingName.set(u.authUserId, u.firstName + ' ' + u.lastName);

    });
    console.log(`Mapped ${userMapping.size} user IDs (including Auth0 IDs)`);
}

const resolveUserId = (id: string | null | undefined): string | null => {
    if (!id) return null;
    return userMapping.get(id) || null;
};

// Helper to get database from MongoDB client
const getDatabase = (client: MongoClient): Db => {
    return process.env.MONGO_DB ? client.db(process.env.MONGO_DB) : client.db();
};

const parseId = (id: any): string => {
    if (typeof id === 'string') return id;
    if (id && typeof id === 'object' && id.$oid) return id.$oid;
    return id?.toString() || '';
};

const parseDate = (date: any): Date | null => {
    if (!date) return null;
    if (date.$date) return new Date(date.$date);
    if (typeof date === 'string') return new Date(date);
    if (date instanceof Date) return date;
    return null;
};

// --- Interfaces ---
interface MongoWorkflowDoc {
    _id: any;
    name?: string;
    requestName?: string;
    type: string;
    status: string;
    description?: string | null;
    requestDescription?: string | null;
    createdOn: any;
    resolvedOn?: any;
    remarks?: string | null;
    profileId?: any;
    requesterUserId?: string;
    createdBy?: string;
    delegated: boolean;
    resolved?: boolean;
    delegateProfileId?: string;
    delegateUserId?: string;
    lastActionCompleted: boolean;
    systemGenerated?: boolean;
    [key: string]: any;
}

// 1. Migrate Workflows to WorkflowInstances
async function migrateWorkflows(db: Db): Promise<{ success: number; failed: number }> {
    console.log('\n=== Migrating Workflows (Instances) ===');
    const collection = db.collection(COLLECTIONS.WORKFLOWS);
    const totalDocs = await collection.countDocuments();
    console.log(`Found ${totalDocs} workflows to migrate`);

    let processed = 0;
    let success = 0;
    let failed = 0;

    const cursor = collection.find({});

    while (await cursor.hasNext()) {
        const batch: MongoWorkflowDoc[] = [];
        for (let i = 0; i < BATCH_SIZE && await cursor.hasNext(); i++) {
            const nextDoc = await cursor.next();
            if (nextDoc) batch.push(nextDoc as MongoWorkflowDoc);
        }

        if (batch.length === 0) break;

        for (const doc of batch) {
            try {
                const workflowId = parseId(doc._id);

                // Resolve involved users
                const initiatedForId = resolveUserId(parseId(doc.profileId)) || resolveUserId(doc.requesterUserId);
                const initiatedById = resolveUserId(doc.delegated ? doc.delegateProfileId : doc.profileId);

                // Prepare 'data' field - store all fields except the mapped ones
                const mappedFields = [
                    'description',
                    'requestDescription', 'remarks', 'requestName', 'ApprovedBy1', 'ApprovedBy2',
                    'rejoinDecision', 'getNotification', 'continueDonation', 'suggession', 'message'
                ];

                const extraData: Record<string, any> = {};
                Object.keys(doc).forEach(key => {
                    if (mappedFields.includes(key)) {
                        if (key.includes('ApprovedBy')) {
                            extraData[key] = `${userMappingName.get(doc[key])} (${userMapping.get(doc[key])})`;
                        } else {
                            extraData[key] = doc[key];
                        }
                    }
                });

                // Fetch additional_fields for this workflow
                const additionalFields = await db.collection('additional_fields').find({ source: workflowId }).toArray();
                additionalFields.forEach(field => {
                    if (field.fieldKey) {
                        extraData[field.fieldKey] = field.fieldValue;
                    }
                });

                // Create WorkflowInstance
                await prisma.workflowInstance.upsert({
                    where: { id: workflowId },
                    update: {
                        data: JSON.stringify(extraData)
                    },
                    create: {
                        id: workflowId,
                        name: doc.name || doc.requestName || 'Legacy Workflow',
                        type: doc.type || 'UNKNOWN',
                        description: doc.requestDescription || doc.description || '',
                        status: doc.status || 'PENDING',
                        initiatedById: initiatedById || null,
                        initiatedForId: initiatedForId || null,
                        completedAt: parseDate(doc.resolvedOn),
                        remarks: doc.remarks || null,
                        delegated: doc.delegated ?? false,
                        data: JSON.stringify(extraData),
                        createdAt: parseDate(doc.createdOn) || new Date(),
                        updatedAt: new Date(),
                    },
                });

                success++;
            } catch (error: any) {
                failed++;
                console.error(`Error migrating workflow ${doc._id}:`, error.message);
            }
            processed++;
        }
        console.log(`Workflow progress: ${processed}/${totalDocs}`);
    }

    return { success, failed };
}

async function main() {
    const mongoClient = new MongoClient(MONGO_URI);
    try {
        await mongoClient.connect();
        const db = getDatabase(mongoClient);

        await initUserMapping();

        const workflowResult = await migrateWorkflows(db);

        console.log('\n=== Migration Results ===');
        console.log(`Workflows: ${workflowResult.success} success, ${workflowResult.failed} failed`);

        // Basic verification
        const pgWorkflowCount = await prisma.workflowInstance.count();

        console.log('\n=== Verification ===');
        console.log(`WorkflowInstances in PG: ${pgWorkflowCount}`);

    } catch (e: any) {
        console.error('Fatal Migration Error:', e.message);
    } finally {
        await mongoClient.close();
        await prisma.$disconnect();
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
