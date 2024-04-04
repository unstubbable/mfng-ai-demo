import * as React from 'react';
import {type ImageSearchParams, searchImages} from './google-image-search.js';
import {
  createImageSearchResult,
  prepareImageSearchResultForAiState,
} from './image-search-result.js';
import {ImageSelector} from './image-selector.js';
import {ProgressiveImage} from './progressive-image.js';

export interface ImagesProps {
  readonly title: string;
  readonly notFoundMessage: string;
  readonly errorMessage: string;
  readonly searchParams: ImageSearchParams;
  readonly onDataFetched: (dataForAiState: unknown) => void;
}

type ImagesContainerProps = React.PropsWithChildren<{
  readonly title: string;
}>;

function ImagesContainer({title, children}: ImagesContainerProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-l font-bold">{title}</h4>
      {children}
    </div>
  );
}

export async function Images({
  title,
  notFoundMessage,
  errorMessage,
  searchParams,
  onDataFetched,
}: ImagesProps): Promise<React.ReactElement> {
  const response = await searchImages(searchParams);

  const result = createImageSearchResult({
    response,
    title,
    notFoundMessage,
    errorMessage,
  });

  onDataFetched(prepareImageSearchResultForAiState(result));

  if (result.status !== `found`) {
    const message =
      result.status === `not-found`
        ? result.notFoundMessage
        : result.errorMessage;

    return (
      <ImagesContainer title={result.title}>
        <p className="text-sm">
          <em>{message}</em>
        </p>
      </ImagesContainer>
    );
  }

  return (
    <ImagesContainer title={result.title}>
      {result.images.map(({thumbnailUrl, url, width, height}) => (
        <ImageSelector key={thumbnailUrl} url={url}>
          <ProgressiveImage
            thumbnailUrl={thumbnailUrl}
            url={url}
            width={width}
            height={height}
            alt={result.title}
          />
        </ImageSelector>
      ))}
    </ImagesContainer>
  );
}
