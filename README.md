# Semaine à Table

Planifier ses repas à partir de son placard, adapter les portions et obtenir une liste de courses consolidée. Application francophone pour étudiants, couples, familles et colocations.

## État réel

- Planificateur utilisable sans compte : 16 recettes, filtres, portions, verrouillage de repas, placard avec quantités, courses, export/import JSON et impression.
- Brouillon local au navigateur. Aucun compte ChatGPT requis.
- Base Supabase déployée à Paris. Tests SQL transactionnels réussis : création, mise à jour, quota gratuit, isolation des lectures et modifications entre deux comptes. Données de test annulées par rollback. Les connexions publiques restent désactivées en attente du SMTP et des redirections Auth.
- Fonctions Stripe Checkout, portail et webhook préparées, **non déployées et non validées de bout en bout**. Aucun nouveau produit Stripe créé, aucun encaissement activé. L'interface ne propose pas de paiement.
- **Site public** : https://semaineatable.onrender.com/ — déployé sur Render depuis GitHub.
- Tests du moteur et compilation exécutés avec succès. Ne pas présenter cette bêta comme un SaaS commercial déjà opérationnel.

## Hypothèse commerciale

Découverte gratuite (planificateur complet, une semaine enregistrée) et Plus envisagé à 3,90 €/mois (jusqu'à 52 semaines enregistrées). Le prix, le besoin de stockage et la conversion restent à valider. La présence de concurrents ne prouve pas une demande pour notre offre. Les fonctionnalités payantes doivent procurer assez de valeur pour justifier un abonnement.

Le problème est récurrent : décider des repas, faire l'inventaire et éviter les achats en double. L'ADEME recommande l'inventaire, la planification et une liste de courses. Mealime commercialise une offre Pro ; Jow est un concurrent important. Le positionnement initial est le placard avec quantités, sans intégration à une enseigne et sans API d'IA payante.

Sources consultées le 27 octobre 2026 :
- https://agirpourlatransition.ademe.fr/particuliers/reduire-dechets/eviter-gaspillage/reduire-gaspillage-alimentaire
- https://support.mealime.com/article/79-mealime-pro
- https://apps.apple.com/fr/app/jow-recettes-menus-courses/id1301257625

## Exécution

Node 22.13+ : `npm ci`, `npm test`, `npm run dev`. Production : `npm run build`, sortie `dist/`.

Copier `.env.example` en `.env` pour configurer les seules valeurs publiques Supabase. Ne jamais placer une clé Stripe secrète ou la clé Supabase service role dans une variable `VITE_`.

## Déploiement externe à préparer

1. Connecter Render au dépôt GitHub, créer un **Static Site**, nom neutre `semaineatable` si disponible. Le fichier `render.yaml` prépare `npm ci && npm run build` et `dist`. Utiliser le sous-domaine gratuit attribué par Render ; un nom de domaine personnalisé nécessite un achat séparé.
2. Créer un projet Supabase sur le forfait gratuit et appliquer la migration SQL. Configurer URL du site et redirections Auth avec l'URL Render réellement attribuée.
3. Configurer un SMTP de production dans Supabase. Le service e-mail intégré est limité aux membres de l'équipe et n'est pas adapté aux inscriptions publiques. Aucun fournisseur SMTP n'a été provisionné.
4. Définir `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans Render, puis reconstruire le frontend.
5. Vérifier avec deux comptes : connexion, isolation des données, création, remplacement, suppression, limite gratuite, expiration des droits. Tester aussi les appels API directs malformés et concurrents avant ouverture.
6. Les fonctions Edge vérifient elles-mêmes les identités et signatures, d'où `verify_jwt=false`. Déployer `billing` et `stripe-webhook`. Les secrets côté serveur sont `APP_ORIGIN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, `BILLING_ENABLED=false`. Les variables Supabase serveur sont injectées par Supabase. Le frontend exige aussi `VITE_AUTH_ENABLED=true`, à activer uniquement après validation du SMTP, des redirections et du parcours réel.
7. Créer produit/tarif en **sandbox Stripe** et configurer le webhook pour checkout.session.completed et customer.subscription.created/updated/deleted. Configurer le portail client. Tester paiement, répétitions de checkout, paiements refusés, renouvellement, annulation, événements désordonnés/concurrents et signatures invalides. La gestion des demandes de checkout simultanées et des abonnements multiples doit être renforcée avant activation commerciale.
8. Finaliser l'identité de l'éditeur, le contact, les conditions de vente, la confidentialité, la suppression de compte et les règles de conservation. Valider les recettes en cuisine et les textes commerciaux.
9. L'ouverture des ventes nécessite une revue du parcours et la mise à jour explicite du bouton d'abonnement actuellement désactivé. Ne pas activer simplement un secret et considérer le produit terminé.

Les forfaits gratuits ont des quotas. Supabase peut mettre un projet gratuit en pause après inactivité. Aucun budget payant n'a été engagé. Documentation : https://render.com/docs/static-sites , https://supabase.com/pricing , https://supabase.com/docs/guides/auth/auth-smtp .

## Limites connues

Prix illustratifs internes, non relevés en magasin ; quantités consommées, pas coût exact des conditionnements. Pas de suivi des dates de péremption, d'allergies ou de nutrition. Les recettes initiales doivent être testées en cuisine. Les quantités d'eau dans les étapes sont données pour deux personnes. Le brouillon est enregistré sur l'appareil ; le carnet cloud nécessite une sauvegarde manuelle. Pas encore de synchronisation collaborative. Les codes de paiement sont une base d'intégration désactivée, pas un système de facturation validé pour production.

## Acquisition sans budget : expérimentation proposée

Publier une démonstration courte du parcours placard → semaine → courses et proposer le planificateur gratuit. Contacter uniquement des personnes ayant accepté d'être contactées ; aucun message n'a été envoyé. Chercher d'abord 20 utilisateurs qui reviennent la deuxième semaine, observer leurs difficultés puis tester le prix avec une offre réellement livrable. Arrêter ou modifier l'offre si le carnet payant n'apporte pas une valeur suffisante. Aucun chiffre de revenu n'est garanti.
