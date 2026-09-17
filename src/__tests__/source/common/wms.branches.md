# Branches de test — `src/source/common/wms.ts`

## `WMSMergeOptions`

| # | Branche | Description |
|---|---------|-------------|
| M1 | newOptions override oldOptions | Les propriétés de `newOptions` écrasent celles de `oldOptions` |
| M2 | `oldOptions` vides | Seules les `newOptions` contribuent au résultat |
| M3 | `newOptions` vides | Seules les `oldOptions` contribuent au résultat |

---

## `WMSInitializeOptions`

| # | Branche | Description |
|---|---------|-------------|
| I1 | `snapshotable` non défini | Positionné à `true` |
| I2 | `snapshotable = false` | Conservé à `false` |
| I3 | `listable` non défini | Positionné à `true` |
| I4 | `listable = false` | Conservé à `false` |
| I5 | `removable` non défini | Positionné à `true` |
| I6 | `removable = false` | Conservé à `false` |
| I7 | `queryWfsUrl = undefined` | Normalisé à `null` |
| I8 | `queryWfsUrl = null` | Conservé à `null` |
| I9 | `queryWfsUrl = string` | Conservé tel quel |
| I10 | Fusion avec les default options | `version`, `queryFormat`, `requestProjectionCode`, `limit`, etc. portent les valeurs par défaut si non fournies |

---

## `WMSGetTypePredicateAsMap`

| # | Branche | Description |
|---|---------|-------------|
| G1 | Tableau `types` vide | Retourne une `Map` vide |
| G2 | Type avec `predicate`, absent de la map | Le predicate est ajouté à la map |
| G3 | Type sans `predicate` | Non ajouté à la map |
| G4 | `type.id` déjà présent (doublon) | L'entrée existante n'est pas écrasée |

---

## `WMSInit`

| # | Branche | Description |
|---|---------|-------------|
| IN1 | `queryWfsUrl !== null` | `WFSLoadDescription` est appelé pour chaque type |
| IN2 | `queryWfsUrl === null` | `loadWmsFeatureDescription` (via `WMSLoadDescription`) est appelé pour chaque type |
| IN3 | Plusieurs types | Les promesses s'exécutent en parallèle |
| IN4 | Types vides | Aucune description chargée, `source.setSourceOptions` est appelé directement |

---

## `WMSSetSourceOptions`

| # | Branche (load function) | Description |
|---|---------|-------------|
| SS1 | `loadImagesWithHttpEngine = true`, `defaultLoadFunction = undefined` | Sauvegarde la fonction courante via `getLoadFunction()`, puis applique la nouvelle via `setLoadFunction(newImageLoadFunction)` |
| SS2 | `loadImagesWithHttpEngine = true`, `defaultLoadFunction` déjà défini | `getLoadFunction()` n'est PAS ré-appelé ; `setLoadFunction(newImageLoadFunction)` est appelé |
| SS3 | `loadImagesWithHttpEngine = false`, `defaultLoadFunction` défini | Restaure l'ancienne fonction via `setLoadFunction(defaultLoadFunction)` |
| SS4 | `loadImagesWithHttpEngine = false`, `defaultLoadFunction = undefined` | Ni `getLoadFunction()` ni `setLoadFunction()` ne sont appelés |

| # | Branche (params) | Description |
|---|---------|-------------|
| SS5 | `cqlFilter` non vide | `CQL_FILTER` est ajouté aux params |
| SS6 | `cqlFilter` vide | `CQL_FILTER` est absent des params |
| SS7 | `cqlFilter` devient vide après fusion | `CQL_FILTER` est supprimé des params |

---

## `WMSLoadDescription`

| # | Branche | Description |
|---|---------|-------------|
| LD1 | Délégation | Transmet correctement tous les paramètres à `loadWmsFeatureDescription` |

---

## `WMSQuery`

| # | Branche (visibilité) | Description |
|---|---------|-------------|
| Q1 | `onlyVisible = false` | Tous les types sont interrogés, y compris ceux avec `hide = true` |
| Q2 | `onlyVisible = true`, `type.hide !== true` | Type visible → inclus dans les promises |
| Q3 | `onlyVisible = true`, `type.hide = true` | Type caché → exclu des promises |

| # | Branche (backend) | Description |
|---|---------|-------------|
| Q4 | `queryWfsUrl !== null` | `executeWfsQuery` est appelé |
| Q5 | `queryWfsUrl === null` | `executeWmsQuery` est appelé |
| Q6 | Types vides | Retourne `featureTypeResponses` vide |
| Q7 | `queryWfsUrl !== null` et `request.method` absent | `request.method` est assigné avec `options.queryMethod` avant l’appel à `executeWfsQuery` |
| Q8 | `queryWfsUrl !== null` et `request.method` déjà défini | `request.method` est conservé tel quel, non écrasé par `options.queryMethod` |

---

## `WMSRetrieveFeature`

| # | Branche | Description |
|---|---------|-------------|
| R1 | `queryWfsUrl != null` | `retrieveWfsFeature` est appelé |
| R2 | `queryWfsUrl == null` | `retrieveWmsFeature` est appelé |
| R3 | Une feature est trouvée | Retourne la `Feature` |
| R4 | Aucune feature trouvée (tout `undefined`) | Retourne `undefined` |
| R5 | Plusieurs types, première feature définie | Retourne la première feature non-undefined |

---

## `WMSHandlePropertyChange`

| # | Branche | Description |
|---|---------|-------------|
| H1 | `key === 'types'` | `source.updateParams` est appelé et `options.types` est mis à jour |
| H2 | `key !== 'types'` (ex. `'url'`) | Aucune action effectuée |

---

## `WMSFetchLegend`

Ne prend plus `commonWmsOptions` en paramètre séparé : le défaut de `forceLoadWithHttpEngine` est lu directement sur `(source as any).options.loadImagesWithHttpEngine` (la source WMS porte déjà sa config). `TileWms.fetchLegend`/`ImageWms.fetchLegend` ne font donc que déléguer telles quelles les `options` reçues, sans logique de fusion dupliquée dans chaque classe — c'est `WMSFetchLegend` qui merge, une seule fois.

| # | Branche | Description |
|---|---------|-------------|
| F1 | `fetchLegendoptions = undefined` | Initialisé avec un objet vide ; `refresh` défaut à `false` |
| F2 | `forceLoadWithHttpEngine` fourni explicitement (`true`/`false`) | Conservé tel quel, ne retombe pas sur `source.options.loadImagesWithHttpEngine` |
| F3 | `forceLoadWithHttpEngine` absent/`undefined`, avec d'autres champs fournis (ex: `{ refresh: true }`) | Retombe sur `source.options.loadImagesWithHttpEngine` — le défaut s'applique même quand `fetchLegendoptions` est un objet partiel, pas seulement quand il est absent (régression corrigée : voir F3b) |
| F3b | `fetchLegendoptions` entièrement omis (`undefined`) | Même défaut appliqué que F3 — comportement identique que l'appelant fournisse un objet partiel ou rien du tout |
| F4 | `refresh = false` (ou non défini) ET cache disponible | Retourne `currentLegendByLayer` sans appel réseau |
| F5 | `refresh = true` | `loadLegendWms` est appelé même si cache disponible |
| F6 | Cache vide/falsy (`null`/`undefined`) | `loadLegendWms` est appelé |

---

## `WMSChangeLayerStyle`

Fonction async : elle charge elle-même les capabilities (via `fetchWmsCapabilities(options.url, { version: options.version })`, cf. `../../utils/wms-capabilities.branches.md`) plutôt que de les recevoir en paramètre — l'appelant n'a donc qu'à fournir `options` (déjà disponible sur toute source WMS via `this.options`), pas un objet capabilities pré-chargé.

| # | Branche | Description |
|---|---------|-------------|
| CH1 | Nouveau style valide | `source.updateParams` est appelé avec les params existants + `STYLES` mis à jour ; la `LegendURL` du nouveau style (lue via `getWmsLegendUrl` sur les capabilities fraîchement chargées) est retournée et transmise à `onLegendChange` |
| CH2 | Nouveau style inconnu de la couche | `updateParams` est quand même appliqué (le style est envoyé au serveur WMS tel quel), mais la légende retournée/notifiée est `null` |
| CH3 | Appel à `fetchWmsCapabilities` | Reçoit bien `options.url` et `{ version: options.version }` — les capabilities proviennent de la config de la source, pas d'un paramètre séparé |

---

## `WMSGetLayerStyles`

Même principe que `WMSChangeLayerStyle` : charge les capabilities elle-même via `fetchWmsCapabilities(options.url, { version: options.version })`, l'appelant ne fournit que `options`.

| # | Branche | Description |
|---|---------|-------------|
| GS1 | Couche trouvée avec plusieurs styles | Retourne les noms de styles dans l'ordre de déclaration du GetCapabilities (délégué à `getWmsLayerStyles`) |
| GS2 | Couche introuvable | Retourne `[]` plutôt qu'une exception |
| GS3 | Appel à `fetchWmsCapabilities` | Reçoit bien `options.url` et `{ version: options.version }` |

---

## `WMSBuildFilter`

| # | Branche | Description |
|---|---------|-------------|
| B1 | `types` vide ou `null` | Retourne `''` |
| B2 | Predicate uniquement dans `defaultTypePredicateAsMap` | Le filtre provient de la map |
| B3 | Predicate uniquement dans `type.predicate` | Le filtre provient du type |
| B4 | Predicates dans les deux sources, hashs différents | Combinaison `AND` des deux predicates |
| B5 | Même predicate dans les deux sources (même hash) | Pas de double application — filtre identique à un seul predicate |
| B6 | Aucun predicate sur un type | Ce type ne contribue pas au filtre |
| B7 | Plusieurs types avec filtres | Jointure avec `';'` |
| B8 | Un seul type avec filtre | Aucun `';'` en tête ni en queue |
