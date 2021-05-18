import Feature from 'ol/Feature';
import { ProjectionLike } from 'ol/proj';

export interface ISearchResult {
  name: string;
  type?: string;
  feature?: Feature;
  id?: string;
  comment?: string;
  score?: number;
}

export interface ISearchProvider {
  search: (txt: string, targetProjection: ProjectionLike) => Promise<ISearchResult[]>;
}
