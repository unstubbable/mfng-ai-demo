import {serve} from '@hono/node-server';
import {serveStatic} from '@hono/node-server/serve-static';
import {Hono} from 'hono';
import {compress} from 'hono/compress';
import {authMiddleware} from './auth-middleware.js';
import './stub-awslambda.js';

// @ts-ignore
const handlerModule = await import(`../dist/handler/index.js`);
const {app: handlerApp} = handlerModule as {app: Hono};
const app = new Hono();
const staticMiddleware = serveStatic({root: `dist/static`});

app.use(authMiddleware);
app.use(compress());
app.use(`/favicon.ico`, staticMiddleware);
app.use(`/robots.txt`, staticMiddleware);
app.use(`/client/*`, staticMiddleware);
app.route(`/`, handlerApp);

serve({fetch: app.fetch, port: 3000}, ({address, port}) => {
  const serverUrl = `http://${address.replace(`0.0.0.0`, `localhost`)}:${port}`;

  return console.log(`Started dev server at ${serverUrl}`);
});
