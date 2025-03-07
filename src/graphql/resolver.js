import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { adminAuth, userAuth } from '../utils/requireAuth.js';
import { putObjectURL } from '../utils/uploadImg.js';

dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET || 'secretKey';

const prisma = new PrismaClient({
  log: ["info", "query"]
});

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
        const users = await prisma.user.findMany({
          where: {
            // role,
            // id: { in: ids_in },
            name: { in: names_in },
            // tasks: userWithoutTasks
            //   ? { none: {} }
            //   : status
            //   ? { some: { status: status } }
            //   : undefined,
            // tasks : { every: { status: "completed" } }
          },
          // select: {
          //   id: true,
          //   email: true,
          //   // tasks: {
          //   //   where: { status: "completed" },
          //   //   select: { id: true, title: true },
          //   // },
          // },
          include: {
            tasks: {
              where: { status: "completed" },
              select: { id: true, title: true },
            },
          },
          take: limit,
          skip: offset,
          orderBy: order,
        });
        if (users.length === 0) throw new Error('Failed to fetch user');
        console.log("Users:\n",JSON.stringify(users, null, 2))
        
        // console.log("Users:\n")
        return users;
      } catch (error) {
        console.log('Error from getUsers', error);
        throw new Error('Failed to fetch user');
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
        throw new Error('Failed to fetch user data');
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
        const tasks = await prisma.task.findMany({
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
        if (!tasks.length) throw new Error('Task not found');
        return tasks;
      } catch (error) {
        console.log('Error from getTasks', error);
        throw new Error('Failed to fetch task');
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

        const tasks = await prisma.task.findMany({
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
        if (!tasks.length) throw new Error('Task not found');
        return tasks;
      } catch (error) {
        console.log('Error from getLoggedTask', error);
        throw new Error('Failed to fetch task');
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
        const user = await prisma.user.create({
          data: { email, password: encryptPass, name, role },
        });
        if (!user) throw new Error('Failed to create user');
        return user;
      } catch (error) {
        console.log('Error from createUser', error);
        throw new Error('Failed to create user');
      }
    },

    updateUser: async (_, { id, input, imgUpdate }, context) => {
      try {
        if (!context.user) throw new Error('Unauthorized');
        if (context.user.role !== 'ADMIN' && context.user.id !== id)
          throw new Error('Unauthorized: You can only update your own profile.');

        const { name, password, email } = input || {};
        let updatedData = {};

        if (imgUpdate) {
          const img = await putObjectURL(`${id}.jpg`, 'image/jpg');
          console.log(img);
          updatedData.profilePic = img.split('.jpg')[0] + '.jpg';
        }
        if (name) updatedData.name = name;
        if (password) updatedData.password = await bcrypt.hash(password, 10);
        if (email) updatedData.email = email;

        const user = await prisma.user.update({
          where: { id: id },
          data: updatedData,
        });
        if (!user) throw new Error('Failed to update user');
        return user;
      } catch (error) {
        console.log('Error from updateUser', error);
        throw new Error('Failed to update user');
      }
    },

    deleteUser: async (_, { input }, context) => {
      try {
        adminAuth(context);
        const { ids_in, names_in, userWithoutTasks } = input || {};
        const count = await prisma.user.deleteMany({
          where: {
            id: { in: ids_in },
            name: { in: names_in },
            tasks: userWithoutTasks ? { none: {} } : undefined,
          },
        });
        if (!count) throw new Error('Failed to delete user');
        return count;
      } catch (error) {
        console.log('Error from deleteUser', error);
        throw new Error('Failed to delete user');
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
          userData.createdBy = 'ADMIN';
          createData.push(userData);
        }

        const count = await prisma.task.createMany({
          data: createData,
        });
        if (!count) throw new Error('Failed to create Task');
        return count;
      } catch (error) {
        console.log('Error from addTask', error);
        throw new Error('Failed to create task');
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
        createData.createdBy = 'USER';

        const task = await prisma.task.create({
          data: createData,
        });
        if (!task) throw new Error('Failed to create task');
        return task;
      } catch (error) {
        console.log('Error from createTask', error);
        throw new Error('Failed to create task');
      }
    },

    updateTask: async (_, { taskId, input }, context) => {
      try {
        const { userId, role } = userAuth(context);
        const { title, description, status } = input || {};
        let updatedData = {};
        if (description) updatedData.description = description;
        if (status) updatedData.status = status;
        if (title) updatedData.title = title;
        let whereCondition = {};
        whereCondition.id = taskId;
        if (role === 'USER') {
          whereCondition.assigneeId = userId;
        }
        const task = await prisma.task.update({
          where: whereCondition,
          data: updatedData,
        });
        if (!task) throw new Error('Failed to update task');
        return task;
      } catch (error) {
        console.log('Error from updateTask', error);
        throw new Error('Failed to update task');
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
        const count = await prisma.task.deleteMany({
          where: whereCondition,
        });
        if (!count) throw new Error('Failed to delete task');
        return count;
      } catch (error) {
        console.log('Error from deleteTask', error);
        throw new Error('Failed to delete task');
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

        const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
        return token;
      } catch (error) {
        console.log(error);
        return `Failed to login. ${error}`;
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
        return {
          success: false,
          msg: 'Failed to get user details',
          error: error.message || 'An unexpected error occurred',
          data: [],
        };
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
        return {
          success: false,
          msg: 'Failed to get task details',
          error: error.message || 'An unexpected error occurred',
          data: [],
        };
      }
    },
  },
};

export default resolvers;
