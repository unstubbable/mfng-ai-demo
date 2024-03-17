'use server';

import {getMutableAIState, render} from 'ai/rsc';
import {OpenAI} from 'openai';
import * as React from 'react';
import {z} from 'zod';
import {type UserInput, fromUserInput} from './ai-state.js';
import type {AI, UIStateItem} from './ai.js';
import {imageSearchParams, searchImages} from './google-image-search.js';
import {ImageSelector} from './image-selector.js';
import {createImageSet, serializeImageSets} from './image-set.js';
import {LoadingIndicator} from './loading-indicator.js';
import {Markdown} from './markdown.js';
import {ProgressiveImage} from './progressive-image.js';

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
        content: `You are a chat assistant with a focus on images (photos, paintaings, cliparts, animated gifs, etc.).

        A user might ask for images of any kind (only safe for work, though!) and you search for them and show them, using the input of the user for the various search parameters.

        Use markdown in your messages if it improves how you can structure a response, highlight certain parts (especially the discussed subject's name should be strong), or to add links to other websites. Don't include images in markdown though, use the dedicated function instead.

        Never ask the user whether they want to see images of the discussed subject, always show them unprompted.

        Before showing images of a certain artist it might make sense to introduce them to the user first, with a couple of words.
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
      search_and_show_images: {
        description: `Search for images and show them.

        When searching for artists, it might be helpful to put the medium into the query along with the artist's name (e.g. "paintings", "photos")

        If the images to search for are distinctly different from each other (e.g. two different, titled paintings by the same artist), split it the search up into multiple search parameter sets.

        Select three images overall, unless the user asks for more or less.

        Never call the function more than once in a message, instead use multiple searches within the same function call.
        `,
        parameters: z.object({
          loadingText: z
            .string()
            .describe(
              `A short text to show to the user while the image search is running.`,
            ),
          searches: z.array(
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
          ),
        }),
        async *render({loadingText, searches: searchParamsList}) {
          console.log(`search params`, searchParamsList);

          const text = lastTextContent ? (
            <div>
              <Markdown text={`${lastTextContent}`} />
            </div>
          ) : undefined;

          yield (
            <div className="space-y-3">
              {text}
              <p>{loadingText}</p>
            </div>
          );

          const imageSets = await Promise.all(
            searchParamsList.map(
              async ({searchParams, title, notFoundMessage, errorMessage}) =>
                createImageSet({
                  searchResult: await searchImages(searchParams),
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
              content: serializeImageSets(imageSets),
            },
          ]);

          return (
            <div className="space-y-4">
              {text}
              <div className="space-y-3">
                {imageSets.map((imageSet) => (
                  <React.Fragment key={imageSet.title}>
                    <h4 className="text-l font-bold">{imageSet.title}</h4>
                    {imageSet.status === `found` ? (
                      imageSet.images.map(
                        ({thumbnailUrl, url, width, height}) => (
                          <ImageSelector key={thumbnailUrl} url={url}>
                            <ProgressiveImage
                              thumbnailUrl={thumbnailUrl}
                              url={url}
                              width={width}
                              height={height}
                              alt={imageSet.title}
                            />
                          </ImageSelector>
                        ),
                      )
                    ) : (
                      <p className="text-sm">
                        <em>
                          {imageSet.status === `not-found`
                            ? imageSet.notFoundMessage
                            : imageSet.errorMessage}
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
