import { MongoClient, Db, ObjectId } from 'mongodb';
import { PrismaClient, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient({
    datasourceUrl: process.env.MIG_POSTGRES_URL,
});

// Configuration
const MONGO_URI = process.env.MIG_MONGODB_URL || 'mongodb://localhost:27017/nabarun_stage';
const MONGO_COLLECTION = 'user_profiles';
const BATCH_SIZE = 100;

// Helper to get database from MongoDB client
const getDatabase = (client: MongoClient): Db => {
    // If MONGO_DB is explicitly set, use it; otherwise use the database from the connection URI
    return process.env.MONGO_DB ? client.db(process.env.MONGO_DB) : client.db();
};

// Utility function to parse MongoDB ID
const parseId = (id: any): string => {
    if (typeof id === 'string') return id;
    if (id && typeof id === 'object' && id.$oid) return id.$oid;
    return id?.toString() || uuidv4();
};

// Interface for MongoDB User Document
interface MongoUserDoc {
    _id: any;
    title?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    dateOfBirth?: string | Date;
    gender?: string;
    about?: string;
    avatarUrl?: string;
    email: string;
    publicProfile?: boolean;
    userId?: string;
    status?: string;
    presentPermanentSame?: boolean;
    loginMethods?: string;
    donationPauseStartDate?: string | Date;
    donationPauseEndDate?: string | Date;
    createdOn?: string | Date;
    deleted?: boolean;
    roleCodes?: string | string[];
    roleNames?: string | string[];
    createdBy?: string;
    phoneNumber?: string;
    contactNumber?: string;
    dialCode?: string;
    altPhoneNumber?: string;
    addressLine1?: string;
    addressLine2?: string;
    addressLine3?: string;
    hometown?: string;
    state?: string;
    district?: string;
    country?: string;
    permanentAddressLine1?: string;
    permanentAddressLine2?: string;
    permanentAddressLine3?: string;
    permanentHometown?: string;
    permanentState?: string;
    permanentDistrict?: string;
    permanentCountry?: string;
    facebookLink?: string;
    instagramLink?: string;
    linkedInLink?: string;
    twitterLink?: string;
    whatsappLink?: string;
    [key: string]: any;
}

// Map MongoDB document to UserProfile
const mapToUserProfile = (doc: MongoUserDoc): Prisma.UserProfileCreateInput => {
    return {
        id: parseId(doc._id),
        title: doc.title || null,
        firstName: doc.firstName || '',
        middleName: doc.middleName || null,
        lastName: doc.lastName || '',
        dateOfBirth: doc.dateOfBirth ? new Date(doc.dateOfBirth) : null,
        gender: doc.gender || null,
        about: doc.about || null,
        picture: doc.avatarUrl || null,
        email: doc.email,
        isPublic: doc.publicProfile ?? null,
        authUserId: doc.userId || null,
        status: doc.status || 'ACTIVE',
        isTemporary: false,
        isSameAddress: doc.presentPermanentSame ?? null,
        loginMethods: doc.loginMethods || null,
        panNumber: null,
        aadharNumber: null,
        donationPauseStart: doc.donationPauseStartDate ? new Date(doc.donationPauseStartDate) : null,
        donationPauseEnd: doc.donationPauseEndDate ? new Date(doc.donationPauseEndDate) : null,
        createdAt: doc.createdOn ? new Date(doc.createdOn) : new Date(),
        updatedAt: new Date(),
        version: 0,
        deletedAt: doc.deleted ? new Date() : null,
    };
};

// Map roles from MongoDB to PostgreSQL
const mapToRoles = (doc: MongoUserDoc, userId: string): Prisma.UserRoleCreateManyInput[] => {
    const roles: Prisma.UserRoleCreateManyInput[] = [];

    // Handle roleCodes and roleNames (could be string or array)
    const roleCodes = typeof doc.roleCodes === 'string'
        ? doc.roleCodes.split(',').map(r => r.trim())
        : Array.isArray(doc.roleCodes) ? doc.roleCodes : [];

    const roleNames = typeof doc.roleNames === 'string'
        ? doc.roleNames.split(',').map(r => r.trim())
        : Array.isArray(doc.roleNames) ? doc.roleNames : [];

    roleCodes.forEach((code, index) => {
        if (code) {
            roles.push({
                id: uuidv4(),
                roleCode: code,
                roleName: roleNames[index] || code,
                authRoleCode: code,
                isDefault: index === 0,
                userId: userId,
                createdAt: doc.createdOn ? new Date(doc.createdOn) : new Date(),
                createdBy: doc.createdBy || null,
                version: 0,
            });
        }
    });

    return roles;
};

// Map phone numbers
const mapToPhoneNumbers = (doc: MongoUserDoc, userId: string): Prisma.PhoneNumberCreateManyInput[] => {
    const phones: Prisma.PhoneNumberCreateManyInput[] = [];

    if (doc.phoneNumber || doc.contactNumber) {
        phones.push({
            id: uuidv4(),
            phoneCode: doc.dialCode || null,
            phoneNumber: doc.phoneNumber || doc.contactNumber || null,
            hidden: false,
            primary: true,
            userId: userId,
            version: 0,
        });
    }

    if (doc.altPhoneNumber && doc.altPhoneNumber !== doc.phoneNumber) {
        phones.push({
            id: uuidv4(),
            phoneCode: doc.dialCode || null,
            phoneNumber: doc.altPhoneNumber,
            hidden: false,
            primary: false,
            userId: userId,
            version: 0,
        });
    }

    return phones;
};

// Map addresses
const mapToAddresses = (doc: MongoUserDoc, userId: string): Prisma.AddressCreateManyInput[] => {
    const addresses: Prisma.AddressCreateManyInput[] = [];

    // Present address
    if (doc.addressLine1 || doc.hometown || doc.district) {
        addresses.push({
            id: uuidv4(),
            addressLine1: doc.addressLine1 || null,
            addressLine2: doc.addressLine2 || null,
            addressLine3: doc.addressLine3 || null,
            hometown: doc.hometown || null,
            zipCode: null,
            state: doc.state || null,
            district: doc.district || null,
            country: doc.country || null,
            addressType: 'present',
            userId: userId,
            version: 0,
        });
    }

    // Permanent address (only if different from present)
    if (!doc.presentPermanentSame &&
        (doc.permanentAddressLine1 || doc.permanentHometown || doc.permanentDistrict)) {
        addresses.push({
            id: uuidv4(),
            addressLine1: doc.permanentAddressLine1 || null,
            addressLine2: doc.permanentAddressLine2 || null,
            addressLine3: doc.permanentAddressLine3 || null,
            hometown: doc.permanentHometown || null,
            zipCode: null,
            state: doc.permanentState || null,
            district: doc.permanentDistrict || null,
            country: doc.permanentCountry || null,
            addressType: 'permanent',
            userId: userId,
            version: 0,
        });
    }

    return addresses;
};

// Map social media links
const mapToLinks = (doc: MongoUserDoc, userId: string): Prisma.LinkCreateManyInput[] => {
    const links: Prisma.LinkCreateManyInput[] = [];
    const linkMappings = [
        { field: 'facebookLink', name: 'Facebook', type: 'facebook' },
        { field: 'instagramLink', name: 'Instagram', type: 'instagram' },
        { field: 'linkedInLink', name: 'LinkedIn', type: 'linkedin' },
        { field: 'twitterLink', name: 'Twitter', type: 'twitter' },
        { field: 'whatsappLink', name: 'WhatsApp', type: 'whatsapp' },
    ];

    linkMappings.forEach(({ field, name, type }) => {
        if (doc[field]) {
            links.push({
                id: uuidv4(),
                linkName: name,
                linkType: type,
                linkValue: doc[field],
                userId: userId,
                createdAt: new Date(),
                updatedAt: new Date(),
                version: 0,
            });
        }
    });

    return links;
};

// Main migration function
export async function migrateUsers() {
    const mongoClient = new MongoClient(MONGO_URI);

    try {
        console.log('Connecting to MongoDB...');
        await mongoClient.connect();
        const db = getDatabase(mongoClient);
        const collection = db.collection(MONGO_COLLECTION);

        const totalDocs = await collection.countDocuments();
        console.log(`Found ${totalDocs} documents to migrate`);

        let processed = 0;
        let success = 0;
        let failed = 0;
        const errors: any[] = [];

        // Process in batches
        const cursor = collection.find({});

        while (await cursor.hasNext()) {
            const batch: MongoUserDoc[] = [];

            for (let i = 0; i < BATCH_SIZE && await cursor.hasNext(); i++) {
                const nextDoc = await cursor.next();
                if (nextDoc) {
                    batch.push(nextDoc as unknown as MongoUserDoc);
                }
            }

            if (batch.length === 0) break;

            try {
                // Prepare all data for bulk insert
                const usersData: Prisma.UserProfileCreateInput[] = [];
                const allRoles: Prisma.UserRoleCreateManyInput[] = [];
                const allPhones: Prisma.PhoneNumberCreateManyInput[] = [];
                const allAddresses: Prisma.AddressCreateManyInput[] = [];
                const allLinks: Prisma.LinkCreateManyInput[] = [];

                batch.forEach(doc => {
                    const userId = parseId(doc._id);

                    // Collect user profile data
                    usersData.push(mapToUserProfile(doc));

                    // Collect related data
                    const roles = mapToRoles(doc, userId);
                    if (roles.length > 0) allRoles.push(...roles);

                    const phones = mapToPhoneNumbers(doc, userId);
                    if (phones.length > 0) allPhones.push(...phones);

                    const addresses = mapToAddresses(doc, userId);
                    if (addresses.length > 0) allAddresses.push(...addresses);

                    const links = mapToLinks(doc, userId);
                    if (links.length > 0) allLinks.push(...links);
                });

                // Bulk insert all data in a single transaction
                await prisma.$transaction(async (tx) => {
                    // Bulk insert user profiles
                    await tx.userProfile.createMany({
                        data: usersData,
                        skipDuplicates: true,
                    });

                    // Bulk insert roles
                    if (allRoles.length > 0) {
                        await tx.userRole.createMany({
                            data: allRoles as any, // Type cast might be needed if Prisma generated types are strict on relations
                            skipDuplicates: true,
                        });
                    }

                    // Bulk insert phone numbers
                    if (allPhones.length > 0) {
                        await tx.phoneNumber.createMany({
                            data: allPhones as any,
                            skipDuplicates: true,
                        });
                    }

                    // Bulk insert addresses
                    if (allAddresses.length > 0) {
                        await tx.address.createMany({
                            data: allAddresses as any,
                            skipDuplicates: true,
                        });
                    }

                    // Bulk insert social links
                    if (allLinks.length > 0) {
                        await tx.link.createMany({
                            data: allLinks as any,
                            skipDuplicates: true,
                        });
                    }
                });

                success += batch.length;
                processed += batch.length;

                console.log(`Progress: ${processed}/${totalDocs} (${success} inserted, ${processed - success} skipped/failed)`);
            } catch (error: any) {
                // If bulk insert fails, fall back to individual inserts for this batch
                console.warn(`Bulk insert failed for batch, trying individual inserts: ${error.message}`);

                for (const doc of batch) {
                    try {
                        const userId = parseId(doc._id);

                        // Create user with all relations in a transaction
                        await prisma.$transaction(async (tx) => {
                            // Create user profile
                            await tx.userProfile.create({
                                data: mapToUserProfile(doc),
                            });

                            // Create roles
                            const roles = mapToRoles(doc, userId);
                            if (roles.length > 0) {
                                await tx.userRole.createMany({
                                    data: roles as any,
                                });
                            }

                            // Create phone numbers
                            const phones = mapToPhoneNumbers(doc, userId);
                            if (phones.length > 0) {
                                await tx.phoneNumber.createMany({
                                    data: phones as any,
                                });
                            }

                            // Create addresses
                            const addresses = mapToAddresses(doc, userId);
                            if (addresses.length > 0) {
                                await tx.address.createMany({
                                    data: addresses as any,
                                });
                            }

                            // Create social links
                            const links = mapToLinks(doc, userId);
                            if (links.length > 0) {
                                await tx.link.createMany({
                                    data: links as any,
                                });
                            }
                        });

                        success++;
                    } catch (individualError: any) {
                        failed++;
                        errors.push({
                            id: parseId(doc._id),
                            email: doc.email,
                            error: individualError.message,
                        });
                        console.error(`Error migrating user ${doc.email}:`, individualError.message);
                    }
                    processed++;
                }
            }
        }

        console.log('\n=== Migration Complete ===');
        console.log(`Total: ${totalDocs}`);
        console.log(`Processed: ${processed}`);
        console.log(`Success: ${success}`);
        console.log(`Failed: ${failed}`);

        if (errors.length > 0) {
            console.log('\nFailed migrations:');
            errors.forEach(e => {
                console.log(`  - ${e.email} (${e.id}): ${e.error}`);
            });
        }

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
        await mongoClient.connect();
        const db = getDatabase(mongoClient);
        const collection = db.collection(MONGO_COLLECTION);

        const mongoCount = await collection.countDocuments();
        const pgCount = await prisma.userProfile.count();

        console.log('\n=== Verification ===');
        console.log(`MongoDB documents: ${mongoCount}`);
        console.log(`PostgreSQL records: ${pgCount}`);
        console.log(`Match: ${mongoCount === pgCount ? '✓' : '✗'}`);

        // Check random samples
        const samples = await collection.find({}).limit(5).toArray();
        for (const sample of samples) {
            const userId = parseId(sample._id);
            const pgUser = await prisma.userProfile.findUnique({
                where: { id: userId },
                include: {
                    roles: true,
                    phoneNumbers: true,
                    addresses: true,
                    socialMediaLinks: true,
                }
            });

            console.log(`\nSample check: ${sample.email}`);
            console.log(`  - User exists: ${pgUser ? '✓' : '✗'}`);
            if (pgUser) {
                console.log(`  - Roles: ${pgUser.roles.length}`);
                console.log(`  - Phone numbers: ${pgUser.phoneNumbers.length}`);
                console.log(`  - Addresses: ${pgUser.addresses.length}`);
                console.log(`  - Social links: ${pgUser.socialMediaLinks.length}`);
            }
        }

    } finally {
        await mongoClient.close();
        await prisma.$disconnect();
    }
}

// Run migration if called directly
if (require.main === module) {
    const args = process.argv.slice(2);
    const verify = args.includes('--verify');

    if (verify) {
        verifyMigration()
            .then(() => process.exit(0))
            .catch(err => {
                console.error(err);
                process.exit(1);
            });
    } else {
        migrateUsers()
            .then(() => {
                console.log('\nRunning verification...');
                return verifyMigration();
            })
            .then(() => process.exit(0))
            .catch(err => {
                console.error(err);
                process.exit(1);
            });
    }
}
