CREATE TABLE `attorney_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`firmName` varchar(255),
	`fullName` varchar(255),
	`phone` varchar(40),
	`bio` text,
	`barNumber` varchar(80),
	`barState` varchar(80),
	`yearAdmitted` int,
	`jurisdictions` json,
	`goodStandingCertified` boolean NOT NULL DEFAULT false,
	`credentialFileKey` varchar(512),
	`credentialFileUrl` varchar(1024),
	`verificationStatus` enum('pending','verified','rejected') NOT NULL DEFAULT 'pending',
	`clientSlotsPurchased` int NOT NULL DEFAULT 0,
	`clientSlotsUsed` int NOT NULL DEFAULT 0,
	`onboardingComplete` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attorney_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bids` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`attorneyId` int NOT NULL,
	`firstTwoFee` int NOT NULL,
	`thirdFee` int NOT NULL,
	`message` text,
	`status` enum('submitted','viewed','accepted','declined','withdrawn') NOT NULL DEFAULT 'submitted',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bids_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `case_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`docType` varchar(120),
	`description` text,
	`fileKey` varchar(512),
	`fileUrl` varchar(1024),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `case_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_intakes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255),
	`email` varchar(320),
	`contactReason` varchar(255),
	`message` text,
	`transcript` json,
	`status` enum('new','responded','closed') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_intakes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientUserId` int,
	`tenantName` varchar(255) NOT NULL,
	`displayName` varchar(255) NOT NULL,
	`caseType` varchar(120) NOT NULL,
	`propertyAddress` varchar(512),
	`county` varchar(120) NOT NULL,
	`state` varchar(80) NOT NULL,
	`monthlyRent` int,
	`caseSummary` text NOT NULL,
	`landlordName` varchar(255),
	`hearingDate` timestamp,
	`status` enum('available','bidding','represented','closed') NOT NULL DEFAULT 'available',
	`representedByAttorneyId` int,
	`onboardingPaid` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_cases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consultations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bidId` int NOT NULL,
	`caseId` int NOT NULL,
	`clientUserId` int NOT NULL,
	`attorneyId` int NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`durationMinutes` int NOT NULL DEFAULT 30,
	`feeAmount` int NOT NULL DEFAULT 25,
	`creditedToFees` boolean NOT NULL DEFAULT true,
	`paymentId` int,
	`status` enum('pending_payment','scheduled','completed','cancelled') NOT NULL DEFAULT 'pending_payment',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consultations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `court_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`caseNumber` varchar(120) NOT NULL,
	`court` varchar(255) NOT NULL,
	`filingDate` timestamp,
	`partyPlaintiff` varchar(255),
	`partyDefendant` varchar(255),
	`actionType` varchar(255),
	`disposition` varchar(255),
	`outcome` text,
	`source` varchar(120) NOT NULL DEFAULT 'CaseLink',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `court_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bidId` int NOT NULL,
	`caseId` int NOT NULL,
	`senderUserId` int NOT NULL,
	`senderRole` enum('attorney','client') NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`kind` enum('client_onboarding','attorney_clients','consultation') NOT NULL,
	`amount` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`stripeSessionId` varchar(255),
	`stripePaymentIntentId` varchar(255),
	`status` enum('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','attorney','client') NOT NULL DEFAULT 'user';