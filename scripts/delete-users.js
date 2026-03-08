const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise(resolve => rl.question(question, answer => resolve(answer)));
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    try {
        const DOMAIN = await ask("Enter Auth0 Domain (example: tenant.auth0.com): ");
        const TOKEN = await ask("Enter Management API Token: ");
        const requiredText = await ask("Keep users where last_name contains (example: TestUser): ");
        const dryRunAnswer = await ask("Dry run? (yes/no): ");

        const DRY_RUN = dryRunAnswer.toLowerCase() === "yes";

        rl.close();

        if (!DOMAIN || !TOKEN) {
            console.error("❌ Domain and Token are required.");
            process.exit(1);
        }

        const BASE_URL = `https://${DOMAIN}/api/v2`;
        const headers = {
            "Authorization": `Bearer ${TOKEN}`,
            "Content-Type": "application/json"
        };

        async function fetchUsers(page) {
            const url = `${BASE_URL}/users?page=${page}&per_page=100&include_totals=true`;
            const response = await fetch(url, { headers });

            if (!response.ok) {
                throw new Error(`Failed fetching users: ${response.status}`);
            }

            return response.json();
        }

        async function getAllUsers() {
            let page = 0;
            let allUsers = [];
            let total = 0;

            do {
                console.log(`📄 Fetching page ${page}...`);
                const data = await fetchUsers(page);
                total = data.total;
                allUsers = allUsers.concat(data.users);
                page++;
            } while (allUsers.length < total);

            return allUsers;
        }

        async function deleteUser(userId) {
            if (DRY_RUN) {
                console.log(`🟡 DRY RUN - Would delete: ${userId}`);
                return;
            }

            const url = `${BASE_URL}/users/${encodeURIComponent(userId)}`;
            const response = await fetch(url, {
                method: "DELETE",
                headers
            });

            if (response.status === 429) {
                console.log("⏳ Rate limited. Waiting 2 seconds...");
                await sleep(2000);
                return deleteUser(userId);
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Failed deleting ${userId}:`, errorText);
            } else {
                console.log(`✅ Deleted: ${userId}`);
            }
        }

        const users = await getAllUsers();
        console.log(`👥 Total Users Found: ${users.length}`);

        const usersToDelete = users.filter(user => {
            const lastName = user.family_name || "";
            return !lastName.includes(requiredText);
        });

        console.log(`🔥 Users to Delete: ${usersToDelete.length}`);

        for (const user of usersToDelete) {
            await deleteUser(user.user_id);
        }

        console.log("🎉 Script Completed");

    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
}

main();