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
    DOCUMENT_REFERENCES: 'document_references',
    DOCUMENT_MAPPINGS: 'document_mappings',
};

// Helper to get database from MongoDB client
const getDatabase = (client: MongoClient): Db => {
    return process.env.MONGO_DB ? client.db(process.env.MONGO_DB) : client.db();
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

// Extract token from Firebase URL
const extractToken = (url: string | null): string => {
    if (!url) return '';
    const match = url.match(/[&?]token=([^&]+)/);
    return match ? match[1] : '';
};

// --- Mongo Document Interfaces ---
interface MongoDocumentRefDoc {
    _id: any;
    fileType: string;
    downloadUrl: string;
    originalFileName: string;
    remoteFileName: string;
    attachementIdentifier: string;
    deleted: boolean;
    createdOn: any;
    [key: string]: any;
}

interface MongoDocumentMappingDoc {
    _id: any;
    documentId: string;
    createdOn: any;
    documentType: string;
    documentRefId: string;
    [key: string]: any;
}

// Map MongoDB Document Reference to Prisma DocumentReference
const mapToDocumentReference = (doc: MongoDocumentRefDoc): Prisma.DocumentReferenceUncheckedCreateInput => {
    return {
        id: parseId(doc._id),
        fileName: doc.originalFileName || 'unknown',
        remotePath: doc.remoteFileName || '',
        publicToken: extractToken(doc.downloadUrl),
        contentType: doc.fileType || 'application/octet-stream',
        fileSize: 0, // Not available in MongoDB
        isPublic: false, // Default to false
        createdAt: parseDate(doc.createdOn) || new Date(),
        uploadedById: null, // Not available
    };
};

// Map MongoDB Document Mapping to Prisma DocumentMapping
const mapToDocumentMapping = (doc: MongoDocumentMappingDoc): Prisma.DocumentMappingUncheckedCreateInput => {
    return {
        id: parseId(doc._id),
        documentReferenceId: doc.documentId,
        entityType: doc.documentType,
        entityId: doc.documentRefId,
        createdAt: parseDate(doc.createdOn) || new Date(),
    };
};

// Migrate Document References
async function migrateDocumentReferences(db: Db): Promise<{ success: number; failed: number; errors: any[] }> {
    console.log('\n=== Migrating Document References ===');
    const collection = db.collection(COLLECTIONS.DOCUMENT_REFERENCES);

    const totalDocs = await collection.countDocuments();
    console.log(`Found ${totalDocs} document references to migrate`);

    let processed = 0;
    let success = 0;
    let failed = 0;
    const errors: any[] = [];

    const cursor = collection.find({});

    while (await cursor.hasNext()) {
        const batch: MongoDocumentRefDoc[] = [];

        for (let i = 0; i < BATCH_SIZE && await cursor.hasNext(); i++) {
            const nextDoc = await cursor.next();
            if (nextDoc) {
                batch.push(nextDoc as unknown as MongoDocumentRefDoc);
            }
        }

        if (batch.length === 0) break;

        try {
            const documentReferencesData = batch.map(doc => mapToDocumentReference(doc));

            const result = await prisma.documentReference.createMany({
                data: documentReferencesData,
                skipDuplicates: true,
            });

            success += result.count;
            processed += batch.length;

            console.log(`Progress: ${processed}/${totalDocs} (${success} inserted, ${processed - success} skipped/failed)`);
        } catch (error: any) {
            console.warn(`Bulk insert failed for batch, trying individual inserts: ${error.message}`);
            for (const doc of batch) {
                try {
                    await prisma.documentReference.upsert({
                        where: { id: mapToDocumentReference(doc).id },
                        update: mapToDocumentReference(doc),
                        create: mapToDocumentReference(doc),
                    });
                    success++;
                } catch (individualError: any) {
                    failed++;
                    errors.push({
                        id: parseId(doc._id),
                        error: individualError.message,
                    });
                }
                processed++;
            }
        }
    }

    console.log(`\nDocument References Migration Complete: ${success} success, ${failed} failed`);
    return { success, failed, errors };
}

// Migrate Document Mappings
async function migrateDocumentMappings(db: Db): Promise<{ success: number; failed: number; errors: any[] }> {
    console.log('\n=== Migrating Document Mappings ===');
    const collection = db.collection(COLLECTIONS.DOCUMENT_MAPPINGS);

    const totalDocs = await collection.countDocuments();
    console.log(`Found ${totalDocs} document mappings to migrate`);

    let processed = 0;
    let success = 0;
    let failed = 0;
    const errors: any[] = [];

    const cursor = collection.find({});

    while (await cursor.hasNext()) {
        const batch: MongoDocumentMappingDoc[] = [];

        for (let i = 0; i < BATCH_SIZE && await cursor.hasNext(); i++) {
            const nextDoc = await cursor.next();
            if (nextDoc) {
                batch.push(nextDoc as unknown as MongoDocumentMappingDoc);
            }
        }

        if (batch.length === 0) break;

        try {
            const rawMappings = batch.map(doc => mapToDocumentMapping(doc));

            // Validate document reference existence
            const docRefIds = [...new Set(rawMappings.map(m => m.documentReferenceId))];
            const existingDocRefs = new Set(
                (await prisma.documentReference.findMany({
                    where: { id: { in: docRefIds } },
                    select: { id: true }
                })).map(dr => dr.id)
            );

            const validMappings = rawMappings.filter(m => existingDocRefs.has(m.documentReferenceId));

            const result = await prisma.documentMapping.createMany({
                data: validMappings,
                skipDuplicates: true,
            });

            success += result.count;
            processed += batch.length;

            console.log(`Progress: ${processed}/${totalDocs} (${success} inserted, ${processed - success} skipped/failed)`);
        } catch (error: any) {
            console.warn(`Bulk insert failed for batch, trying individual inserts: ${error.message}`);
            for (const doc of batch) {
                try {
                    const mapping = mapToDocumentMapping(doc);
                    const docRefExists = await prisma.documentReference.findUnique({ where: { id: mapping.documentReferenceId } });
                    if (docRefExists) {
                        await prisma.documentMapping.upsert({
                            where: { id: mapping.id },
                            update: mapping,
                            create: mapping,
                        });
                        success++;
                    } else {
                        console.warn(`Skipping mapping ${mapping.id} due to missing document reference ${mapping.documentReferenceId}`);
                    }
                } catch (individualError: any) {
                    failed++;
                    errors.push({
                        id: parseId(doc._id),
                        error: individualError.message,
                    });
                }
                processed++;
            }
        }
    }

    console.log(`\nDocument Mappings Migration Complete: ${success} success, ${failed} failed`);
    return { success, failed, errors };
}

async function main() {
    const mongoClient = new MongoClient(MONGO_URI);
    try {
        await mongoClient.connect();
        const db = getDatabase(mongoClient);

        await migrateDocumentReferences(db);
        await migrateDocumentMappings(db);

        // Verification logic
        console.log('\n=== Verifying Migration ===');
        const mongoRefsCount = await db.collection(COLLECTIONS.DOCUMENT_REFERENCES).countDocuments();
        const pgRefsCount = await prisma.documentReference.count();
        console.log(`Document References: MongoDB: ${mongoRefsCount}, PostgreSQL: ${pgRefsCount} (${mongoRefsCount === pgRefsCount ? '✓' : '✗'})`);

        const mongoMappingsCount = await db.collection(COLLECTIONS.DOCUMENT_MAPPINGS).countDocuments();
        const pgMappingsCount = await prisma.documentMapping.count();
        console.log(`Document Mappings: MongoDB: ${mongoMappingsCount}, PostgreSQL: ${pgMappingsCount} (${mongoMappingsCount === pgMappingsCount ? '✓' : '✗'})`);

    } finally {
        await mongoClient.close();
        await prisma.$disconnect();
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
