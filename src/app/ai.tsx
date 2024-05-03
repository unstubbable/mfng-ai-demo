import type {CoreMessage} from 'ai';
import {createAI} from 'ai/rsc';
import type * as React from 'react';
import {submitUserMessage} from './submit-user-message.js';

export interface UIStateItem {
  readonly id: number;
  readonly role: 'user' | 'assistant' | 'error';
  readonly display: React.ReactNode;
}

const initialAIState: CoreMessage[] = [];
const initialUIState: UIStateItem[] = [];

export const AI = createAI({
  actions: {submitUserMessage},
  initialUIState,
  initialAIState,
});
