'use client';

import type {StreamableValue} from 'ai/rsc';
import {useStreamableValue} from 'ai/rsc';
import * as React from 'react';

export function BotMessage({
  textStream,
}: {
  textStream: StreamableValue;
}): React.ReactNode {
  const [text] = useStreamableValue(textStream);
  return <Message role="assistant">{text}</Message>;
}

export function Message({
  role,
  children,
}: {
  role: string;
  children: React.ReactNode;
}): React.ReactNode {
  return (
    <div className="flex flex-col gap-1 border-b p-2">
      <div className="flex flex-row justify-between">
        <div className="text-sm text-zinc-500">{role}</div>
      </div>
      {children}
    </div>
  );
}
