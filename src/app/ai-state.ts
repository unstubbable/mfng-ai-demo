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

export type UserInput =
  | {
      readonly action: 'message';
      readonly content: string;
    }
  | {
      readonly action: 'select-image';
      readonly url: string;
    };

export function fromUserInput(userInput: UserInput): AIStateItem {
  switch (userInput.action) {
    case `select-image`:
      return {
        role: `assistant`,
        content: `[user wants to know more about the image ${userInput.url}. keep it short.]`,
      };
    case `message`:
      return {
        role: `user`,
        content: userInput.content,
      };
  }
}
