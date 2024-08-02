'use client';

import {generateId} from 'ai';
import {useActions, useUIState} from 'ai/rsc';
import {Fragment, useState} from 'react';
import * as React from 'react';
import type {AI} from './actions.js';
import {Message} from './message.js';

export default function Home(): React.ReactNode {
  const [input, setInput] = useState(``);
  const [messages, setMessages] = useUIState<typeof AI>();
  const {submitUserMessage} = useActions<typeof AI>();

  const handleSubmission = async () => {
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: generateId(),
        display: <Message role="user">{input}</Message>,
      },
    ]);

    const response = await submitUserMessage(input);
    setMessages((currentMessages) => [...currentMessages, response]);
    setInput(``);
  };

  return (
    <div className="flex flex-col-reverse">
      <div className="flex w-full flex-row gap-2 bg-zinc-100 p-2">
        <input
          className="w-full bg-zinc-100 p-2 outline-none"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask a question"
          onKeyDown={(event) => {
            if (event.key === `Enter`) {
              void handleSubmission();
            }
          }}
        />
        <button
          className="rounded-md bg-zinc-900 p-2 text-zinc-100"
          onClick={handleSubmission}
        >
          Send
        </button>
      </div>

      <div className="flex h-[calc(100dvh-56px)] flex-col overflow-y-scroll">
        <div>
          {messages.map((message) => (
            <Fragment key={message.id}>{message.display}</Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
