import OlMap from 'ol/Map';
import OlView from 'ol/View';
import { get as getProjection, Projection } from 'ol/proj';
import Polygon from 'ol/geom/Polygon';
import { IFeatureType, IQueryRequest, IIdentifyRequest, QueryType } from '../../../source/IExtended';
import { Wfs } from '../../../source/Wfs';
import { FieldTypeEnum, FilterBuilder } from '../../../filter';
import { LowerOrEqualThan, Equal as EqualPre } from '../../../filter/predicate';
import { executeWfsQuery } from '../../../source/query';
import { Equal } from '../../../filter/operator';
import { HttpEngine } from '../../../HttpEngine';
import { BeforeSendInterceptor as BhreqBeforeSendInterceptor, Engine, IRequest } from 'bhreq';
import {
  __testing__,
  IExecuteWfsQueryOptions,
  ILoadWfsFeatureDescriptionOptions,
  ILoadWfsFeatureOptions,
  loadWfsFeatureDescription,
  IRetrieveWfsFeaturesOptions,
  loadWfsFeaturesOnBBOX,
  retrieveWfsFeature,
  WfsVersion,
} from '../../../source/query/wfs';

import { register as registerProj4IntoOl } from 'ol/proj/proj4';
import * as pj4 from 'proj4';

pj4.defs(
  'EPSG:2154',
  '+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
);
registerProj4IntoOl(pj4);
const type: Readonly<IFeatureType<string>> = {
  id: 'lyv_lyvia.lyvhistorique',
  geometryAttribute: { key: 'the_geom', type: FieldTypeEnum.Geometry },
};
const wfsSource = new Wfs({
  url: 'https://data.grandlyon.com/geoserver/metropole-de-lyon/ows',
  type,
});
const projectionCode = 'EPSG:3857';
const geometryProjection = getProjection(projectionCode) as Projection;
const viewProjection = getProjection(projectionCode) as Projection;
const bbox = [540481.0863387027, 5740738.693432945, 540484.0928296748, 5740740.273849575];
const bboxAsString = bbox.join(',');
const polygonFromBbox = new Polygon([
  [
    [bbox[0], bbox[1]], // bas-gauche
    [bbox[0], bbox[3]], // haut-gauche
    [bbox[2], bbox[3]], // haut-droit
    [bbox[2], bbox[1]], // bas-droit
    [bbox[0], bbox[1]], // fermeture
  ],
]);
const resolution = 0.004529754070684919; // Résolution approximative, récupérée depuis un viewer openlayers
const olView = new OlView({
  extent: bbox,
  resolution: resolution,
  projection: viewProjection,
});
const olMap = new OlMap({
  view: olView,
});

let identifyRequest: IIdentifyRequest;
let queryRequest: IQueryRequest;
const featureId = 'lyv_lyvia.lyvhistorique.66176';
const numero = '201800671';
const predicate = new FilterBuilder()
  .from(new LowerOrEqualThan({ key: 'date_debut', type: FieldTypeEnum.String }, '2018-04-09'))
  .and(new EqualPre({ key: 'numero', type: FieldTypeEnum.String }, new Equal(), numero)).predicate;
describe('WFS', () => {
  beforeAll(() => {
    setupHttpEngine();
  });
  describe('buildWfsRequestParams', () => {
    const defaultOptions = {
      featureProjectionCode: projectionCode,
      limit: 100,
      outputFormat: 'application/json', // 'application/json',
      queryType: 'query' as QueryType,
      request: queryRequest,
      requestProjectionCode: projectionCode,
      source: wfsSource,
      swapLonLatGeometryResult: false,
      swapXYBBOXRequest: false,
      url: wfsSource.getUrl() as string,
      version: '1.1.0' as WfsVersion,
    };

    const testDefaultOptions = (params: { [id: string]: string }) => {
      expect(params.SERVICE).toBe('WFS');
      expect(params.VERSION).toBe(defaultOptions.version);
      expect(params.REQUEST).toBe('GetFeature');
      expect(params.TYPENAME).toBe(type.id);
      expect(params.MAXFEATURES).toBe(`${defaultOptions.limit}`);
      expect(params.OUTPUTFORMAT).toBe(defaultOptions.outputFormat);
      expect(params.SRSNAME).toBe(defaultOptions.requestProjectionCode);
    };

    test('construit correctement les paramètres de requête WFS avec un prédicat et BBOX', () => {
      const options = {
        ...defaultOptions,
        bbox: bbox,
        type: {
          ...type,
          predicate: predicate,
        },
      };
      const params = __testing__.buildWfsRequestParams(options);
      testDefaultOptions(params);
      expect(params.CQL_FILTER).toBe(
        `(((Concatenate(date_debut) <= '2018-04-09') AND (Concatenate(numero) = '${numero}')) AND (BBOX(the_geom,${bboxAsString},'${options.requestProjectionCode}')))`,
      );
    });

    test('construit correctement les paramètres de requête WFS avec uniquement une BBOX', () => {
      const options = {
        ...defaultOptions,
        bbox: bbox,
        type: {
          ...type,
        },
      };
      const params = __testing__.buildWfsRequestParams(options);
      testDefaultOptions(params);
      expect(params.BBOX).toBe(`${bboxAsString},${options.requestProjectionCode}`);
      expect(params.CQL_FILTER).toBeUndefined();
    });
  });

  describe('buildBBOXFilterParameter', () => {
    test('construit correctement le paramètre BBOX', () => {
      const options = {
        type: {
          ...type,
        },
        bbox: bbox,
        requestProjectionCode: projectionCode,
      } as ILoadWfsFeatureOptions;
      const params = __testing__.buildBBOXParameter(options);
      expect(params.BBOX).toBe(`${bboxAsString},${options.requestProjectionCode}`);
    });

    test('construit correctement le paramètre BBOX avec swapXYBBOXRequest à true', () => {
      const options = {
        type: {
          ...type,
        },
        bbox: bbox,
        requestProjectionCode: projectionCode,
        swapXYBBOXRequest: true,
      } as ILoadWfsFeatureOptions;
      const params = __testing__.buildBBOXParameter(options);
      const swappedBboxAsString = `${bbox[1]},${bbox[0]},${bbox[3]},${bbox[2]}`;
      expect(params.BBOX).toBe(`${swappedBboxAsString},${options.requestProjectionCode}`);
    });

    test('ne construit pas de paramètre BBOX si un prédicat est présent', () => {
      const options = {
        type: {
          ...type,
          predicate: predicate,
        },
        bbox: bbox,
        requestProjectionCode: projectionCode,
      } as ILoadWfsFeatureOptions;
      const params = __testing__.buildBBOXParameter(options);
      expect(params.BBOX).toBeUndefined();
    });

    test('ne construit pas de paramètre BBOX si la bbox est absente ou invalide', () => {
      const optionsWithoutBbox = {
        type: {
          ...type,
        },
        requestProjectionCode: projectionCode,
      } as ILoadWfsFeatureOptions;
      const paramsWithoutBbox = __testing__.buildBBOXParameter(optionsWithoutBbox);
      expect(paramsWithoutBbox.BBOX).toBeUndefined();

      const optionsWithInvalidBbox = {
        type: {
          ...type,
        },
        bbox: [540481.0863387027, 5740738.693432945], // bbox invalide (moins de 4 éléments)
        requestProjectionCode: projectionCode,
      } as ILoadWfsFeatureOptions;
      const paramsWithInvalidBbox = __testing__.buildBBOXParameter(optionsWithInvalidBbox);
      expect(paramsWithInvalidBbox.BBOX).toBeUndefined();
    });
  });

  describe('buildCQLFilterParameter', () => {
    test("construit correctement le paramètre CQL_FILTER uniquement sur la base d'options.cql", () => {
      const options = {
        type: {
          ...type,
          predicate: predicate,
        },
        cql: 'population > 1000',
      } as ILoadWfsFeatureOptions;
      const params = __testing__.buildCQLFilterParameter(options);
      expect(params.CQL_FILTER).toBe('population > 1000');
    });

    test("construit correctement le paramètre CQL_FILTER à partir des filtres issu d'un type", () => {
      const options = {
        type: {
          ...type,
          predicate: predicate,
        },
      } as ILoadWfsFeatureOptions;
      const params = __testing__.buildCQLFilterParameter(options);
      expect(params.CQL_FILTER).toBe(
        `((Concatenate(date_debut) <= '2018-04-09') AND (Concatenate(numero) = '${numero}'))`,
      );
    });

    test('construit correctement le paramètre CQL_FILTER à partir des filtres issu des options', () => {
      const filter = new FilterBuilder().from(
        new LowerOrEqualThan({ key: 'date_debut', type: FieldTypeEnum.String }, '2018-04-09'),
      ).predicate;
      const options = {
        type: {
          ...type,
        },
        filters: filter,
      } as ILoadWfsFeatureOptions;
      const params = __testing__.buildCQLFilterParameter(options);
      expect(params.CQL_FILTER).toBe(`(Concatenate(date_debut) <= '2018-04-09')`);
    });

    test("construit correctement le paramètre CQL_FILTER à partir des filtres issu d'un type et d'une bbox", () => {
      const options = {
        type: {
          ...type,
          predicate: predicate,
        },
        bbox: bbox,
        requestProjectionCode: projectionCode,
      } as ILoadWfsFeatureOptions;
      const params = __testing__.buildCQLFilterParameter(options);
      expect(params.CQL_FILTER).toBe(
        `(((Concatenate(date_debut) <= '2018-04-09') AND (Concatenate(numero) = '${numero}')) AND (BBOX(the_geom,${bboxAsString},'EPSG:3857')))`,
      );
    });

    test("construit correctement le paramètre CQL_FILTER à partir des filtres issu d'un type et des options", () => {
      const filterFromOptions = new FilterBuilder().from(
        new EqualPre({ key: 'statut', type: FieldTypeEnum.String }, new Equal(), 'actif'),
      ).predicate;
      const options = {
        type: {
          ...type,
          predicate: predicate,
        },
        filters: filterFromOptions,
      } as ILoadWfsFeatureOptions;
      const params = __testing__.buildCQLFilterParameter(options);
      expect(params.CQL_FILTER).toBe(
        `((Concatenate(statut) = 'actif') AND ((Concatenate(date_debut) <= '2018-04-09') AND (Concatenate(numero) = '${numero}')))`,
      );
    });

    test("construit correctement le paramètre CQL_FILTER à partir des filtres issu des options et d'une bbox", () => {
      const filter = new FilterBuilder().from(
        new LowerOrEqualThan({ key: 'date_debut', type: FieldTypeEnum.String }, '2018-04-09'),
      ).predicate;
      const options = {
        type: {
          ...type,
        },
        filters: filter,
        bbox: bbox,
        requestProjectionCode: projectionCode,
      } as ILoadWfsFeatureOptions;
      const params = __testing__.buildCQLFilterParameter(options);
      expect(params.CQL_FILTER).toBe(
        `((Concatenate(date_debut) <= '2018-04-09') AND (BBOX(the_geom,${bboxAsString},'EPSG:3857')))`,
      );
    });

    test("construit correctement le paramètre CQL_FILTER à partir des filtres issu d'un type et des options, et d'une bbox", () => {
      const filterFromOptions = new FilterBuilder().from(
        new EqualPre({ key: 'statut', type: FieldTypeEnum.String }, new Equal(), 'actif'),
      ).predicate;
      const options = {
        type: {
          ...type,
          predicate: predicate,
        },
        filters: filterFromOptions,
        bbox: bbox,
        requestProjectionCode: projectionCode,
      } as ILoadWfsFeatureOptions;
      const params = __testing__.buildCQLFilterParameter(options);
      expect(params.CQL_FILTER).toBe(
        `(((Concatenate(statut) = 'actif') AND ((Concatenate(date_debut) <= '2018-04-09') AND (Concatenate(numero) = '${numero}'))) AND (BBOX(the_geom,${bboxAsString},'EPSG:3857')))`,
      );
    });

    test('ne construit pas de paramètre CQL_FILTER si bbox seule', () => {
      const options = {
        type: {
          ...type,
        },
        bbox: bbox,
        requestProjectionCode: projectionCode,
      } as ILoadWfsFeatureOptions;
      const params = __testing__.buildCQLFilterParameter(options);
      expect(params.CQL_FILTER).toBeUndefined();
    });

    test("ne construit pas de paramètre CQL_FILTER si aucune predicate ni bbox n'est fournie", () => {
      const options = {
        type: {
          ...type,
        },
      } as ILoadWfsFeatureOptions;
      const params = __testing__.buildCQLFilterParameter(options);
      expect(params.CQL_FILTER).toBeUndefined();
    });
  });

  describe('executeWfsQuery', () => {
    describe('identify', () => {
      identifyRequest = {
        limit: 100,
        olMap: olMap,
        geometry: polygonFromBbox.clone(),
        geometryProjection: geometryProjection,
        queryType: 'identify',
      };

      const defaultOptions: IExecuteWfsQueryOptions = {
        url: wfsSource.getUrl() as string,
        outputFormat: 'application/json', // 'application/json',
        request: { ...identifyRequest },
        requestProjectionCode: projectionCode,
        source: wfsSource,
        swapLonLatGeometryResult: false,
        swapXYBBOXRequest: false,
        type: { ...type },
        version: '1.1.0',
      };

      test('avec géométrie retourne la première entité attendue', async () => {
        const options = {
          ...defaultOptions,
        };

        const response = await executeWfsQuery(options);

        expect<number>(response.features?.length).toBe(1);
        expect<string>(response.features?.[0].get('numero')).toBe(numero);
      });

      test('identify avec géométrie et prédicat retourne la première entité attendue', async () => {
        const options = {
          ...defaultOptions,
        };

        // On ajoute une predicate pour filtrer les résultats sur la date de début
        options.type.predicate = predicate;

        const response = await executeWfsQuery(options);

        expect<number>(response.features?.length).toBe(1);
        expect<string>(response.features?.[0].get('numero')).toBe(numero);
      });
    });

    describe('query', () => {
      queryRequest = {
        limit: 100,
        olMap: olMap,
        queryType: 'query',
      };

      const defaultOptions: IExecuteWfsQueryOptions = {
        source: wfsSource,
        url: wfsSource.getUrl() as string,
        type: { ...type },
        request: { ...queryRequest },
        outputFormat: 'application/json', // 'application/json',
        version: '1.1.0',
        requestProjectionCode: projectionCode,
        swapXYBBOXRequest: false,
        swapLonLatGeometryResult: false,
      };

      test('avec géométrie retourne la première entité attendue', async () => {
        const options = {
          ...defaultOptions,
        };

        // Ajout de la géométrie pour le test de query
        options.request.geometry = polygonFromBbox;
        options.request.geometryProjection = geometryProjection;

        // On ajoute une predicate pour filtrer les résultats sur la date de début
        const response = await executeWfsQuery(options);
        expect<number>(response.features?.length).toBe(1);
        expect<string>(response.features?.[0].get('numero')).toBe(numero);
      });

      test('avec géométrie et prédicat retourne la première entité attendue', async () => {
        const options = {
          ...defaultOptions,
        };
        // On ajoute une predicate pour filtrer les résultats sur la date de début
        options.type.predicate = predicate;

        // Ajout de la géométrie pour le test de query
        options.request.geometry = polygonFromBbox.clone();
        options.request.geometryProjection = geometryProjection;

        const response = await executeWfsQuery(options);

        expect<number>(response.features?.length).toBe(1);
        expect<string>(response.features?.[0].get('numero')).toBe(numero);
      });

      test('avec prédicat retourne la première entité attendue', async () => {
        const options = {
          ...defaultOptions,
        };
        // On ajoute une predicate pour filtrer les résultats sur la date de début
        options.type.predicate = predicate;

        const response = await executeWfsQuery(options);

        expect<number>(response.features?.length).toBe(1);
        expect<string>(response.features?.[0].get('numero')).toBe(numero);
      });
    });
  });

  describe('loadWfsFeaturesOnBBOX', () => {
    const defaultOptions = {
      bbox: bbox,
      featureProjectionCode: projectionCode,
      limit: 100,
      outputFormat: 'application/json', // 'application/json',
      queryType: 'query' as QueryType,
      requestProjectionCode: projectionCode,
      swapLonLatGeometryResult: false,
      swapXYBBOXRequest: false,
      type,
      url: wfsSource.getUrl() as string,
      version: '1.1.0' as WfsVersion,
    };
    test('charge les entités correspondant à une BBOX', async () => {
      const options = {
        ...defaultOptions,
      };
      const response = await loadWfsFeaturesOnBBOX(options);
      // dois avoir au moins une entité correspondant à la BBOX et au type, avec le numéro attendu
      const features = response || [];
      const featureWithExpectedNumero = features.find((feature) => feature.get('numero') === numero);
      expect(featureWithExpectedNumero).toBeDefined();
    });
  });

  describe('retrieveWfsFeature', () => {
    const defaultOptions: IRetrieveWfsFeaturesOptions = {
      featureProjection: getProjection(projectionCode) as Projection,
      id: featureId,
      outputFormat: 'application/json', // 'application/json',
      requestProjectionCode: projectionCode,
      swapLonLatGeometryResult: false,
      swapXYBBOXRequest: false,
      type,
      url: wfsSource.getUrl() as string,
      version: '1.1.0',
    };
    test('récupère une entité spécifique à partir de son ID', async () => {
      const options = {
        ...defaultOptions,
      };
      const feature = await retrieveWfsFeature(options);
      expect(feature).toBeDefined();
      expect(feature?.getId()).toBe(featureId);
    });
  });
});

function setupHttpEngine() {
  const engine = Engine.getInstance();
  const interceptor = (request: IRequest) => {
    if (!request.timeout) {
      request.timeout = 30000; // 30 secondes par défaut
    }
    return request;
  };
  engine.beforeSendInterceptors.push(interceptor as BhreqBeforeSendInterceptor);
  HttpEngine.setInstance(engine);
}
