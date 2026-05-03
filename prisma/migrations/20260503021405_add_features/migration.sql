-- CreateTable
CREATE TABLE "EscalationEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "obligationId" TEXT NOT NULL,
    "fromLevel" INTEGER NOT NULL,
    "toLevel" INTEGER NOT NULL,
    "fromRole" TEXT NOT NULL,
    "toRole" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "triggeredBy" TEXT NOT NULL DEFAULT 'SYSTEM',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EscalationEvent_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "Obligation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StatuteLaw" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "provision" TEXT NOT NULL,
    "category" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "StatutoryConflict" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "obligationId" TEXT NOT NULL,
    "judgmentId" TEXT NOT NULL,
    "statuteLawId" TEXT NOT NULL,
    "conflictType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "obligationText" TEXT NOT NULL,
    "statuteText" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "StatutoryConflict_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "Obligation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StatutoryConflict_judgmentId_fkey" FOREIGN KEY ("judgmentId") REFERENCES "Judgment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StatutoryConflict_statuteLawId_fkey" FOREIGN KEY ("statuteLawId") REFERENCES "StatuteLaw" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Judgment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "courtName" TEXT,
    "caseNumber" TEXT,
    "benchComposition" TEXT,
    "judgmentDate" DATETIME,
    "filePath" TEXT,
    "fileName" TEXT NOT NULL,
    "fullText" TEXT,
    "pageCount" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'UPLOADED',
    "contemptRiskScore" REAL NOT NULL DEFAULT 0,
    "contemptRiskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Judgment" ("caseNumber", "courtName", "fileName", "filePath", "fullText", "id", "judgmentDate", "pageCount", "status", "title", "uploadedAt") SELECT "caseNumber", "courtName", "fileName", "filePath", "fullText", "id", "judgmentDate", "pageCount", "status", "title", "uploadedAt" FROM "Judgment";
DROP TABLE "Judgment";
ALTER TABLE "new_Judgment" RENAME TO "Judgment";
CREATE TABLE "new_Obligation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "judgmentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "deadline" DATETIME,
    "deadlineText" TEXT,
    "responsiblePartyId" TEXT,
    "assignedOfficer" TEXT,
    "sourceExcerpt" TEXT NOT NULL,
    "sourcePage" INTEGER,
    "reasoning" TEXT NOT NULL,
    "reasoningChain" TEXT,
    "triggerCondition" TEXT,
    "confidence" REAL NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifierNotes" TEXT,
    "verifiedAt" DATETIME,
    "escalationLevel" INTEGER NOT NULL DEFAULT 0,
    "escalatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Obligation_judgmentId_fkey" FOREIGN KEY ("judgmentId") REFERENCES "Judgment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Obligation_responsiblePartyId_fkey" FOREIGN KEY ("responsiblePartyId") REFERENCES "Party" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Obligation" ("confidence", "createdAt", "deadline", "deadlineText", "description", "id", "judgmentId", "priority", "reasoning", "responsiblePartyId", "sourceExcerpt", "sourcePage", "status", "title", "type", "verified", "verifiedAt", "verifierNotes") SELECT "confidence", "createdAt", "deadline", "deadlineText", "description", "id", "judgmentId", "priority", "reasoning", "responsiblePartyId", "sourceExcerpt", "sourcePage", "status", "title", "type", "verified", "verifiedAt", "verifierNotes" FROM "Obligation";
DROP TABLE "Obligation";
ALTER TABLE "new_Obligation" RENAME TO "Obligation";
CREATE INDEX "Obligation_judgmentId_status_idx" ON "Obligation"("judgmentId", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
