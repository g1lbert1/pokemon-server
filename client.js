import redis from 'redis';

const client = redis.createClient();
await client.connect();
export default client;
