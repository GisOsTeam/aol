# Branches de test — `src/source/common/wfs.ts`

## `WfsVersionEnum` et constantes

| # | Branche | Description |
|---|---------|-------------|
| E1 | `WfsVersionEnum.V1_0_0` | Valeur égale à `'1.0.0'` |
| E2 | `WfsVersionEnum.V1_1_0` | Valeur égale à `'1.1.0'` |
| E3 | `WfsVersionEnum.V2_0_0` | Valeur égale à `'2.0.0'` |
| C1 | `DEFAULT_WFS_VERSION` | Égal à `WfsVersionEnum.V1_1_0` |
| C2 | `DEFAULT_WFS_OUTPUT_FORMAT` | Valeur `'text/xml; subtype=gml/3.1.1'` |
| C3 | `DEFAULT_WFS_PROJECTION_CODE` | Valeur `'EPSG:3857'` |
| C4 | `DEFAULT_WFS_LIMIT` | Valeur `1000` |
| C5 | `DEFAULT_WFS_OPTIONS` | Objet contenant toutes les valeurs par défaut (outputFormat, version, requestProjectionCode, swapXYBBOXRequest, swapLonLatGeometryResult, limit) |

---

## `WFSMergeOptions`

| # | Branche | Description |
|---|---------|-------------|
| M1 | `newOptions` écrase `oldOptions` | Les propriétés communes de `newOptions` prennent la priorité sur celles de `oldOptions` |
| M2 | `oldOptions` vides | Seules les `newOptions` contribuent au résultat |
| M3 | `newOptions` vides | Seules les `oldOptions` contribuent au résultat |
| M4 | Propriétés non-chevauchantes | Toutes les propriétés des deux objets sont préservées dans le résultat |

---

## `WFSInitializeOptions`

| # | Branche | Description |
|---|---------|-------------|
| I1 | `snapshotable` non défini | Positionné à `true` |
| I2 | `snapshotable = false` | Conservé à `false` |
| I3 | `listable` non défini | Positionné à `true` |
| I4 | `listable = false` | Conservé à `false` |
| I5 | `removable` non défini | Positionné à `true` |
| I6 | `removable = false` | Conservé à `false` |
| I7 | Fusion avec les defaults | `version`, `outputFormat`, `requestProjectionCode`, `swapXYBBOXRequest`, `swapLonLatGeometryResult`, `limit` portent les valeurs par défaut si non fournis |
| I8 | Options personnalisées | Les valeurs fournies écrasent les defaults (`limit`, `version`, etc.) |
| I9 | Mélange de flags | `snapshotable=true`, `listable=false`, `removable=true` tout à la fois |
| I10 | `swapXYBBOXRequest` et `swapLonLatGeometryResult` à `true` | Ces valeurs sont correctement préservées lors de la fusion |

---

## `WFSInit`

| # | Branche | Description |
|---|---------|-------------|
| IN1 | Délégation à `WFSLoadDescription` | `loadDescribeFeatureType` (appelé depuis `WFSLoadDescription`) est invoqué exactement une fois avec les options correctes |
| IN2 | Résolution sans erreur | La promesse se résout en `undefined` (void) |

---

## `WFSLoadDescription`

| # | Branche | Description |
|---|---------|-------------|
| LD1 | `loadDescribeFeatureType` retourne `true` | La description est chargée depuis le XSD ; `loadWfsFeatureDescription` n'est **pas** appelé |
| LD2 | `loadDescribeFeatureType` retourne `false` | Fallback : `loadWfsFeatureDescription` est appelé et la description est chargée depuis GetFeature JSON |
| LD3 | `loadDescribeFeatureType` retourne `false` ET `loadWfsFeatureDescription` échoue | L'erreur est propagée (aucune mise à jour des attributs) |
| LD4 | `options.version` non défini (`undefined`) | `DEFAULT_WFS_VERSION` est utilisé dans les `internalOptions` passées à `loadDescribeFeatureType` |
| LD5 | `options.outputFormat` non défini (`undefined`) | `DEFAULT_WFS_OUTPUT_FORMAT` est utilisé dans les `internalOptions` |
| LD6 | `options.requestProjectionCode` non défini (`undefined`) | `DEFAULT_WFS_PROJECTION_CODE` est utilisé dans les `internalOptions` |
| LD7 | Toutes les options définies | Les valeurs fournies (`version`, `outputFormat`, `requestProjectionCode`) sont transmises telles quelles |
| LD8 | `options.method` défini | La valeur fournie est transmise dans `internalOptions` à `loadDescribeFeatureType` |
| LD9 | `options.method` non défini (`undefined`) | `'GET'` est utilisé dans `internalOptions` (opérateur `??`) |

---

## `WFSQuery`

| # | Branche | Description |
|---|---------|-------------|
| Q1 | Appel de base | `executeWfsQuery` est appelé avec `source`, `url`, `type` et `request` corrects |
| Q2 | `options.version` défini | La valeur fournie est transmise à `executeWfsQuery` |
| Q3 | `options.version` non défini (`undefined`) | `DEFAULT_WFS_VERSION` est utilisé (opérateur `??`) |
| Q4 | `options.outputFormat` défini | La valeur fournie est transmise à `executeWfsQuery` |
| Q5 | `options.outputFormat` non défini (`undefined`) | `DEFAULT_WFS_OUTPUT_FORMAT` est utilisé (opérateur `??`) |
| Q6 | `options.requestProjectionCode` défini | La valeur fournie est transmise à `executeWfsQuery` |
| Q7 | `options.requestProjectionCode` non défini (`undefined`) | `DEFAULT_WFS_PROJECTION_CODE` est utilisé (opérateur `??`) |
| Q8 | `options.swapXYBBOXRequest` défini | La valeur fournie (`true`) est transmise à `executeWfsQuery` |
| Q9 | `options.swapXYBBOXRequest` non défini (`undefined`) | `false` est utilisé (opérateur `??`) |
| Q10 | `options.swapLonLatGeometryResult` défini | La valeur fournie (`true`) est transmise à `executeWfsQuery` |
| Q11 | `options.swapLonLatGeometryResult` non défini (`undefined`) | `false` est utilisé (opérateur `??`) |
| Q12 | Valeur retournée | Retourne `{ request, featureTypeResponses: [<résultat executeWfsQuery>] }` |
| Q13 | `request.method` absent, `options.method` défini | `request.method` est assigné depuis `options.method` avant l'appel à `executeWfsQuery` |
| Q14 | `request.method` absent, `options.method` absent | `request.method` est assigné à `'GET'` (défaut `??`) |
| Q15 | `request.method` déjà défini | `request.method` est conservé tel quel, `options.method` ignoré |

---

## `WFSRetrieveFeature`

| # | Branche | Description |
|---|---------|-------------|
| R1 | Appel de base | `retrieveWfsFeature` est appelé avec `url`, `type`, `id` (number) et `featureProjection` corrects |
| R2 | `id` de type `string` | L'identifiant string est transmis intact à `retrieveWfsFeature` |
| R3 | `options.requestProjectionCode` défini | La valeur fournie est transmise |
| R4 | `options.requestProjectionCode` non défini (`undefined`) | `DEFAULT_WFS_PROJECTION_CODE` est utilisé (opérateur `??`) |
| R5 | `options.version` défini | La valeur fournie est transmise |
| R6 | `options.version` non défini (`undefined`) | `DEFAULT_WFS_VERSION` est utilisé (opérateur `??`) |
| R7 | `options.outputFormat` défini | La valeur fournie est transmise |
| R8 | `options.outputFormat` non défini (`undefined`) | `DEFAULT_WFS_OUTPUT_FORMAT` est utilisé (opérateur `??`) |
| R9 | `options.swapXYBBOXRequest` défini | La valeur fournie (`true`) est transmise |
| R10 | `options.swapXYBBOXRequest` non défini (`undefined`) | `false` est utilisé (opérateur `??`) |
| R11 | `options.swapLonLatGeometryResult` défini | La valeur fournie (`true`) est transmise |
| R12 | `options.swapLonLatGeometryResult` non défini (`undefined`) | `false` est utilisé (opérateur `??`) |
| R13 | Feature trouvée | Retourne la `Feature` renvoyée par `retrieveWfsFeature` |
| R14 | Aucune feature (`undefined`) | Retourne `undefined` |
| R15 | `options.method` défini | La valeur fournie est transmise à `retrieveWfsFeature` |
| R16 | `options.method` non défini (`undefined`) | `'GET'` est utilisé (opérateur `??`) |
