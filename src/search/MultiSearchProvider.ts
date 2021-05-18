import { ISearchProvider, ISearchResult } from './ISearchProvider';
import { ProjectionLike } from 'ol/proj';

export class MultiSearchProvider implements ISearchProvider {
  private providers: ISearchProvider[] = [];

  public constructor(providers: ISearchProvider[]) {
    this.providers = providers;
  }

  public search(txt: string, targetProjection: ProjectionLike): Promise<ISearchResult[]> {
    const promises: Promise<ISearchResult[]>[] = [];
    for (const provider of this.providers) {
      promises.push(provider.search(txt, targetProjection));
    }

    return Promise.all(promises).then((multiSearchResults) => {
      const aggSearchResults: ISearchResult[] = [];
      for (const searchResults of multiSearchResults) {
        aggSearchResults.push(...searchResults);
      }
      return aggSearchResults;
    });
  }
}
