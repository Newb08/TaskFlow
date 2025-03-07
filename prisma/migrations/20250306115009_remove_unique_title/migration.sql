/*
  Warnings:

  - You are about to drop the column `uniqueTitle` on the `task` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `task` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.

*/
-- DropIndex
DROP INDEX `Task_uniqueTitle_key` ON `task`;

-- AlterTable
ALTER TABLE `task` DROP COLUMN `uniqueTitle`,
    MODIFY `status` ENUM('pending', 'completed') NOT NULL DEFAULT 'pending';
