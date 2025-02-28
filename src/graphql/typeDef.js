const typeDefs = `
    enum Role{
        USER
        ADMIN
    }

    scalar Date

    type User {
        id: ID!,
        name: String,
        email: String!,
        role: Role!,
        tasks: [Task]
    }
    
    type Task {
        id: ID!,
        title: String!,
        status: String!,
        assignee: User!,
        createdAt: Date!
    }

    type Query {
        getAllUsers: [User]
        getUserById(id: ID!): User
        getAllTasks: [Task]
        getTaskById(id: ID!): Task
    }

    type Mutation {
        createUser(email: String!, password: String!, name: String, role: Role!): User
        updateUser(id: ID!, name: String): User
        deleteUser(id: ID!): User
        createTask(title: String!, userId: ID!): Task
        updateTask(id: ID!, title: String!): Task
        deleteTask(id: ID!): Task
    }
`;

export default typeDefs