/*
  Warnings:

  - You are about to alter the column `version` on the `accounts` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `version` on the `activities` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `version` on the `addresses` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `rateLimit` on the `api_keys` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `fileSize` on the `document_references` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `version` on the `donations` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `version` on the `earnings` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `version` on the `expenses` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `version` on the `goals` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `version` on the `links` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `version` on the `meetings` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `version` on the `notices` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `version` on the `phone_numbers` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `version` on the `projects` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `version` on the `transactions` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `version` on the `user_profiles` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `version` on the `user_roles` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `version` on the `workflow_instances` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "accounts" ALTER COLUMN "version" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "activities" ALTER COLUMN "version" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "addresses" ALTER COLUMN "version" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "api_keys" ALTER COLUMN "rateLimit" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "document_references" ALTER COLUMN "fileSize" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "donations" ALTER COLUMN "version" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "earnings" ALTER COLUMN "version" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "expenses" ALTER COLUMN "version" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "goals" ALTER COLUMN "version" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "links" ALTER COLUMN "version" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "meetings" ALTER COLUMN "version" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "notices" ALTER COLUMN "version" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "phone_numbers" ALTER COLUMN "version" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "projects" ALTER COLUMN "version" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "transactions" ALTER COLUMN "version" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "user_profiles" ALTER COLUMN "version" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "user_roles" ALTER COLUMN "version" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "workflow_instances" ALTER COLUMN "version" SET DATA TYPE INTEGER;
