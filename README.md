# Mon budget

Application web de budget basée sur votre salaire. Aucune installation, aucune dépendance : trois fichiers (`index.html`, `style.css`, `app.js`).

## Fonctionnalités

- **Mois** : reste à dépenser, budget et dépenses par catégorie, liste des dépenses, ajout et suppression.
- **Année** : salaire annuel (net ou brut), répartition en pourcentages par catégorie, graphique des dépenses mensuelles, bilan annuel.
- Les données restent dans votre navigateur (`localStorage`). Rien n’est envoyé sur Internet.

## Mise en ligne sur GitHub Pages

1. Décompressez le zip : vous devez voir `index.html`, `style.css`, `app.js` et `README.md` directement, sans dossier intermédiaire.
2. Sur GitHub, ouvrez votre dépôt, puis **Add file → Upload files**.
3. Glissez les **fichiers** (pas le dossier) et validez avec **Commit changes**. Remplacez les anciens fichiers s’ils existent.
4. Allez dans **Settings → Pages**, choisissez **Deploy from a branch**, branche `main`, dossier `/ (root)`, puis **Save**.
5. Attendez une à deux minutes, puis ouvrez l’adresse affichée en haut de la page Pages.

## Si la page s’affiche sans style ou vide

- `index.html`, `style.css` et `app.js` doivent être à la **racine** du dépôt, au même niveau. S’ils sont dans un sous-dossier (par exemple `budget-app/`), déplacez-les ou ajustez les chemins.
- Les noms sont sensibles à la casse sur GitHub : `style.css` et non `Style.css`.
- Faites une actualisation forcée (Ctrl + Maj + R, ou videz le cache sur mobile).

## Tester en local

Double-cliquez sur `index.html` : l’application fonctionne directement dans le navigateur.
