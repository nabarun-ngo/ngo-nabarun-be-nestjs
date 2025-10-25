-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(5),
    "firstName" VARCHAR(50) NOT NULL,
    "middleName" VARCHAR(50),
    "lastName" VARCHAR(50) NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" VARCHAR(10),
    "about" VARCHAR(200),
    "picture" TEXT,
    "email" VARCHAR(100) NOT NULL,
    "isPublic" BOOLEAN,
    "authUserId" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL,
    "isTemporary" BOOLEAN NOT NULL,
    "isSameAddress" BOOLEAN,
    "loginMethods" VARCHAR(20),
    "panNumber" VARCHAR(20),
    "aadharNumber" VARCHAR(20),
    "donationPauseStart" TIMESTAMP(3),
    "donationPauseEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "roleCode" VARCHAR(20) NOT NULL,
    "roleName" VARCHAR(50) NOT NULL,
    "authRoleCode" VARCHAR(20) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" VARCHAR(255),
    "expireAt" TIMESTAMP(3),
    "version" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phone_numbers" (
    "id" TEXT NOT NULL,
    "phoneCode" TEXT,
    "phoneNumber" TEXT,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "primary" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "version" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "phone_numbers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "links" (
    "id" TEXT NOT NULL,
    "linkName" VARCHAR(20) NOT NULL,
    "linkType" VARCHAR(20) NOT NULL,
    "linkValue" VARCHAR(50) NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "addressLine3" TEXT,
    "hometown" TEXT,
    "zipCode" TEXT,
    "state" TEXT,
    "district" TEXT,
    "country" TEXT,
    "addressType" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "version" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_email_key" ON "user_profiles"("email");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phone_numbers" ADD CONSTRAINT "phone_numbers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "links" ADD CONSTRAINT "links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
