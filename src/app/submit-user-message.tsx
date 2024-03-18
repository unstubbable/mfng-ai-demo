'use server';

import {getMutableAIState, render} from 'ai/rsc';
import {OpenAI} from 'openai';
import * as React from 'react';
import {z} from 'zod';
import {type UserInput, fromUserInput} from './ai-state.js';
import type {AI, UIStateItem} from './ai.js';
import {imageSearchParams, searchImages} from './google-image-search.js';
import {
  createImageSearchResult,
  serializeImageSearchResults,
} from './image-search-utils.js';
import {ImageSelector} from './image-selector.js';
import {LoadingIndicator} from './loading-indicator.js';
import {Markdown} from './markdown.js';
import {ProgressiveImage} from './progressive-image.js';
import {UserChoiceButton} from './user-choice-button.js';

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

// eslint-disable-next-line @typescript-eslint/require-await
export async function submitUserMessage(
  userInput: UserInput,
): Promise<UIStateItem> {
  const aiState = getMutableAIState<typeof AI>();

  aiState.update([...aiState.get(), fromUserInput(userInput)]);

  let lastTextContent: string | undefined;

  const ui = render({
    model: `gpt-4-turbo-preview`,
    // @ts-expect-error
    provider: openai,
    initial: <LoadingIndicator />,
    messages: [
      {
        role: `system`,
        content: `You are a chat assistant with a focus on images (photos, paintings, cliparts, animated gifs, etc.).

        A user might ask for images of any kind (only safe for work, though!) and you search for them and show them, using the input of the user for the various search parameters.

        Always prefer to show specific titled art pieces. If in doubt, just pick some that you know.

        When it comes to art, try to show known images to the user with their title. Think about it step by step to come up with specific search queries. E.g. first select a style, then select an artist for that style, and then search for the specific painting (e.g. surrealism -> Dalí -> The Persistence of Memory -> query terms: ["Salvador Dalí", "The Persistence of Memory"]). Do this process a couple of times to come up with a diverse set of images in one single message.

        Use markdown in your messages if it improves how you can structure a response, highlight certain parts (especially the discussed subject's name/title should be strong), or to add links to other websites.

        Don't include images in markdown, use the dedicated tool instead.

        Never ask the user whether they want to see images of the discussed subject, always show them unprompted.

        Before showing images of a certain artist it might make sense to introduce them to the user first, with a couple of words.

        The user can also select an image if they want to know more about it.

        When asking the user a question, you may present them with options to choose from.

        Use the provided tools to show an interactive UI, along with your textual messages.
        `,
      },
      ...aiState.get(),
    ],
    text: ({content, done}) => {
      lastTextContent = content;

      if (done) {
        aiState.done([...aiState.get(), {role: `assistant`, content}]);
      }

      return <Markdown text={content} />;
    },
    tools: {
      get_choice_from_user: {
        description: `Show a UI to let the user choose between several options`,
        parameters: z.object({
          intro: z
            .string()
            .describe(
              `An introduction text that explains the options, or just poses the question if it wasn't asked before. Markdown allowed.`,
            ),
          options: z.array(
            z.object({
              id: z
                .string()
                .describe(
                  `A short technical ID that's unique among all options.`,
                ),
              label: z.string()
                .describe(`A short label for a UI element that the user can use to select the option.

                  If you're asking a yes/no question, prefer verbose labels, e.g. "Yes, I want to see them"/"No, I'm good" over "yes"/"no".`),
            }),
          ),
        }),
        render({intro, options}) {
          console.log(`get_choice_from_user`, options);

          if (lastTextContent) {
            aiState.update((prevAiState) => [
              ...prevAiState,
              {role: `assistant`, content: lastTextContent!},
            ]);
          }

          aiState.done([
            ...aiState.get(),
            {
              role: `function`,
              name: `get_choice_from_user`,
              content: JSON.stringify({options}),
            },
          ]);

          return (
            <div className="space-y-4">
              {lastTextContent && (
                <div>
                  <Markdown text={lastTextContent} />
                </div>
              )}
              <div>
                <Markdown text={intro} />
              </div>
              <div className="mb-3 space-y-2 last:mb-0">
                {options.map(({id, label}) => (
                  <UserChoiceButton key={id} optionId={id}>
                    {label}
                  </UserChoiceButton>
                ))}
              </div>
            </div>
          );
        },
      },
      search_and_show_images: {
        description: `Search for images and show them.

        When searching for artists or styles (but not for specific art pieces), it might be helpful to put the medium into the query along with the artist's or styles' name (e.g. "paintings", "photos").

        If the images to search for are distinctly different from each other (e.g. two different, titled paintings by the same artist), split the search up into multiple search parameter sets.

        Select three images overall, unless the user asks for more or less. When searching for a specific artwork, select only one image.

        Never call the function more than once in a message, instead use multiple searches within the same function call.
        `,
        parameters: z.object({
          loadingText: z
            .string()
            .describe(
              `A short text to show to the user while the image search is running.`,
            ),
          searches: z
            .array(
              z.object({
                title: z
                  .string()
                  .describe(
                    `The title can be used as an alt attribute or headline when showing images.`,
                  ),
                notFoundMessage: z
                  .string()
                  .describe(
                    `An error message to show to the user when no images were found.`,
                  ),
                errorMessage: z
                  .string()
                  .describe(
                    `An error message to show to the user when the search errored, most likely due to the search quota being exceeded for the current time period.`,
                  ),
                searchParams: imageSearchParams,
              }),
            )
            .describe(`Use multiple sets of search parameters if needed.`),
        }),
        async *render({loadingText, searches: searchParamsList}) {
          console.log(`search_and_show_images`, searchParamsList);

          const text = lastTextContent ? (
            <div>
              <Markdown text={lastTextContent} />
            </div>
          ) : undefined;

          yield (
            <div className="space-y-3">
              {text}
              <p>{loadingText}</p>
            </div>
          );

          const imageSearchResults = await Promise.all(
            searchParamsList.map(
              async ({searchParams, title, notFoundMessage, errorMessage}) =>
                createImageSearchResult({
                  response: await searchImages(searchParams),
                  title,
                  notFoundMessage,
                  errorMessage,
                }),
            ),
          );

          if (lastTextContent) {
            aiState.update((prevAiState) => [
              ...prevAiState,
              {role: `assistant`, content: lastTextContent!},
            ]);
          }

          aiState.done([
            ...aiState.get(),
            {
              role: `function`,
              name: `search_and_show_images`,
              content: serializeImageSearchResults(imageSearchResults),
            },
          ]);

          return (
            <div className="space-y-4">
              {text}
              <div className="space-y-3">
                {imageSearchResults.map((result) => (
                  <React.Fragment key={result.title}>
                    <h4 className="text-l font-bold">{result.title}</h4>
                    {result.status === `found` ? (
                      result.images.map(
                        ({thumbnailUrl, url, width, height}) => (
                          <ImageSelector key={thumbnailUrl} url={url}>
                            <ProgressiveImage
                              thumbnailUrl={thumbnailUrl}
                              url={url}
                              width={width}
                              height={height}
                              alt={result.title}
                            />
                          </ImageSelector>
                        ),
                      )
                    ) : (
                      <p className="text-sm">
                        <em>
                          {result.status === `not-found`
                            ? result.notFoundMessage
                            : result.errorMessage}
                        </em>
                      </p>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          );
        },
      },
    },
  });

  return {id: Date.now(), role: `assistant`, display: ui};
}
