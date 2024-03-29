'use client';

import {useActions, useUIState} from 'ai/rsc';
import * as React from 'react';
import Textarea from 'react-textarea-autosize';
import type {AI} from './ai.js';
import {ChatMessage} from './chat-message.js';
import {getErrorMessage} from './get-error-message.js';
import {LoadingIndicator} from './loading-indicator.js';
import {useEnterSubmit} from './use-enter-submit.js';

export function Chat({children}: React.PropsWithChildren): React.ReactNode {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = React.useState(``);
  const [isPending, startTransition] = React.useTransition();
  const [messages, setMessages] = useUIState<typeof AI>();
  const {submitUserMessage} = useActions<typeof AI>();
  const {formRef, handleKeyDown} = useEnterSubmit();

  const [optimisticMessages, setOptimisticMessages] =
    React.useOptimistic(messages);

  const handleSubmit = (
    event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) => {
    event.preventDefault();

    const {submitter} = event.nativeEvent;

    const examplePrompt =
      submitter instanceof HTMLButtonElement &&
      submitter.name === `example-prompt`
        ? submitter.value
        : undefined;

    if (examplePrompt && textareaRef.current) {
      setInputValue(examplePrompt);
    }

    const userInput = examplePrompt ?? inputValue;

    if (!userInput || isPending) {
      return;
    }

    setMessages((prevMessages) => [
      ...prevMessages,
      {id: Date.now(), role: `user`, display: <div>{userInput}</div>},
    ]);

    setInputValue(``);
    document.body.scrollIntoView({block: `end`, behavior: `smooth`});

    startTransition(async () => {
      setOptimisticMessages((prevMessages) => [
        ...prevMessages,
        {id: 0, role: `assistant`, display: <LoadingIndicator />},
      ]);

      try {
        const message = await submitUserMessage({
          action: `message`,
          content: userInput,
        });

        setMessages((prevMessages) => [...prevMessages, message]);
      } catch (error) {
        console.error(error);
        const errorMessage = getErrorMessage(error);

        setMessages((prevMessages) => [
          ...prevMessages,
          {id: Date.now(), role: `error`, display: <p>{errorMessage}</p>},
        ]);
      }

      textareaRef.current?.focus();
    });
  };

  return (
    <form
      ref={formRef}
      className="mx-auto flex max-w-3xl flex-col space-y-3 pb-36"
      onSubmit={handleSubmit}
    >
      {optimisticMessages.length === 0 && children}

      {optimisticMessages.map((message) => (
        <ChatMessage key={message.id} role={message.role}>
          {message.display}
        </ChatMessage>
      ))}

      <div className="fixed bottom-0 left-0 right-0 w-full">
        <div className="mx-auto flex max-w-3xl border-t bg-white p-4 shadow-lg md:rounded-t-xl md:border md:p-6">
          <Textarea
            ref={textareaRef}
            className="flex-1 resize-none rounded-md bg-zinc-100 p-2 outline-cyan-500"
            placeholder="Send a message."
            rows={1}
            autoFocus
            maxRows={6}
            value={inputValue}
            onChange={(event) => {
              setInputValue(event.target.value);
            }}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            autoComplete="off"
            data-1p-ignore
          />
        </div>
      </div>
    </form>
  );
}
