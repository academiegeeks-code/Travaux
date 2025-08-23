"""
users/views.py
Ce module contient les vues API pour la gestion des utilisateurs, l'authentification, 
la suggestion, l'activation de compte, la réinitialisation du mot de passe et les statistiques publiques dans l'application utilisant Django REST Framework.
Classes principales :
---------------------
- StandardPagination : Pagination standard pour les listes d'utilisateurs.
- CustomTokenObtainPairView : Vue personnalisée pour l'obtention de tokens JWT.
- UserListView : Liste et création d'utilisateurs (accès administrateur ou rôles limités).
- UserDetailView : Consultation, modification et suppression d'un utilisateur (accès administrateur ou utilisateur lui-même).
- BulkUserCreateView : Importation massive d'utilisateurs (accès administrateur).
- SuggestionView : Soumission de suggestions (authentifié ou anonyme, limité par IP).
- ActivationView : Activation de compte utilisateur via email et token.
- PasswordResetRequestView : Demande de réinitialisation de mot de passe.
- PasswordResetConfirmView : Confirmation de la réinitialisation du mot de passe.
- StatsView : Statistiques publiques sur les utilisateurs et suggestions.
Permissions :
-------------
Chaque vue critique utilise des permissions personnalisées pour restreindre l'accès selon le rôle et les droits de l'utilisateur.
Pagination :
------------
La pagination standard est appliquée à la liste des utilisateurs pour optimiser la performance et l'expérience utilisateur.
Ratelimiting :
--------------
La soumission de suggestions est limitée à 10 requêtes par heure et par IP pour éviter les abus.
Sérialisation :
---------------
Les sérialiseurs personnalisés sont utilisés pour valider et transformer les données des utilisateurs, suggestions et opérations de sécurité.
Utilisation :
-------------
Ce module est destiné à être utilisé comme point d'entrée pour toutes les opérations liées aux utilisateurs dans l'API REST de l'application.
"""
from rest_framework.pagination import PageNumberPagination

class StandardPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100







