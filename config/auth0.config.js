import dotenv from 'dotenv';
import { ManagementClient } from 'auth0';

dotenv.config();

const auth0Client = new ManagementClient({
    domain: process.env.AUTH0_DOMAIN,
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
});

export default auth0Client;