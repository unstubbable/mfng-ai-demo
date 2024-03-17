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

  const handleClick = async () => {
    const optimisticMessageId = Date.now();

    setMessages((prevMessages) => [
      ...prevMessages,
      {id: optimisticMessageId, role: `assistant`, display: <p>&hellip;</p>},
    ]);

    document.body.scrollIntoView({block: `end`, behavior: `smooth`});

    try {
      const message = await submitUserMessage({action: `select-image`, url});

      setMessages((prevMessages) => [
        ...prevMessages.filter(({id}) => id !== optimisticMessageId),
        message,
      ]);
    } catch (error) {
      console.error(error);
      const errorMessage = getErrorMessage(error);

      setMessages((prevMessages) => [
        ...prevMessages.filter(({id}) => id !== optimisticMessageId),
        {id: Date.now(), role: `error`, display: <p>{errorMessage}</p>},
      ]);
    }
  };

  return (
    <button className="cursor-pointer" type="button" onClick={handleClick}>
      {children}
    </button>
  );
}
