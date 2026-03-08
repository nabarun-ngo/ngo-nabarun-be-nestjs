import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient({
    datasourceUrl: process.env.MIG_POSTGRES_URL,
});


const {
    AUTH0_DOMAIN,
    AUTH0_MANAGEMENT_CLIENT_ID,
    AUTH0_MANAGEMENT_CLIENT_SECRET,
} = process.env;

interface Auth0User {
    user_id: string;
    email: string;
    given_name?: string;
    family_name?: string;
    name?: string;
    phone_number?: string;
    email_verified: boolean;
    user_metadata: Record<string, string>;
}

interface Auth0Role {
    id: string;
    name: string;
    description?: string;
}

/**

* STEP 1 — Get Auth0 Management Token
  */
async function getManagementToken(): Promise<string> {
    const url = `https://${AUTH0_DOMAIN}/oauth/token`;

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            client_id: AUTH0_MANAGEMENT_CLIENT_ID,
            client_secret: AUTH0_MANAGEMENT_CLIENT_SECRET,
            audience: `https://${AUTH0_DOMAIN}/api/v2/`,
            grant_type: "client_credentials"
        })
    });

    if (!res.ok) {
        const error = await res.text();
        throw new Error(`Failed to get management token: ${res.status} ${error}`);
    }

    const data = await res.json();
    return data.access_token;
}


/**

* STEP 2 — Fetch ALL Auth0 users (pagination)
  */
async function fetchAllUsers(token: string): Promise<Auth0User[]> {
    let page = 0;
    const perPage = 50;
    let users: Auth0User[] = [];

    while (true) {
        console.log(`Fetching page ${page}`);
        const url = new URL(`https://${AUTH0_DOMAIN}/api/v2/users`);
        url.searchParams.append("page", page.toString());
        url.searchParams.append("per_page", perPage.toString());
        url.searchParams.append("include_totals", "false");

        const res = await fetch(url.toString(), {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!res.ok) {
            const error = await res.text();
            throw new Error(`Failed to fetch users at page ${page}: ${res.status} ${error}`);
        }

        const batch: Auth0User[] = await res.json();

        if (batch.length === 0) break;

        users = users.concat(batch);
        page++;
    }

    console.log(`Total users fetched: ${users.length} `);
    return users;
}

/**
 * STEP 2.5 — Fetch roles for a specific user
 */
async function fetchUserRoles(token: string, userId: string): Promise<Auth0Role[]> {
    const url = `https://${AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(userId)}/roles`;

    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!res.ok) {
        const error = await res.text();
        console.error(`Failed to fetch roles for user ${userId}: ${res.status} ${error}`);
        return [];
    }

    return await res.json();
}


/**

* Helper — split name if first/last not present
  */
function splitName(name?: string) {
    if (!name) return { firstName: "Unknown", lastName: "" };

    const parts = name.split(" ");
    return {
        firstName: parts[0],
        lastName: parts.slice(1).join(" ")
    };
}



/**

* STEP 3 — Send user to your backend
  */
async function createLocalUser(user: Auth0User, token: string) {
    const name = user.given_name
        ? { firstName: user.given_name, lastName: user.family_name || "" }
        : splitName(user.name);

    const profileId = user.user_metadata['profile_id'];
    console.log(`Profile Id : ${profileId ?? 'Not Found'}`)

    if (!profileId) {
        console.error(`✖ Failed: ${user.email} `);
        return;
    }
    try {
        await prisma.userProfile.upsert({
            where: { email: user.email },
            update: {
                authUserId: user.user_id,
            },
            create: {
                id: profileId,
                firstName: name.firstName,
                lastName: name.lastName,
                email: user.email,
                status: 'ACTIVE',
                isTemporary: false,
                authUserId: user.user_id,
            }
        });

        console.log(`✔ Created/Updated: ${user.email} `);

        // --- Fetch and Sync Roles ---
        const roles = await fetchUserRoles(token, user.user_id);

        // Delete existing roles for this user to avoid duplicates
        await prisma.userRole.deleteMany({
            where: { userId: profileId }
        });

        if (roles.length > 0) {
            await prisma.userRole.createMany({
                data: roles.map(role => ({
                    userId: profileId,
                    roleCode: role.name,
                    roleName: role.name,
                    authRoleCode: role.name,
                    isDefault: false
                }))
            });
            console.log(`  └─ Synced ${roles.length} roles: ${roles.map(r => r.name).join(', ')}`);
        }

    } catch (err: any) {
        console.error(`✖ Failed: ${user.email} `);
        console.error(err.message);
    }
}


/**

* MAIN
  */
async function main() {
    try {
        const token = await getManagementToken();
        const users = await fetchAllUsers(token);

        for (const user of users) {
            if (!user.email) continue;
            await createLocalUser(user, token);
        }

        console.log("SYNC COMPLETED");
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}


main();
