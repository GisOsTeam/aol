# Branches de test — `src/source/legend/wms.ts`

## `loadLegendWms` (LLW)

| # | Branche | Description |
|---|---------|-------------|
| LLW1 | `GetLegendGraphic` répond correctement (image chargée avec succès) | La légende dynamique est utilisée telle quelle : `srcImage` est l'url `GetLegendGraphic`, aucun appel aux capabilities |
| LLW2 | `GetLegendGraphic` inaccessible (opération optionnelle de la norme WMS non implémentée par certains serveurs, ex: WMS-r Géoplateforme IGN), qu'il échoue au niveau de la requête (`HttpEngine`, si `loadImagesWithHttpEngine: true`) ou du chargement de l'image (`<img>`) | Bascule sur `fetchWmsCapabilities` + `getWmsLegendUrl` pour la couche courante ; `srcImage` reflète l'url réellement utilisée (la LegendURL statique), pas l'url `GetLegendGraphic` en échec. Vérifié à la fois en conditions réelles (serveur IGN, `LLW2` du describe "real network") et de façon déterministe (`HttpEngine` mocké, `LLW2` du describe "mocked HttpEngine") |
| LLW3 | Fallback capabilities : la couche/le style n'a aucune `LegendURL` déclarée (`getWmsLegendUrl` retourne `null`) | Lève une erreur explicite (`Unable to load legend for WMS layer '<key>': ...`) plutôt que de retourner une légende vide silencieusement |
| LLW4 | Un appel précédent a déjà constaté l'échec de `GetLegendGraphic` sur cette instance de source (`(source as any).getLegendGraphicEnable === false`, positionné lors du premier échec) | Saute directement au fallback capabilities sans retenter `GetLegendGraphic` — mémoïsation par instance, pas de reset automatique tant que la source existe |
| LLW5 | Fallback capabilities déclenché alors qu'un `STYLES` autre que le premier est actif sur la source (ex: après `changeLayerStyle`) | `getWmsLegendUrl` est appelé avec le style courant (`source.getParams()['STYLES']`), pas systématiquement le premier style déclaré — la légende de fallback reste cohérente avec le style réellement affiché |

> Note : `LLW1` n'est pas testé dans ce fichier — `jsdom` (l'environnement de test) ne charge jamais réellement une image (`<img>.onload` ne se déclenche jamais, cf. constat fait lors de l'implémentation de `LLW2`/`LLW3`), donc ce cas "succès du premier essai" ne peut pas être exercé de façon fiable ici sans mocker le constructeur global `Image`.
