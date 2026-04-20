# Branches de test — `src/source/query/wfs.ts`

## `loadWfsFeaturesOnBBOX` — switch GET / POST

| # | Branche | Description |
|---|---------|-------------|
| LB_M1 | `method = 'GET'` | `params` transmis dans l'URL, `body` et `contentType` absents |
| LB_M2 | `method = 'POST'` | `params` absent, `body` = URLSearchParams encodé, `contentType = 'application/x-www-form-urlencoded'` |
| LB_414_1 | GET → 414 → retry POST → 200 | Features retournées, `send` appelé 2 fois (GET puis POST) |
| LB_414_2 | GET → 414 → retry POST → échec | Erreur propagée avec le status du retry, `send` appelé 2 fois |
| LB_414_3 | POST → 414 → pas de retry | Erreur propagée, `send` appelé 1 seule fois |
| LB_414_4 | GET → 414 → vérification args du retry | Le retry utilise `method='POST'`, `body` avec params encodés, `contentType='application/x-www-form-urlencoded'`, `params=undefined` |
| LB_414_5 | GET → 200 → pas de retry | Features retournées, `send` appelé 1 seule fois |
| LB_414_6 | GET → 400 → pas de retry | Erreur propagée, `send` appelé 1 seule fois |

---

## `executeWfsQuery` — transformer sans géométrie (`ewqoToRwfwogoTransformer`)

| # | Branche | Description |
|---|---------|-------------|
| EWQ_M1 | `request.method = 'POST'` (sans géométrie) | `'POST'` transmis à `HttpEngine.send` |
| EWQ_M2 | `request.method` undefined (sans géométrie) | `'GET'` utilisé par défaut |

---

## `executeWfsQuery` — transformer avec géométrie (`ewqoToRwfwgoTransformer`)

| # | Branche | Description |
|---|---------|-------------|
| EWQ_M3 | `request.method = 'POST'` (avec géométrie) | `'POST'` transmis à `HttpEngine.send` |
| EWQ_M4 | `request.method` undefined (avec géométrie) | `'GET'` utilisé par défaut |

---

## `retrieveWfsFeature` — valeur par défaut de `method`

| # | Branche | Description |
|---|---------|-------------|
| RWF_M1 | `options.method = 'POST'` | `'POST'` transmis à `HttpEngine.send` |
| RWF_M2 | `options.method` undefined | `'GET'` utilisé par défaut |

---

## `loadWfsFeatureDescription` — valeur par défaut de `method`

| # | Branche | Description |
|---|---------|-------------|
| LFD_M1 | `options.method = 'POST'` | `'POST'` transmis à `HttpEngine.send` |
| LFD_M2 | `options.method` undefined | `'GET'` utilisé par défaut |
