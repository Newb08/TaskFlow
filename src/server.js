import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import bodyParser from 'body-parser';
import typeDefs from './graphql/typeDef.js';
import resolvers from './graphql/resolver.js';
import getUser from './middleware/userAuthentication.js';

const app = express();

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

await server.start();
app.use(cors());
app.use(bodyParser.json());
app.use(
  '/graphql',
  expressMiddleware(server, {
    context: async ({ req }) => {
      console.log("Req", req.headers)
      const user = getUser(req);
      console.log(user);
      return { user };
    },
  }),
);

app.listen(3000, () => {
  console.log(`Server running at http://localhost:3000/graphql`);
});
