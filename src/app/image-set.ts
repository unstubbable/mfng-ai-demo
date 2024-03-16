import type {Image, ImageSearchResult} from './google-image-search.js';

export type ImageSet =
  | {status: 'error'; title: string; errorMessage: string}
  | {status: 'not-found'; title: string; notFoundMessage: string}
  | {status: 'found'; images: Image[]; title: string};

export interface CreateImageSetOptions {
  readonly searchResult: ImageSearchResult;
  readonly title: string;
  readonly notFoundMessage: string;
  readonly errorMessage: string;
}

export function createImageSet(options: CreateImageSetOptions): ImageSet {
  const {searchResult, title, notFoundMessage, errorMessage} = options;

  if (`error` in searchResult) {
    console.error(
      `Error searching for images:`,
      JSON.stringify(searchResult.error),
    );

    return {status: `error` as const, title, errorMessage};
  }

  return searchResult.length === 0
    ? {status: `not-found` as const, title, notFoundMessage}
    : {status: `found` as const, images: searchResult, title};
}

export function serializeImageSets(imageSets: ImageSet[]): string {
  return JSON.stringify(imageSets.map(reduceImageSet));
}

function reduceImageSet(imageSet: ImageSet) {
  const {status, title} = imageSet;

  if (imageSet.status === `found`) {
    const {images} = imageSet;

    return {
      status,
      title,
      images: images.map(({url, website}) => ({url, website})),
    };
  }

  return {status, title};
}
