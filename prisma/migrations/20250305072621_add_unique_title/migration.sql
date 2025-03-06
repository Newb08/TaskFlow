/*
  Warnings:

  - A unique constraint covering the columns `[uniqueTitle]` on the table `Task` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[assigneeId,title]` on the table `Task` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `Task_title_key` ON `task`;

-- AlterTable
ALTER TABLE `task` ADD COLUMN `createdBy` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'ADMIN',
    ADD COLUMN `uniqueTitle` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Task_uniqueTitle_key` ON `Task`(`uniqueTitle`);

-- CreateIndex
CREATE UNIQUE INDEX `Task_assigneeId_title_key` ON `Task`(`assigneeId`, `title`);
