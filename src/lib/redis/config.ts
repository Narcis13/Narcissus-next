import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;

let redisConnection: Redis | null = null;

if (redisUrl) {
  redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: {},
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError: (err) => {
    const targetError = "READONLY";
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
});

  redisConnection.on("connect", () => {
    console.log("Connected to Upstash Redis");
  });

  redisConnection.on("error", (err) => {
    // Only log meaningful errors, not connection resets
    if (err.message && !err.message.includes('ECONNRESET')) {
      console.error("Redis connection error:", err.message);
    }
  });
} else {
  console.warn("REDIS_URL is not defined. Redis features will be disabled.");
}

export { redisConnection };
export default redisConnection;