import {useActions, useUIState} from 'ai/rsc';
import * as React from 'react';
import type {UserInputAction} from './ai-state.js';
import type {AI} from './ai.js';
import {getErrorMessage} from './get-error-message.js';
import {LoadingIndicator} from './loading-indicator.js';

export function useSubmitUserMessage(
  action: UserInputAction,
  content: string,
): () => void {
  const [, setMessages] = useUIState<typeof AI>();
  const {submitUserMessage} = useActions<typeof AI>();

  return React.useCallback(async () => {
    const optimisticMessageId = Date.now();

    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: optimisticMessageId,
        role: `assistant`,
        display: <LoadingIndicator />,
      },
    ]);

    document.body.scrollIntoView({block: `end`, behavior: `smooth`});

    try {
      const message = await submitUserMessage({action, content});

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
  }, [submitUserMessage, action, content]);
}
