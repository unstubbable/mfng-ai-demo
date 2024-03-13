import * as React from 'react';
import {AI} from './ai.js';
import {Chat} from './chat.js';
import {Header} from './header.js';

export function App(): JSX.Element {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>AI SDK with Generative UI on AWS</title>
        <link rel="icon" href="/client/favicon.ico" type="image/x-icon" />
      </head>
      <body>
        <Header />
        <main className="m-3">
          <AI>
            <Chat />
          </AI>
        </main>
      </body>
    </html>
  );
}
