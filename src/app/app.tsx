import * as React from 'react';
import {AI} from './actions.js';
import Page from './page.js';

export function App(): JSX.Element {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>AI SDK with Generative UI on AWS</title>
        <meta
          name="description"
          content="A demo showcasing a chat assistant capable of displaying images of various
kinds, using the Vercel AI SDK 3.2 with Generative UI, powered by React Server Components."
        />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      </head>
      <body className="bg-zinc-100">
        <AI>
          <Page />
        </AI>
      </body>
    </html>
  );
}
