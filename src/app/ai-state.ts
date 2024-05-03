import type {CoreMessage} from 'ai';

export type UserInputAction = 'choose-option' | 'message' | 'select-image';

export interface UserInput {
  readonly action: UserInputAction;
  readonly content: string;
}

export function fromUserInput(userInput: UserInput): CoreMessage {
  const {action, content} = userInput;

  if (action === `message`) {
    return {role: `user`, content};
  }

  return {
    role: `user`,
    content: getUserActionContent(action, content),
  };
}

function getUserActionContent(
  action: 'choose-option' | 'select-image',
  content: string,
): string {
  switch (action) {
    case `choose-option`:
      return `I choose: ${content}`;
    case `select-image`:
      return `I want to know more about the image ${content}. Keep it short.`;
  }
}
