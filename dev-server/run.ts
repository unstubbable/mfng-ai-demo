import path from 'path';
import {serve} from '@hono/node-server';
import {serveStatic} from '@hono/node-server/serve-static';
import {Hono} from 'hono';
import {compress} from 'hono/compress';
import talkbackModule from 'talkback';
import {authMiddleware} from './auth-middleware.js';
import './stub-awslambda.js';

// @ts-ignore
const handlerModule = await import(`../dist/handler/index.js`);
const {app: handlerApp} = handlerModule as {app: Hono};
const app = new Hono();
const staticMiddleware = serveStatic({root: `dist/static`});

app.use(authMiddleware);
app.get(compress());
app.use(`/favicon.ico`, staticMiddleware);
app.use(`/robots.txt`, staticMiddleware);
app.use(`/client/*`, staticMiddleware);
app.route(`/`, handlerApp);

serve({fetch: app.fetch, port: 3000}, ({address, port}) => {
  const serverUrl = `http://${address.replace(`0.0.0.0`, `localhost`)}:${port}`;

  return console.log(`Started dev server at ${serverUrl}`);
});

if (process.env.OPENAI_BASE_URL?.startsWith(`http://localhost`)) {
  const {port} = new URL(process.env.OPENAI_BASE_URL);

  // hacky kind of es module interop
  const talkback = talkbackModule as unknown as typeof talkbackModule.default;

  const talkbackServer = talkback({
    host: `https://api.openai.com`,
    record: talkback.Options.RecordMode.NEW,
    port: parseInt(port, 10),
    path: path.join(import.meta.dirname, `tapes/openai`),
    summary: false,
    ignoreHeaders: [`user-agent`],
  });

  await talkbackServer.start(() => console.log(`Talkback server started`));
}
