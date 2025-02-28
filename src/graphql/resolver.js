import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const resolvers = {
  Query: {
    getAllUsers: async () => await prisma.user.findMany(),
    getUserById: async (_, { id }) => {
      const user = await prisma.user.findFirst({
        where: { id: id },
      });
      if (!user) throw new Error('User not found');
      return user;
    },
    getAllTasks: async () => await prisma.task.findMany(),
    getTaskById: async (_, { id }) => {
      const task = await prisma.task.findFirst({
        where: { id: id },
      });
      if (!task) throw new Error('Task not found');
      return task;
    },
  },
  Mutation: {
    createUser: async (_, { email, password, name, role }) => {
      const encryptPass = await bcrypt.hash(password, 10)

      return await prisma.user.create({
        data: { email: email, password: encryptPass, name: name, role: role },
      });
    },
    updateUser: async (_, { id, name }) => {
      return await prisma.user.update({
        where: { id: id },
        data: { name: name },
      });
    },
    deleteUser: async (_, { id }) => {
      return await prisma.user.delete({
        where: { id: id },
      });
    },
    createTask: async (_, { title, userId }) => {
      return await prisma.task.create({
        data: { title: title, assigneeId: userId },
      });
    },
    updateTask: async (_, { id, title }) => {
      return await prisma.task.update({
        where: { id: id },
        data: { title: title },
      });
    },
    deleteTask: async (_, { id }) => {
      return await prisma.task.delete({
        where: { id: id },
      });
    },
  },
  Task: {
    assignee: async (parent) => {
      return await prisma.user.findFirst({
        where: { id: parent.assigneeId },
      });
    },
  },
};

export default resolvers
