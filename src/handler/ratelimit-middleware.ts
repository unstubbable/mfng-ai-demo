import {Ratelimit} from '@upstash/ratelimit';
import {Redis} from '@upstash/redis';
import type {MiddlewareHandler} from 'hono';

let ratelimit: Ratelimit;

try {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.fixedWindow(10, `10 m`),
  });
} catch (error) {
  if (process.env.UPSTASH_REDIS_REST_URL) {
    console.error(error);
  } else {
    console.warn(
      `Unable to create Redis instance, no rate limits are applied.`,
    );
  }
}

export const ratelimitMiddleware: MiddlewareHandler = async (context, next) => {
  if (!ratelimit || context.req.method !== `POST`) {
    return next();
  }

  const address = context.req.header(`cloudfront-viewer-address`);

  if (!address) {
    console.warn(`cloudfront-viewer-address not provided`);

    return next();
  }

  try {
    const {success, reset, remaining} = await ratelimit.limit(address);
    console.debug(`Rate limit result`, {address, success, remaining});

    if (!success) {
      console.warn(`Too Many Requests by ${address}`);

      return context.text(`Too Many Requests`, 429, {
        'Retry-After': ((reset - Date.now()) / 1000).toFixed(),
      });
    }
  } catch (error) {
    console.error(error);
  }

  return next();
};
