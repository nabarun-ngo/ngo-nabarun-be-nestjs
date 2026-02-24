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
async function createLocalUser(user: Auth0User) {
    const name = user.given_name
        ? { firstName: user.given_name, lastName: user.family_name || "" }
        : splitName(user.name);
    console.log(`Profile Id : ${user.user_metadata['profile_id'] ?? 'Not Found'}`)
    try {
        await prisma.userProfile.upsert({
            where: { email: user.email },
            update: {
                authUserId: user.user_id,
            },
            create: {
                id: user.user_metadata['profile_id'] ?? randomUUID(),
                firstName: name.firstName,
                lastName: name.lastName,
                email: user.email,
                status: 'ACTIVE',
                isTemporary: false,
                authUserId: user.user_id,
            }
        });

        console.log(`✔ Created/Updated: ${user.email} `);

    } catch (err: any) {
        console.log(`✖ Failed: ${user.email} `);
        console.log(err.message);
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
            await createLocalUser(user);
        }

        console.log("SYNC COMPLETED");
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}


main();
