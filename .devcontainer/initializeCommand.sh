#!/bin/bash

[ -e "$HOME/.npmrc" ] || { echo "Le fichier $HOME/.npmrc n'est pas présent dans WSL. Sortie avec code 1."; exit 1; }