'use client';

import * as React from 'react';
import {useSubmitUserMessage} from './use-submit-user-message.js';

export type ImageSelectorProps = React.PropsWithChildren<{
  readonly url: string;
}>;

export function ImageSelector({
  children,
  url,
}: ImageSelectorProps): React.ReactNode {
  const handleClick = useSubmitUserMessage(`select-image`, url);

  return (
    <button
      className="cursor-pointer outline-cyan-500"
      type="button"
      onClick={handleClick}
    >
      {children}
    </button>
  );
}
