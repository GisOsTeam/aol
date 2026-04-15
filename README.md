# aol

OpenLayers sources extentions

### Problem "/usr/bin/env: ‘sh\r’: No such file or directory"

Install dos2unix

```sh
sudo dnf install dos2unix
```

Run dos2unix to .husky/pre-commit & .husky/_/husky.sh

```sh
dos2unix .husky/pre-commit
dos2unix .husky/_/husky.sh
```

## Tests

### Lancer des tests simples

#### Lancer tous les tests
```sh
npm test
```

#### Lancer un test spécifique depuis un nom de test ou un fichier
```sh
npm test -- -t "nom du test"
```
```sh
npm test -- src/__tests__/source/common/wms.ts
```

### En mode couverture de code

#### Lancer tous les tests
```sh
npm run coverage
```
#### Lancer un test spécifique depuis un nom de test ou un fichier
```sh
npm run coverage -- -t "nom du test"
```
```sh
npm run coverage -- --runTestsByPath src/__tests__/source/common/wms.ts
```

#### Lancer un serveur pour visualiser la couverture de code
```sh
npm run coverage:serve
```

----
#### Il est possible d'activer le mode watch et de visualiser la couverture de code en même temps au format html en lançant la commande suivante :
```sh
npm run coverage:report:html -- --runTestsByPath src/__tests__/source/common/wms.ts --watch
```
et dans un autre terminal :
```sh
npm run coverage:serve
```