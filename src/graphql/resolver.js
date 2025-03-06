import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { adminAuth, userAuth } from '../utils/requireAuth.js';

dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET || 'secretKey';

const prisma = new PrismaClient();

const resolvers = {
  Query: {
    getUsers: async (parent, { data, orderBy, limit = 10, offset = 0 }, context) => {
      try {
        adminAuth(context);
        const { role, status, names_in, userWithoutTasks, ids_in } = data || {};

        let order = {};
        if (orderBy) {
          const [field, direction] = orderBy.split('_');
          order = { [field]: direction };
        }
        return await prisma.user.findMany({
          where: {
            role,
            id: { in: ids_in },
            name: { in: names_in },
            tasks: userWithoutTasks
              ? { none: {} }
              : status
              ? { some: { status: status } }
              : undefined,
          },
          take: limit,
          skip: offset,
          orderBy: order,
        });
      } catch (error) {
        console.log('Error from getUsers', error);
      }
    },
    getLoggedUser: async (parent, _, context) => {
      try {
        const { userId } = userAuth(context);
        if (!userId) throw new Error('Unauthorized');
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });
        if (!user) throw new Error('User not found');
        return user;
      } catch (error) {
        console.log('Error from getLoggedUser', error);
      }
    },
    getTasks: async (parent, { data, orderBy, limit = 10, offset = 0 }, context) => {
      try {
        adminAuth(context);
        const { status, titles_in, ids_in, assigneeIds_in } = data || {};

        let order = {};
        if (orderBy) {
          const [field, direction] = orderBy.split('_');
          order = { [field]: direction };
        }
        return await prisma.task.findMany({
          where: {
            id: { in: ids_in },
            title: { in: titles_in },
            status: status,
            assigneeId: { in: assigneeIds_in },
          },
          take: limit,
          skip: offset,
          orderBy: order,
        });
      } catch (error) {
        console.log('Error from getTasks', error);
      }
    },
    getLoggedTask: async (parent, { data, orderBy, limit = 10, offset = 0 }, context) => {
      try {
        const { userId } = userAuth(context);
        if (!userId) throw new Error('Unauthorized');
        const { status, titles_in, ids_in } = data || {};
        let order = {};
        if (orderBy) {
          const [field, direction] = orderBy.split('_');
          order = { [field]: direction };
        }

        const user = await prisma.task.findMany({
          where: {
            assigneeId: userId,
            id: { in: ids_in },
            title: { in: titles_in },
            status: status,
          },
          take: limit,
          skip: offset,
          orderBy: order,
        });
        if (!user) throw new Error('User not found');
        return user;
      } catch (error) {
        console.log('Error from getLoggedTask', error);
      }
    },
  },
  Mutation: {
    // User CUD Operations
    createUser: async (_, { data }, context) => {
      try {
        adminAuth(context);
        const { role = 'USER', name, email, password } = data || {};
        const encryptPass = await bcrypt.hash(password, 10);
        return await prisma.user.create({
          data: { email, password: encryptPass, name, role },
        });
      } catch (error) {
        console.log('Error from createUser', error);
      }
    },
    updateUser: async (_, { id, where }, context) => {
      try {
        if (!context.user) throw new Error('Unauthorized');
        if (context.user.role !== 'ADMIN' && context.user.id !== id)
          throw new Error('Unauthorized: You can only update your own profile.');

        const { name, profilePic, password, email } = where || {};
        let updatedData = {};

        if (name) updatedData.name = name;
        if (password) updatedData.password = await bcrypt.hash(password, 10);
        if (profilePic) updatedData.profilePic = profilePic;
        if (email) updatedData.email = email;

        return await prisma.user.update({
          where: { id: id },
          data: updatedData,
        });
      } catch (error) {
        console.log('Error from updateUser', error);
      }
    },
    deleteUser: async (_, { input }, context) => {
      try {
        adminAuth(context);
        const { ids_in, names_in, userWithoutTasks } = input || {};
        return await prisma.user.deleteMany({
          where: {
            id: { in: ids_in },
            name: { in: names_in },
            tasks: userWithoutTasks ? { none: {} } : undefined,
          },
        });
      } catch (error) {
        console.log('Error from deleteUser', error);
      }
    },

    // Task CUD Operations

    AddTask: async (_, { input }, context) => {
      try {
        adminAuth(context);
        const { title, description, assigneeIds_in } = input || {};
        let createData = [];
        for (const id of assigneeIds_in) {
          let userData = {};
          userData.title = title;
          userData.assigneeId = id;
          if (description) userData.description = description;
          userData.uniqueTitle = `${id}_${title}`;
          userData.createdBy = 'ADMIN';
          createData.push(userData);
        }

        return await prisma.task.createMany({
          data: createData,
        });
      } catch (error) {
        console.log('Error from addTask', error);
      }
    },
    createTask: async (_, { input }, context) => {
      try {
        const { userId } = userAuth(context);
        const { title, description } = input || {};

        let createData = {};
        createData.assigneeId = userId;
        createData.title = title;
        if (description) createData.description = description;
        createData.uniqueTitle = `${userId}_${title}`;
        createData.createdBy = 'USER';

        return await prisma.task.create({
          data: createData,
        });
      } catch (error) {
        console.log('Error from createTask', error);
      }
    },
    updateTask: async (_, { taskId, input }, context) => {
      try {
        const { userId, role } = userAuth(context);
        const { title, description, status, assigneeId } = input || {};
        let updatedData = {};
        // console.log(taskId, input)
        if (description) updatedData.description = description;
        if (status) updatedData.status = status;
        if (title) {
          updatedData.title = title;
          updatedData.uniqueTitle = `${assigneeId}_${title}`;
        }
        const whereCondition = {
          id: taskId,
        };
        if(role === "USER"){
          whereCondition.assigneeId= userId
          if(title)
          updatedData.uniqueTitle = `${userId}_${title}`;
        }
        // console.log(updatedData)
        return await prisma.task.update({
          where: whereCondition,
          data: updatedData,
        });
      } catch (error) {
        console.log('Error from updateTask', error);
      }
    },
    deleteTask: async (_, { where }, context) => {
      try {
        const { userId, role } = userAuth(context);
        const { status, titles_in, ids_in, assigneeIds_in } = where || {};

        const whereCondition = {
          id: { in: ids_in },
          status: status,
          title: { in: titles_in },
          assigneeId: role == 'ADMIN' ? { in: assigneeIds_in } : userId,
        };
        if (role === 'USER') {
          whereCondition.createdBy = 'USER';
        }

        return await prisma.task.deleteMany({
          where: whereCondition,
        });
      } catch (error) {
        console.log('Error from deleteTask', error);
      }
    },
    login: async (parent, arg) => {
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
