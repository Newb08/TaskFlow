/*
  Warnings:

  - Made the column `description` on table `task` required. This step will fail if there are existing NULL values in that column.
  - Made the column `uniqueTitle` on table `task` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `task` MODIFY `description` VARCHAR(191) NOT NULL DEFAULT 'No description provided.',
    MODIFY `uniqueTitle` VARCHAR(191) NOT NULL;
