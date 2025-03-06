-- DropForeignKey
ALTER TABLE `task` DROP FOREIGN KEY `Task_assigneeId_fkey`;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_assigneeId_fkey` FOREIGN KEY (`assigneeId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
