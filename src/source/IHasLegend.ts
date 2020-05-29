import { ILayerLegend } from "./ILayerLegend";

export interface IHasLegend {
  legendByLayer: Record<string, ILayerLegend[]>;

  fetchLegend(): Promise<Record<string, ILayerLegend[]>>;
}
