import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET || 'secretKey';

const prisma = new PrismaClient();

const resolvers = {
  Query: {
    getAllUsers: async () => {
      try {
        return await prisma.user.findMany();
      } catch (error) {
        console.log('Error from getAllUsers', error);
      }
    },
    getUserById: async (_, { id }, context) => {
      // console.log("Context: ",context)
      if (!context.user) throw new Error('Unauthorized');
      try {
        const user = await prisma.user.findFirst({
          where: { id: id },
        });
        if (!user) throw new Error('User not found');
        return user;
      } catch (error) {
        console.log('Error from getUserById', error);
      }
    },
    getAllTasks: async () => {
      try {
        return await prisma.task.findMany();
      } catch (error) {
        console.log('Error from getAllTasks', error);
      }
    },
    getTaskById: async (_, { id }) => {
      try {
        const task = await prisma.task.findFirst({
          where: { id: id },
        });
        if (!task) throw new Error('Task not found');
        return task;
      } catch (error) {
        console.log('Error from getTaskById', error);
      }
    },
  },
  Mutation: {
    createUser: async (_, { email, password, name, role }) => {
      try {
        const encryptPass = await bcrypt.hash(password, 10);

        return await prisma.user.create({
          data: { email: email, password: encryptPass, name: name, role: role },
        });
      } catch (error) {
        console.log('Error from createUser', error);
      }
    },
    updateUser: async (_, { id, name }) => {
      try {
        return await prisma.user.update({
          where: { id: id },
          data: { name: name },
        });
      } catch (error) {
        console.log('Error from updateUser', error);
      }
    },
    deleteUser: async (_, { id }) => {
      try {
        return await prisma.user.delete({
          where: { id: id },
        });
      } catch (error) {
        console.log('Error from deleteUser', error);
      }
    },
    createTask: async (_, { title, userId }) => {
      try {
        return await prisma.task.create({
          data: { title: title, assigneeId: userId },
        });
      } catch (error) {
        console.log('Error from createTask', error);
      }
    },
    updateTask: async (_, { id, title }) => {
      try {
        return await prisma.task.update({
          where: { id: id },
          data: { title: title },
        });
      } catch (error) {
        console.log('Error from updateTask', error);
      }
    },
    deleteTask: async (_, { id }) => {
      try {
        return await prisma.task.delete({
          where: { id: id },
        });
      } catch (error) {
        console.log('Error from deleteTask', error);
      }
    },
    login: async (_, arg) => {
      try {
        const { email, password } = arg;
        const user = await prisma.user.findFirst({
          where: { email: email },
        });
        if (!user || !bcrypt.compareSync(password, user.password))
          throw new Error('Incorrect Password/User-email');

        return jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
      } catch (error) {
        console.log(error);
      }
    },
  },
  Task: {
    assignee: async (parent) => {
      try {
        return await prisma.user.findFirst({
          where: { id: parent.assigneeId },
        });
      } catch (error) {
        console.log('Error from assignee', error);
      }
    },
  },
  User: {
    tasks: async (parent) => {
      try {
        return await prisma.task.findMany({
          where: { assigneeId: parent.id },
        });
      } catch (error) {
        console.log('Error from tasks', error);
      }
    },
  },
};

export default resolvers;
