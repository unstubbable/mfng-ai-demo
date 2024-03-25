import type {LambdaFunctionURLEvent} from 'aws-lambda';
import type {MiddlewareHandler} from 'hono';

export const requestBodyMiddleware: MiddlewareHandler<{
  Bindings: {
    // Not available in dev server.
    event?: LambdaFunctionURLEvent;
  };
}> = async (context, next) => {
  const {req, env} = context;
  const {event} = env;

  if (req.method === `POST` && event?.body) {
    const bodyByteLength = Buffer.byteLength(
      event.body,
      event.isBase64Encoded ? `base64` : `utf-8`,
    );

    if (bodyByteLength > 10240) {
      console.warn(`Request body too large`);

      return context.text(`Content Too Large`, 413);
    }
  }

  return next();
};
