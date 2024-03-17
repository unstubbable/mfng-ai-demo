export type AIStateItem =
  | {
      readonly role: 'user' | 'assistant' | 'system';
      readonly content: string;
    }
  | {
      readonly role: 'function';
      readonly content: string;
      readonly name: string;
    };

export type UserInputAction = 'choose-option' | 'message' | 'select-image';

export interface UserInput {
  readonly action: UserInputAction;
  readonly content: string;
}

export function fromUserInput(userInput: UserInput): AIStateItem {
  const {action, content} = userInput;

  if (action === `message`) {
    return {role: `user`, content};
  }

  return {
    role: `assistant`,
    content: getAssistantStateContent(action, content),
  };
}

function getAssistantStateContent(
  action: 'choose-option' | 'select-image',
  content: string,
): string {
  switch (action) {
    case `choose-option`:
      return `[user has chosen: ${content}]`;
    case `select-image`:
      return `[user wants to know more about the image ${content}. keep it short.]`;
  }
}
