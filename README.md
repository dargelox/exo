# Semaine à Table

Application web de planification des repas à partir des ingrédients déjà disponibles, avec liste des courses consolidée.

## Positionnement

Public : étudiants, couples, familles et colocations. Besoin récurrent : décider quoi cuisiner, utiliser le contenu du placard et éviter les achats en double.

Différenciation à tester : démarrer du placard et des quantités réelles, proposer un planning modifiable, garder une liste indépendante des enseignes. Ni diagnostic nutritionnel ni garantie d'économies.

Concurrence : Jow et Mealime valident la catégorie mais disposent d'offres gratuites solides. L'existence de cette demande ne prouve pas que cette application trouvera des clients payants.

Hypothèse commerciale : gratuit pour une semaine courante ; Plus à 3,90 EUR/mois pour enregistrer plusieurs semaines. La facturation n'est pas activée. Ne pas créer de nouvel abonnement Stripe avant publication et tests.

## Architecture

- Frontend : application web statique, déploiement Render depuis ce dépôt.
- Comptes et données : Supabase Auth et PostgreSQL avec règles par utilisateur.
- Paiements futurs : Stripe Checkout, portail et webhook validé côté serveur.
- Aucune dépendance à ChatGPT, aucune URL chatgpt.site, aucun prénom dans le nom du service.

## État

Développement en cours. Render et Supabase doivent être connectés avant le déploiement. Aucun domaine ni hébergement payant n'a été acheté.

## Sources du choix

- https://agirpourlatransition.ademe.fr/particuliers/reduire-dechets/eviter-gaspillage/reduire-gaspillage-alimentaire
- https://support.mealime.com/article/79-mealime-pro
- https://apps.apple.com/fr/app/jow-recettes-menus-courses/id1301257625
- https://render.com/docs/static-sites
- https://supabase.com/pricing

Recherche du 27 octobre 2026. Les prix et quotas externes sont à revérifier avant ouverture commerciale.
