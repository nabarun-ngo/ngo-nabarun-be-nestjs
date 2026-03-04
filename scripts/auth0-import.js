"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient({
    datasourceUrl: process.env.MIG_POSTGRES_URL,
});
var _a = process.env, AUTH0_DOMAIN = _a.AUTH0_DOMAIN, AUTH0_MANAGEMENT_CLIENT_ID = _a.AUTH0_MANAGEMENT_CLIENT_ID, AUTH0_MANAGEMENT_CLIENT_SECRET = _a.AUTH0_MANAGEMENT_CLIENT_SECRET;
/**

* STEP 1 — Get Auth0 Management Token
  */
function getManagementToken() {
    return __awaiter(this, void 0, void 0, function () {
        var url, res, error, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    url = "https://".concat(AUTH0_DOMAIN, "/oauth/token");
                    return [4 /*yield*/, fetch(url, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                client_id: AUTH0_MANAGEMENT_CLIENT_ID,
                                client_secret: AUTH0_MANAGEMENT_CLIENT_SECRET,
                                audience: "https://".concat(AUTH0_DOMAIN, "/api/v2/"),
                                grant_type: "client_credentials"
                            })
                        })];
                case 1:
                    res = _a.sent();
                    if (!!res.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, res.text()];
                case 2:
                    error = _a.sent();
                    throw new Error("Failed to get management token: ".concat(res.status, " ").concat(error));
                case 3: return [4 /*yield*/, res.json()];
                case 4:
                    data = _a.sent();
                    return [2 /*return*/, data.access_token];
            }
        });
    });
}
/**

* STEP 2 — Fetch ALL Auth0 users (pagination)
  */
function fetchAllUsers(token) {
    return __awaiter(this, void 0, void 0, function () {
        var page, perPage, users, url, res, error, batch;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    page = 0;
                    perPage = 50;
                    users = [];
                    _a.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 6];
                    console.log("Fetching page ".concat(page));
                    url = new URL("https://".concat(AUTH0_DOMAIN, "/api/v2/users"));
                    url.searchParams.append("page", page.toString());
                    url.searchParams.append("per_page", perPage.toString());
                    url.searchParams.append("include_totals", "false");
                    return [4 /*yield*/, fetch(url.toString(), {
                            headers: {
                                Authorization: "Bearer ".concat(token)
                            }
                        })];
                case 2:
                    res = _a.sent();
                    if (!!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, res.text()];
                case 3:
                    error = _a.sent();
                    throw new Error("Failed to fetch users at page ".concat(page, ": ").concat(res.status, " ").concat(error));
                case 4: return [4 /*yield*/, res.json()];
                case 5:
                    batch = _a.sent();
                    if (batch.length === 0)
                        return [3 /*break*/, 6];
                    users = users.concat(batch);
                    page++;
                    return [3 /*break*/, 1];
                case 6:
                    console.log("Total users fetched: ".concat(users.length, " "));
                    return [2 /*return*/, users];
            }
        });
    });
}
/**
 * STEP 2.5 — Fetch roles for a specific user
 */
function fetchUserRoles(token, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var url, res, error;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    url = "https://".concat(AUTH0_DOMAIN, "/api/v2/users/").concat(encodeURIComponent(userId), "/roles");
                    return [4 /*yield*/, fetch(url, {
                            headers: {
                                Authorization: "Bearer ".concat(token)
                            }
                        })];
                case 1:
                    res = _a.sent();
                    if (!!res.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, res.text()];
                case 2:
                    error = _a.sent();
                    console.error("Failed to fetch roles for user ".concat(userId, ": ").concat(res.status, " ").concat(error));
                    return [2 /*return*/, []];
                case 3: return [4 /*yield*/, res.json()];
                case 4: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
/**

* Helper — split name if first/last not present
  */
function splitName(name) {
    if (!name)
        return { firstName: "Unknown", lastName: "" };
    var parts = name.split(" ");
    return {
        firstName: parts[0],
        lastName: parts.slice(1).join(" ")
    };
}
/**

* STEP 3 — Send user to your backend
  */
function createLocalUser(user, token) {
    return __awaiter(this, void 0, void 0, function () {
        var name, profileId, roles, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    name = user.given_name
                        ? { firstName: user.given_name, lastName: user.family_name || "" }
                        : splitName(user.name);
                    profileId = user.user_metadata['profile_id'];
                    console.log("Profile Id : ".concat(profileId !== null && profileId !== void 0 ? profileId : 'Not Found'));
                    if (!profileId) {
                        console.error("\u2716 Failed: ".concat(user.email, " "));
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 7, , 8]);
                    return [4 /*yield*/, prisma.userProfile.upsert({
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
                        })];
                case 2:
                    _a.sent();
                    console.log("\u2714 Created/Updated: ".concat(user.email, " "));
                    return [4 /*yield*/, fetchUserRoles(token, user.user_id)];
                case 3:
                    roles = _a.sent();
                    // Delete existing roles for this user to avoid duplicates
                    return [4 /*yield*/, prisma.userRole.deleteMany({
                            where: { userId: profileId }
                        })];
                case 4:
                    // Delete existing roles for this user to avoid duplicates
                    _a.sent();
                    if (!(roles.length > 0)) return [3 /*break*/, 6];
                    return [4 /*yield*/, prisma.userRole.createMany({
                            data: roles.map(function (role) { return ({
                                userId: profileId,
                                roleCode: role.name,
                                roleName: role.name,
                                authRoleCode: role.name,
                                isDefault: false
                            }); })
                        })];
                case 5:
                    _a.sent();
                    console.log("  \u2514\u2500 Synced ".concat(roles.length, " roles: ").concat(roles.map(function (r) { return r.name; }).join(', ')));
                    _a.label = 6;
                case 6: return [3 /*break*/, 8];
                case 7:
                    err_1 = _a.sent();
                    console.error("\u2716 Failed: ".concat(user.email, " "));
                    console.error(err_1.message);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
/**

* MAIN
  */
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var token, users, _i, users_1, user, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, 8, 10]);
                    return [4 /*yield*/, getManagementToken()];
                case 1:
                    token = _a.sent();
                    return [4 /*yield*/, fetchAllUsers(token)];
                case 2:
                    users = _a.sent();
                    _i = 0, users_1 = users;
                    _a.label = 3;
                case 3:
                    if (!(_i < users_1.length)) return [3 /*break*/, 6];
                    user = users_1[_i];
                    if (!user.email)
                        return [3 /*break*/, 5];
                    return [4 /*yield*/, createLocalUser(user, token)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6:
                    console.log("SYNC COMPLETED");
                    return [3 /*break*/, 10];
                case 7:
                    err_2 = _a.sent();
                    console.error(err_2);
                    return [3 /*break*/, 10];
                case 8: return [4 /*yield*/, prisma.$disconnect()];
                case 9:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 10: return [2 /*return*/];
            }
        });
    });
}
main();
