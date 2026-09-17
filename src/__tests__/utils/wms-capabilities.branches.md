# Branches de test — `src/utils/wms-capabilities.ts`

## `fetchWmsCapabilities` (C)

| # | Branche | Description |
|---|---------|-------------|
| C1 | Réponse HTTP valide | Le GetCapabilities est parsé par `ol/format/WMSCapabilities` et l'arbre `Capability.Layer` est retourné |
| C2 | Paramètres de requête | `SERVICE=WMS`, `REQUEST=GetCapabilities` sont toujours envoyés ; `VERSION` retombe sur `DEFAULT_WMS_VERSION` (1.3.0) si non fourni |
| C3 | Appels successifs sans `refresh` | Le deuxième appel retourne la même promesse/résultat que le premier, sans nouvelle requête HTTP (cache par `url::version`) |
| C4 | `refresh: true` | Invalide l'entrée de cache avant de (re)lancer la requête, même si un résultat était déjà en cache |
| C5 | Deux `version` différentes pour la même url | Chaque version a sa propre entrée de cache (clé `url::version`) ; pas de collision |
| C6 | Échec réseau (rejet de `HttpEngine.send`) | L'échec n'est pas mis en cache : un appel suivant relance une vraie requête au lieu de rejouer indéfiniment la même erreur |
| C7 | Réponse HTTP 200 mais contenu non exploitable (mauvaise racine XML, ou exception levée par le parser OL lui-même) | Le `parser.read()` est protégé par un `try/catch` interne ; dans les deux cas (retour `undefined`/sans `Capability`, ou exception), une erreur explicite `Unable to parse WMS capabilities from '<url>'` est levée, et rien n'est mis en cache |

---

## `findWmsCapabilityLayer` (F) — vérifié via `getWmsLayerStyles`/`getWmsLegendUrl`

| # | Branche | Description |
|---|---------|-------------|
| F1 | Couche cible imbriquée dans un ou plusieurs groupes (`Layer > Layer > Layer`) | Recherche récursive sur `layer.Layer[]` jusqu'à trouver le `Name` demandé |
| F2 | Nom de couche absent de l'arbre | Retourne `null` sans exception (remonté ensuite comme tableau vide / `null` + `console.warn` selon l'appelant) |

---

## `getWmsLayerStyles` (S)

| # | Branche | Description |
|---|---------|-------------|
| S1 | Couche trouvée avec plusieurs `<Style>` | Retourne les `Name` dans l'ordre de déclaration du GetCapabilities (ordre porteur de sens : le premier est le style par défaut de facto) |
| S2 | Couche introuvable | Retourne `[]` plutôt que `null`/exception |

---

## `getWmsLegendUrl` (L)

| # | Branche | Description |
|---|---------|-------------|
| L1 | `styleName` omis (`null`/non fourni) | Retourne la `LegendURL` du **premier** style déclaré (aucun attribut standard "default" en WMS ; convention de facto reprise ici) |
| L2 | `styleName` fourni et existant | Retourne la `LegendURL` de ce style précis, indépendamment de sa position dans la liste |
| L3 | Couche introuvable, ou sans aucun `<Style>` | Retourne `null` + `console.warn` (pas d'exception) |
| L4 | `styleName` fourni mais absent des styles de la couche | Retourne `null` + `console.warn` listant les styles réellement disponibles (aide au debug) |
| L5 | Style trouvé mais sans `<LegendURL>` déclarée | Retourne `null` + `console.warn`, distinct du cas "style introuvable" |

