import type {Image, ImageSearchResponse} from './google-image-search.js';

export type ImageSearchResult =
  | {status: 'error'; title: string; errorMessage: string}
  | {status: 'not-found'; title: string; notFoundMessage: string}
  | {status: 'found'; images: Image[]; title: string};

export interface CreateImageSearchResultOptions {
  readonly response: ImageSearchResponse;
  readonly title: string;
  readonly notFoundMessage: string;
  readonly errorMessage: string;
}

export function createImageSearchResult(
  options: CreateImageSearchResultOptions,
): ImageSearchResult {
  const {response, title, notFoundMessage, errorMessage} = options;

  if (`error` in response) {
    console.error(
      `Error searching for images:`,
      JSON.stringify(response.error),
    );

    if (response.error.code === 400) {
      console.warn(
        `The env variables GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_SEARCH_ENGINE_ID must be provided.`,
      );
    }

    return {status: `error`, title, errorMessage};
  }

  return response.length === 0
    ? {status: `not-found`, title, notFoundMessage}
    : {status: `found`, images: response, title};
}

export function prepareImageSearchResultForAiState(
  imageSearchResult: ImageSearchResult,
): unknown {
  const {status, title} = imageSearchResult;

  if (imageSearchResult.status === `found`) {
    const {images} = imageSearchResult;

    return {
      status,
      title,
      images: images.map(({url, website}) => ({url, website})),
    };
  }

  return {status, title};
}
