import {createAI} from 'ai/rsc';
import type * as React from 'react';
import type {AIStateItem} from './ai-state.js';
import {submitUserMessage} from './submit-user-message.js';

export interface UIStateItem {
  readonly id: number;
  readonly role: 'user' | 'assistant' | 'error';
  readonly display: React.ReactNode;
}

const initialAIState: AIStateItem[] = [];
const initialUIState: UIStateItem[] = [];

export const AI = createAI({
  actions: {submitUserMessage},
  initialUIState,
  initialAIState,
});
