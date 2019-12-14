import OlFeature from 'ol/Feature';
import { Vector } from './Vector';
import Wkt from 'ol/format/WKT';
import { SourceType, SourceTypeEnum } from './types/sourceType';
import { LayerType, LayerTypeEnum } from './types/layerType';

export class LocalVector extends Vector {
  protected options: any;

  private strategy_: (extent: [number, number, number, number], resolution: number) => any;

  private origstrategy_: (extent: [number, number, number, number], resolution: number) => any;

  private wktFormat = new Wkt();

  constructor(options: any = {}) {
    super({ ...options, useSpatialIndex: true, features: undefined });
    const features = options['features']; // TODO load features
    options['features'] = undefined;
    this.options = options;
    this.origstrategy_ = this.strategy_;
    this.strategy_ = (extent: [number, number, number, number], resolution: number) => {
      if (this.oldProjectionCode !== this.actualProjectionCode) {
        this.reproj();
      }
      return this.origstrategy_.call(this, extent, resolution);
    };
    if (features != null) {
      // Load features from snapshot
      features.forEach((feature: any) => {
        const projectionCode = feature.projectionCode;
        const wkt = feature.wkt;
        const properties = feature.properties;
        const geometry = this.wktFormat.readGeometry(wkt);
        const olFeature = new OlFeature(geometry);
        olFeature.setProperties(properties);
        olFeature.set('originalProjectionCode', projectionCode, true);
        olFeature.set('originalGeometry', geometry, true);
        geometry.set('feature', olFeature, true);
        olFeature.once('change:geometry', this.handleChangeFeatureGeometry);
        geometry.once('change', this.handleChangeGeometry);
        this.addFeature(olFeature);
      });
    }
    this.on('addfeature', this.handleAddFeature);
  }

  public getSourceTypeName(): SourceType {
    return SourceTypeEnum.LocalVector;
  }

  public getSourceOptions(): any {
    const options = this.options;
    const features: any[] = [];
    this.forEachFeature((feature: OlFeature) => {
      const originalProjectionCode = feature.get('originalProjectionCode');
      const originalGeometry = feature.get('originalGeometry');
      const properties = { ...feature.getProperties() };
      properties['originalProjectionCode'] = undefined;
      properties['originalGeometry'] = undefined;
      properties['geometry'] = undefined;
      features.push({
        projectionCode: originalProjectionCode,
        wkt: this.wktFormat.writeGeometry(originalGeometry),
        properties
      });
    });
    options['features'] = features;
    return options;
  }

  public getLayerTypeName(): LayerType {
    return LayerTypeEnum.Vector;
  }

  public isSnapshotable(): boolean {
    return this.options.snapshotable == null ? true : this.options.snapshotable; // true by default
  }

  public isListable(): boolean {
    return this.options.listable == null ? true : this.options.listable; // true by default
  }

  private reproj() {
    const features: OlFeature[] = [];
    const extents: [number, number, number, number][] = [];
    this.forEachFeature((feature: OlFeature) => {
      if (feature.getGeometry() != null) {
        const originalProjectionCode = feature.get('originalProjectionCode');
        const originalGeometry = feature.get('originalGeometry');
        if (
          originalProjectionCode != null &&
          originalGeometry != null &&
          originalProjectionCode !== this.actualProjectionCode
        ) {
          const geom = originalGeometry.clone();
          geom.transform(feature.get('originalProjection'), this.actualProjectionCode);
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
    olFeature.set('originalProjectionCode', this.actualProjectionCode, true);
    olFeature.set('originalGeometry', geometry, true);
    geometry.set('feature', olFeature, true);
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
      const feature = geometry.get('feature');
      if (feature != null) {
        feature.set(feature.getGeometryName(), geometry, true);
        this.setOriginal(feature);
      }
    }
  };
}
