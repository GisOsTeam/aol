import GML32 from 'ol/format/GML32';
import Geometry from 'ol/geom/Geometry';
import { WktUtils } from '../../wkt.utils';
import { FilterBuilderType, FilterBuilderTypeEnum, FilterValueType, IField } from '../IFilter';
import { IOperator, OperatorEnum, OperatorType } from '../operator';
import { BoundingBox } from '../operator/spatial';
import { Contains } from '../operator/spatial/Contains';
import { Disjoint } from '../operator/spatial/Disjoint';
import { Intersects } from '../operator/spatial/Intersects';
import { Within } from '../operator/spatial/Within';
import { escapeXmlAttribute, GML32_NAMESPACE } from '../fes';
import { FilterPredicate } from './FilterPredicate';
import { IPredicate } from './IPredicate';

// "minx,miny,maxx,maxy,'srs'" as built by SpatialPre's CQL callers (e.g. src/source/query/wfs.ts).
const BBOX_RIGHT_HAND_PATTERN = /^(-?[\d.]+),(-?[\d.]+),(-?[\d.]+),(-?[\d.]+),'([^']+)'$/;

export class SpatialPre extends FilterPredicate<string> {
  /**
   * Optional CRS for the WKT-based operators (Intersects/Contains/Disjoint/Within) OGC/FES
   * rendering. BBOX carries its own CRS inline in its right-hand string instead (see
   * buildOgcEnvelope) and ignores this.
   */
  private readonly srsName?: string;

  public constructor(leftHand: IField<string>, rightHand: FilterValueType, operator?: IOperator, srsName?: string) {
    super(leftHand, operator, rightHand);
    this.srsName = srsName;
  }

  public static buildFromPredicate(predicate: IPredicate): SpatialPre {
    return new SpatialPre(predicate.leftHand, predicate.rightHand, this.buildOperator(predicate.operator.type));
  }

  public static buildOperator(operatorType: OperatorType): IOperator {
    switch (operatorType) {
      case OperatorEnum.BBOX:
        // Formule du CQL_filter : BBOX(Geometry_column, minx, miny, maxx, maxy, 'CRS')
        return new BoundingBox();

      case OperatorEnum.Intersects:
        // Formule du CQL_filter : intersects(Geometry_column, Geometry)
        return new Intersects();

      case OperatorEnum.Contains:
        // Formule du CQL_filter : contains(Geometry_column, Geometry)
        return new Contains();

      case OperatorEnum.Disjoint:
        // Formule du CQL_filter : disjoint(Geometry_column, Geometry)
        return new Disjoint();

      case OperatorEnum.Within:
        // Formule du CQL_filter : within(Geometry_column, Geometry)
        return new Within();
    }
  }

  public toString(type?: FilterBuilderType): string {
    if (type === FilterBuilderTypeEnum.OGC) {
      return this.buildOgcString();
    }
    return `(${this.operator.toString(type)}(${this.buildLeftHandString()},${this.buildRightHandString()}))`;
  }
  protected buildLeftHandString(): string {
    return `${String(this.leftHand.key)}`;
  }

  protected buildRightHandString(): string {
    return `${this.rightHand}`;
  }

  protected buildOgcString(): string {
    const tag = this.operator.toString(FilterBuilderTypeEnum.OGC);
    const valueReference = this.defaultLeftHandString(FilterBuilderTypeEnum.OGC);
    const geometryXml = this.operator instanceof BoundingBox ? this.buildOgcEnvelope() : this.buildOgcGeometry();
    return `<${tag}>${valueReference}${geometryXml}</${tag}>`;
  }

  /**
   * Renders the BBOX right-hand ("minx,miny,maxx,maxy,'srs'") as a gml:Envelope, keeping the
   * exact coordinate order the caller already built (no axis-order swap, unlike buildOgcGeometry
   * below) so it stays consistent with the swapXYBBOXRequest handling done upstream for CQL.
   */
  private buildOgcEnvelope(): string {
    const match = BBOX_RIGHT_HAND_PATTERN.exec(String(this.rightHand));
    if (!match) {
      throw new Error(
        `Unsupported BBOX value for OGC/FES encoding, expected "minx,miny,maxx,maxy,'srs'": ${this.rightHand}`,
      );
    }
    const [, minx, miny, maxx, maxy, srsName] = match;
    return (
      `<Envelope xmlns="${GML32_NAMESPACE}" srsName="${escapeXmlAttribute(srsName)}">` +
      `<lowerCorner>${minx} ${miny}</lowerCorner>` +
      `<upperCorner>${maxx} ${maxy}</upperCorner>` +
      `</Envelope>`
    );
  }

  /**
   * Renders the right-hand as a GML 3.2 geometry element, expecting a WKT string (the same
   * format the CQL rendering embeds as-is into e.g. INTERSECTS(the_geom, POINT(0 0))).
   *
   * If no srsName is given (the constructor's 4th argument), none is attached, which is valid
   * FES: the service falls back to the feature type's default CRS - but that default is
   * usually the layer's native storage CRS, not WGS84, so a plain WKT built from lon/lat
   * degrees will silently match nothing on most real servers. Pass srsName explicitly whenever
   * the WKT's coordinates are in a known CRS (verified in practice against a live WFS 2.0.0
   * server: without it, otherwise-correct filters returned zero features).
   *
   * srsName is set by mutating the GML32-produced element directly rather than via GML32's own
   * `srsName` constructor option: that option also triggers ol's per-CRS axis-order swap (e.g.
   * lat/lon for EPSG:4326), which most WFS servers do NOT expect for the short "EPSG:xxxx" form
   * of srsName (only for the "urn:ogc:def:crs:..." form) - confirmed against a live server too.
   */
  private buildOgcGeometry(): string {
    let geometry: Geometry;
    try {
      geometry = WktUtils.toOpenLayersGeometry(String(this.rightHand));
    } catch (e) {
      throw new Error(`Unsupported geometry value for OGC/FES encoding, expected WKT: ${this.rightHand}`);
    }
    const geometryNode = new GML32().writeGeometryNode(geometry) as unknown as Element;
    const geometryElement = geometryNode.firstElementChild;
    if (!geometryElement) {
      throw new Error(`Failed to encode geometry as GML for OGC/FES filter: ${this.rightHand}`);
    }
    if (this.srsName) {
      geometryElement.setAttribute('srsName', this.srsName);
    }
    return new XMLSerializer().serializeToString(geometryElement);
  }
}
