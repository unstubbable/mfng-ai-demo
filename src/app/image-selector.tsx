'use client';

import {useActions, useUIState} from 'ai/rsc';
import * as React from 'react';
import type {AI} from './ai.js';
import {getErrorMessage} from './get-error-message.js';

export type ImageSelectorProps = React.PropsWithChildren<{
  readonly url: string;
}>;

export function ImageSelector({
  children,
  url,
}: ImageSelectorProps): React.ReactNode {
  const [, setMessages] = useUIState<typeof AI>();
  const {submitUserMessage} = useActions<typeof AI>();

  const formAction = async () => {
    try {
      const message = await submitUserMessage(
        `Tell me more about image ${url}, keep it short.`,
      );

      setMessages((prevMessages) => [...prevMessages, message]);
    } catch (error) {
      console.error(error);
      const errorMessage = getErrorMessage(error);

      setMessages((prevMessages) => [
        ...prevMessages,
        {id: Date.now(), role: `error`, display: <p>{errorMessage}</p>},
      ]);
    }

    document.body.scrollIntoView({block: `end`, behavior: `smooth`});
  };

  return <button formAction={formAction}>{children}</button>;
}
