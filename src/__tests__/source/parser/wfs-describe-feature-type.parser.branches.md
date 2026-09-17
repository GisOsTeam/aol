# Branches de test — `src/source/parser/wfs-describe-feature-type.parser.ts`

## `parseDescribeFeatureType` (PDFT)

| # | Branche | Description |
|---|---------|-------------|
| PDFT1 | `substitutionGroup="gml:_Feature"` (GML 2 / 3.1) | Reconnu au même titre que `gml:AbstractFeature` (GML 3.2) pour identifier un feature type |
| PDFT2 | Plusieurs feature types dans un même schéma | Un `IFeatureType` par élément `substitutionGroup=gml:AbstractFeature` ; les `complexType` de propriété (non référencés par un tel élément) sont exclus du résultat |
| PDFT3 | `targetNamespace` sans préfixe nommé (`xmlns` par défaut uniquement) | Fallback sur le nom local seul (pas de QName préfixé reconstruit) |
| PDFT4 | Schéma non conforme (aucun élément `substitutionGroup=gml:AbstractFeature`/`_Feature`) | Fallback sur l'ancien comportement : le nom du `complexType` est utilisé comme id |
| PDFT5 | Référence de type pendante (`type` de l'élément introuvable dans le schéma) | `attributes` vide, pas de `geometryAttribute`/`identifierAttribute`, aucun crash |
| PDFT6 | Élément `substitutionGroup=gml:AbstractFeature` sans attribut `name` | `id`/`name` replient sur `Unknown_<idx>`/`'Unknown'` ; le `complexType` reste résolu via l'attribut `type`, indépendamment du `name` manquant |
| PDFT7 | Élément `substitutionGroup=gml:AbstractFeature` sans attribut `type` | Le `complexType` n'est pas résolu (`attributes` vide), mais `id`/`name` restent corrects via le `name` de l'élément |

---

## `buildQName` (BQN)

| # | Branche | Description |
|---|---------|-------------|
| BQN1 | Schéma sans attribut `targetNamespace` du tout (schéma non qualifié) | Aucune reconstruction de QName tentée ; le nom local est utilisé tel quel |

---

## `parseElement` (PE) — vérifié via `parseDescribeFeatureTypeDetailed`

| # | Branche | Description |
|---|---------|-------------|
| PE1 | `minOccurs` / `maxOccurs` / `nillable` déclarés ou absents | `minOccurs`/`maxOccurs` numériques respectés, `maxOccurs="unbounded"` → `null`, `nillable="true"` → `true` ; en l'absence de ces attributs, valeurs par défaut (`minOccurs=0`, `maxOccurs=1`, `nillable=false`) |
| PE2 | Champ sans attribut `type` mais avec un `complexType` inline anonyme | Marqué `FieldTypeEnum.Unknown` avec `rawType="complexType"` (pas de traitement récursif du contenu imbriqué) |
| PE3 | Champ déclaré par référence (`ref="gml:name"`) plutôt que par `name` (pattern GML courant pour réutiliser une propriété standard) | Ignoré silencieusement (pas de `name` résolvable), sans crash, les autres champs restent extraits |

---

## `parseXsdDocument` (ID)

| # | Branche | Description |
|---|---------|-------------|
| ID1 | XML malformé (ex: page d'erreur HTML renvoyée par le serveur au lieu du XSD) | `parsererror` détecté par le `DOMParser` → une erreur explicite (`Erreur de parsing XML: ...`) est levée, pas de plantage silencieux ni de résultat vide |

---

## `mapType` (MT)

| # | Branche | Description |
|---|---------|-------------|
| MT1 | Type GML référencé avec un préfixe non standard (ex: `gml311:MultiPolygonPropertyType`) | Résolu par décomposition du namespace (recherche par suffixe `:MultiPolygonPropertyType` dans la table de mapping) → correctement mappé sur `FieldTypeEnum.Geometry` |
| MT2 | Type préfixé sans aucune correspondance (ni directe, ni par suffixe) | Retourne `FieldTypeEnum.Unknown` (référence vers un `complexType` métier personnalisé) |

---

## `extractFieldsFromComplexType` (EFCT)

| # | Branche | Description |
|---|---------|-------------|
| EFCT1 | `complexType` sans `sequence`/`choice`/`all` (ex: `complexContent > extension` vide) | Retourne une liste d'attributs vide, sans crash |
| EFCT2 | Séquence trouvée via `simpleContent > extension` (au lieu de `complexContent > extension`) | Les champs de la séquence sont bien extraits |

---

## `findAllComplexTypes` (FACT)

| # | Branche | Description |
|---|---------|-------------|
| FACT1 | `complexType` déclaré sous un namespace XSD non standard (aucune correspondance via `getElementsByTagNameNS`) | Retrouvé via le fallback par nom local (`getLocalName(tagName) === 'complexType'`) |
