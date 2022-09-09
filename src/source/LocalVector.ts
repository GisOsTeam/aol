import OlFeature from 'ol/Feature';
import Wkt from 'ol/format/WKT';
import { Extent } from 'ol/extent';
import { LoadingStrategy } from 'ol/source/Vector';
import { all } from 'ol/loadingstrategy';
import { Projection } from 'ol/proj';
import { Vector, IVectorOptions } from './Vector';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { LayerType, LayerTypeEnum } from './types/layerType';

export interface ILocalVectorOptions extends IVectorOptions {
  initialFeatures?: any[];
}

export class LocalVector extends Vector {
  private wktFormat = new Wkt();

  protected oldProjectionCode: string;

  constructor(options: ILocalVectorOptions) {
    super({
      ...options,
      useSpatialIndex: true,
      strategy: (extent: Extent, resolution: number, projection: Projection): Extent[] => {
        if (this.oldProjectionCode !== this.actualProjectionCode) {
          this.reproj();
          this.oldProjectionCode = this.actualProjectionCode;
        }
        const origstrategy = options.strategy !== undefined ? options.strategy : all;
        return origstrategy.call(this, extent, resolution, projection);
      },
    });
    const initialFeatures = options.initialFeatures;
    options.initialFeatures = undefined;
    this.options = { ...options };
    if (this.options.snapshotable != false) {
      this.options.snapshotable = true;
    }
    if (this.options.listable != false) {
      this.options.listable = true;
    }
    if (initialFeatures != null) {
      // Load features from snapshot
      initialFeatures.forEach((initialFeature: any) => {
        const projectionCode = initialFeature.projectionCode;
        const wkt = initialFeature.wkt;
        const properties = initialFeature.properties;
        const geometry = this.wktFormat.readGeometry(wkt);
        const olFeature = new OlFeature(geometry);
        olFeature.setProperties(properties);
        (olFeature as any).originalProjectionCode = projectionCode;
        (olFeature as any).originalGeometry = geometry;
        (geometry as any).feature = olFeature;
        olFeature.once('change:geometry', this.handleChangeFeatureGeometry);
        geometry.once('change', this.handleChangeGeometry);
        this.addFeature(olFeature);
      });
    }
    this.on('addfeature', this.handleAddFeature);
  }

  public getSourceType(): SourceType {
    return SourceTypeEnum.LocalVector;
  }

  public getSourceOptions(): ILocalVectorOptions {
    const options = this.options as ILocalVectorOptions;
    const initialFeatures: any[] = [];
    this.forEachFeature((feature: OlFeature) => {
      const originalProjectionCode = (feature as any).originalProjectionCode;
      const originalGeometry = (feature as any).originalGeometry;
      const properties = { ...feature.getProperties() };
      properties.originalProjectionCode = undefined;
      properties.originalGeometry = undefined;
      properties.geometry = undefined;
      initialFeatures.push({
        projectionCode: originalProjectionCode,
        wkt: this.wktFormat.writeGeometry(originalGeometry),
        properties,
      });
    });
    options.initialFeatures = initialFeatures;
    return options;
  }

  public setSourceOptions(options: ILocalVectorOptions): void {
    this.options = { ...options };
  }

  public getLayerType(): LayerType {
    return LayerTypeEnum.Vector;
  }

  private reproj() {
    const features: OlFeature[] = [];
    const extents: [number, number, number, number][] = [];
    this.forEachFeature((feature: OlFeature) => {
      if (feature.getGeometry() != null) {
        if ((feature as any).originalProjectionCode == null) {
          (feature as any).originalProjectionCode = this.actualProjectionCode;
        }
        if ((feature as any).originalGeometry == null) {
          (feature as any).originalGeometry = feature.getGeometry();
        }
        const originalProjectionCode = (feature as any).originalProjectionCode;
        const originalGeometry = (feature as any).originalGeometry;
        if (originalProjectionCode != null && originalGeometry != null) {
          const geom = originalGeometry.clone();
          if (originalProjectionCode !== this.actualProjectionCode) {
            geom.transform((feature as any).originalProjectionCode, this.actualProjectionCode);
          }
          feature.set(feature.getGeometryName(), geom, true);
          const extent = geom.getExtent() as [number, number, number, number];
          extents.push(extent);
          features.push(feature);
        } else {
          const extent = feature.getGeometry().getExtent() as [number, number, number, number];
          extents.push(extent);
          features.push(feature);
        }
      }
      return null;
    });
    if ((this as any).featuresRtree_) {
      (this as any).featuresRtree_.clear();
      (this as any).featuresRtree_.load(extents, features);
    }
  }

  private setOriginal(olFeature: OlFeature) {
    if (olFeature.getGeometry() == null) {
      return;
    }
    const geometry = olFeature.getGeometry();
    (olFeature as any).originalProjectionCode = this.actualProjectionCode;
    (olFeature as any).originalGeometry = geometry;
    (geometry as any).feature = olFeature;
    olFeature.once('change:geometry', this.handleChangeFeatureGeometry);
    geometry.once('change', this.handleChangeGeometry);
  }

  private handleAddFeature = (event: any) => {
    const feature = event.feature;
    if (feature != null) {
      this.setOriginal(feature);
    }
  };

  private handleChangeFeatureGeometry = (event: any) => {
    const feature = event.feature;
    if (feature != null) {
      this.setOriginal(feature);
    }
  };

  private handleChangeGeometry = (event: any) => {
    const geometry = event.target;
    if (geometry != null) {
      const feature = (geometry as any).feature;
      if (feature != null) {
        feature.set(feature.getGeometryName(), geometry, true);
        this.setOriginal(feature);
      }
    }
  };
}
