'use client';

import {clsx} from 'clsx';
import * as React from 'react';
import {useSubmitUserMessage} from './use-submit-user-message.js';

export interface UserChoiceButtonProps {
  readonly optionId: string;
  readonly children: React.ReactNode;
}

export function UserChoiceButton({
  children,
  optionId,
}: UserChoiceButtonProps): React.ReactNode {
  const [selected, setSelected] = React.useState(false);
  const submitUserMessage = useSubmitUserMessage(`choose-option`, optionId);

  const handleClick = () => {
    setSelected(true);
    submitUserMessage();
  };

  return (
    <button
      className="flex w-full items-center justify-between rounded bg-zinc-100 px-3 py-2 text-left text-black outline-cyan-500 hover:bg-zinc-200"
      onClick={handleClick}
    >
      {children}
      <span
        className={clsx(
          `text-2xl text-cyan-500`,
          selected ? `visible` : `invisible`,
        )}
      >
        ✓
      </span>
    </button>
  );
}
