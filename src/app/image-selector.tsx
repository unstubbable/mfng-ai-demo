'use client';

import {useActions, useUIState} from 'ai/rsc';
import * as React from 'react';
import type {AI} from './ai.js';

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
        `Tell me more about image ${url}`,
      );

      setMessages((prevMessages) => [...prevMessages, message]);
    } catch (error) {
      console.error(error);
    }
  };

  return <button formAction={formAction}>{children}</button>;
}
