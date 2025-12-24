from rest_framework.views import APIView
from django.http import HttpResponse
from django.contrib.auth import get_user_model
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework import status
from django.utils.timezone import now
from user_management.mixins import LoggingMixin, RateLimitMixin
import io, pandas as pd, tempfile
from django.utils.timezone import now
from datetime import timedelta

import uuid
from django.db import transaction
import logging
from user_management.models import User
from user_management.Serializers.User_Serializer import UserSerializer, UserRegistrationSerializer
from user_management.permissions import Permission
from rest_framework.permissions import IsAuthenticated
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from user_management.Services.ExportService import UserExportService

# Pagination
class StandardPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100
    
# Vue pour les détails et la mise à jour d'un utilisateur
class UserDetailView(LoggingMixin, RateLimitMixin, APIView):
    permission_classes = [IsAuthenticated]
    rate_limit = 20
    rate_period = 60
    rate_scope = 'ip'

    def get_object(self, pk):
        return get_object_or_404(User, pk=pk, is_active=True)

    def get(self, request, pk):
        self.setup_logging_context(request)
        user = self.get_object(pk)

        # Restrict non-admins to viewing supervisors and interns
        if request.user.role != 'admin' and user.role not in ['supervisor', 'intern']:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        serializer = UserSerializer(user, context={'request': request})
        self.log_success('user_viewed', {'user': user.email, 'role': user.role})
        return Response(serializer.data)

    def put(self, request, pk):
        self.setup_logging_context(request)
        user = self.get_object(pk)

        # Only admins can update users
        if request.user.role != 'admin' or not request.user.has_perm(Permission.MANAGE_USERS):
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        serializer = UserSerializer(user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            self.log_success('user_updated', {'user': user.email, 'role': user.role})
            return Response(serializer.data)

        self.log_error('user_update_failed', Exception('ValidationError'), {'errors': serializer.errors})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
# Dans UserDetailView - ajoute cette méthode
    def patch(self, request, pk):
        """Méthode pour archiver OU restaurer un utilisateur"""
        self.setup_logging_context(request)
        
        # Récupérer l'utilisateur (même les inactifs pour la restauration)
        user = get_object_or_404(User, pk=pk)  # Retire is_active=True pour pouvoir restaurer
        
        # Vérification des permissions
        if request.user.role != 'admin' or not request.user.has_perm(Permission.MANAGE_USERS):
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Déterminer l'action en fonction des données reçues
        action = request.data.get('action')
        is_active = request.data.get('is_active')
        
        # Si action est spécifiée explicitement
        if action == 'restore':
            return self._restore_user(user, request.user)
        elif action == 'archive':
            return self._archive_user(user, request.user)
        
        # Sinon, utiliser is_active pour déterminer l'action
        if is_active is True:
            return self._restore_user(user, request.user)
        elif is_active is False:
            return self._archive_user(user, request.user)
        else:
            return Response({'detail': 'Action non spécifiée'}, status=status.HTTP_400_BAD_REQUEST)

    def _archive_user(self, user, admin_user):
        """Sous-méthode pour l'archivage"""
        if not user.is_active:
            return Response({'detail': 'Utilisateur déjà archivé.'}, status=status.HTTP_400_BAD_REQUEST)

        old_email = user.email
        
        # Archivage
        user.is_active = False
        user.status = 'Archivé'
        user.deleted_at = now()
        user.deleted_by = admin_user
        
        user.save(update_fields=['is_active', 'status', 'deleted_at', 'deleted_by'])

        self.log_success('user_archived', {
            'user_id': user.pk,
            'user_email': old_email,
            'archived_by': admin_user.email,
        })

        return Response({
            'detail': f'Utilisateur {old_email} archivé avec succès.',
            'user': {
                'id': user.pk,
                'email': old_email,
                'status': user.status,
                'is_active': user.is_active
            }
        }, status=status.HTTP_200_OK)

    def _restore_user(self, user, admin_user):
        """Sous-méthode pour la restauration"""
        if user.is_active:
            return Response({'detail': 'Utilisateur déjà actif.'}, status=status.HTTP_400_BAD_REQUEST)

        # Restauration
        user.is_active = True
        user.status = 'Actif'
        user.deleted_at = None
        user.deleted_by = None
        
        user.save(update_fields=['is_active', 'status', 'deleted_at', 'deleted_by'])

        self.log_success('user_restored', {
            'user_id': user.pk,
            'user_email': user.email,
            'restored_by': admin_user.email,
        })

        return Response({
            'detail': f'Utilisateur {user.email} restauré avec succès.',
            'user': {
                'id': user.pk,
                'email': user.email,
                'status': user.status,
                'is_active': user.is_active
            }
        }, status=status.HTTP_200_OK)
    
    def delete(self, request, pk):
        """Suppression définitive (optionnelle) - CORRIGÉE"""
        self.setup_logging_context(request)
        user = self.get_object(pk)

        # Only admins can delete users
        if request.user.role != 'admin' or not request.user.has_perm(Permission.MANAGE_USERS):
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        if not user.is_active:
            return Response({'detail': 'Utilisateur déjà supprimé.'}, status=status.HTTP_400_BAD_REQUEST)

        admin_user = request.user  # ← CORRECTION: Instance User
        old_email = user.email
        
        user.is_active = False
        user.email = f"deleted_{user.pk}@removed.local"
        user.first_name = 'Deleted'
        user.last_name = f'User_{user.pk}'
        user.phone = ''
        user.deleted_at = now()
        user.deleted_by = admin_user  # ← CORRECTION: Instance User
        
        user.save(update_fields=[
            'is_active', 'email', 'first_name', 'last_name', 'phone', 'deleted_at', 'deleted_by'
        ])

        self.log_success('user_soft_deleted', {
            'user_id': user.pk,
            'user_prev_email': old_email,
            'deleted_by': admin_user.email,  # ← Email pour le log seulement
            'timestamp': user.deleted_at.isoformat(),
        })

        return Response({'detail': f'Utilisateur {old_email} supprimé (soft delete).'}, status=status.HTTP_200_OK)
     
# Vue pour l'importation en masse d'utilisateurs
@method_decorator(csrf_exempt, name='dispatch')
class BulkUserImportView(APIView):
    permission_classes = [IsAuthenticated]
    required_permission = 'users.BULK_IMPORT_USERS'  # permission dédiée

    def get(self, request):
        return Response({"message": "GET method works - route is correct"}, status=status.HTTP_200_OK)

    def post(self, request):
        if not request.user.has_perm(self.required_permission):
            return Response({'detail': 'Permission denied'}, status=403)
        
        file = request.FILES.get('file')
        if not file:
            return Response({'detail': "Aucun fichier fourni."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Save file temporarily
            suffix = '.csv' if file.name.endswith('.csv') else '.xlsx'
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
                for chunk in file.chunks():
                    temp_file.write(chunk)
                temp_file_path = temp_file.name

            # Validate file format and columns
            if file.name.endswith('.csv'):
                df = pd.read_csv(temp_file_path, dtype=str)
            elif file.name.endswith(('.xls', '.xlsx')):
                df = pd.read_excel(temp_file_path, dtype=str)
            else:
                import os
                os.remove(temp_file_path)
                return Response({'detail': "Format de fichier non supporté. Utilisez CSV ou Excel."}, 
                              status=status.HTTP_400_BAD_REQUEST)

            required_cols = {'nom', 'prenom', 'email'}
            missing = required_cols - set(df.columns)
            if missing:
                import os
                os.remove(temp_file_path)
                return Response({'detail': f"Colonnes manquantes: {missing}"}, 
                              status=status.HTTP_400_BAD_REQUEST)

            from Travaux.user_management.Services.services import UserImportService
            import math
            # Process users and supervisors
            service = UserImportService()
            #results = self.process_users(df, request.user, service)  # ✅
            #results = UserImportService.import_from_csv(df, request.user, service)
            #results = service.import_from_csv(temp_file_path, request.user)  # ✅
            results = self.process_users(df, request.user, service)
                
                # Nettoyez les NaN avant de renvoyer la réponse
            def clean_nan(obj):
                if isinstance(obj, float) and math.isnan(obj):
                        return None
                elif isinstance(obj, dict):
                        return {k: clean_nan(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                        return [clean_nan(item) for item in obj]
                return obj
                
            response_data = {
                'created_count': results['success'],
                'errors': clean_nan(results['errors']),
                'skipped': results['skipped']
            }
            if results['success'] > 0:
                return Response(response_data, status=status.HTTP_201_CREATED)
            return Response(response_data, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            import os
            if 'temp_file_path' in locals():
                os.remove(temp_file_path)
            logger.error(f"Erreur lors de l'importation: {str(e)}")
            return Response({'detail': f"Erreur lors de l'importation: {str(e)}"}, 
                          status=status.HTTP_400_BAD_REQUEST)

    def process_users(self, df, imported_by, service):
        results = {
            'success': 0,
            'errors': [],
            'skipped': 0,
        }
        users_to_create = []
        emails_seen = set()

        with transaction.atomic():
            for i, row in df.iterrows():
                line_num = i + 2  # Account for header and 1-based indexing
                try:
                    email = str(row.get('email', '')).strip()
                    normalized_email = service.normalize_email(email)
                    first_name = str(row.get('prenom', '')).strip()
                    last_name = str(row.get('nom', '')).strip()
                    supervisor_email = str(row.get('supervisor_email', '')).strip() or None

                    if not email or not first_name or not last_name:
                        raise ValueError("Email, prenom, et nom sont requis.")

                    if normalized_email in emails_seen:
                        raise ValueError("Email dupliqué dans le fichier.")
                    emails_seen.add(normalized_email)

                    if User.objects.filter(email__iexact=normalized_email).exists():
                        raise ValueError("Email déjà existant dans la base.")

                    # Create stagiaire
                    stagiaire_data = {
                        'email': normalized_email,
                        'first_name': first_name,
                        'last_name': last_name,
                        'role': 'intern',
                        'is_active': False,
                    }
                    stagiaire = User(**stagiaire_data)
                    stagiaire.set_password(service.generate_secure_temp_password())
                    stagiaire.must_change_password = True
                    stagiaire.password_expiry = now() + timedelta(hours=24)
                    stagiaire.activation_token = uuid.uuid4()
                    stagiaire.activation_token_expiry = now() + timedelta(hours=48)
                    users_to_create.append(stagiaire)

                    # Handle supervisor
                    if supervisor_email:
                        normalized_supervisor_email = service.normalize_email(supervisor_email)
                        if normalized_supervisor_email in emails_seen:
                            raise ValueError("Email du superviseur dupliqué dans le fichier.")
                        emails_seen.add(normalized_supervisor_email)

                        if not User.objects.filter(email__iexact=normalized_supervisor_email).exists():
                            supervisor_data = {
                                'email': normalized_supervisor_email,
                                'first_name': '',
                                'last_name': '',
                                'role': 'supervisor',
                                'is_active': False,
                            }
                            supervisor = User(**supervisor_data)
                            supervisor.set_password(service.generate_secure_temp_password())
                            supervisor.must_change_password = True
                            supervisor.password_expiry = now() + timedelta(hours=24)
                            supervisor.activation_token = uuid.uuid4()
                            supervisor.activation_token_expiry = now() + timedelta(hours=48)
                            users_to_create.append(supervisor)

                except Exception as e:
                    results['errors'].append({
                        'line': line_num,
                        'email': email,
                        'error': str(e),
                        'data': dict(row)
                    })
                    results['skipped'] += 1
                    logger.error(f"Erreur ligne {line_num}: {str(e)}")

            if not users_to_create:
                logger.warning(f"Aucun utilisateur valide à importer par {imported_by}")
                return results

            try:
                User.objects.bulk_create(users_to_create, ignore_conflicts=False)
                results['success'] = len(users_to_create)
                logger.info(f"Import réussi: {results['success']} utilisateurs créés par {imported_by}")

                # Send activation emails
                for user in users_to_create:
                    try:
                        from user_management.tasks import send_activation_email
                        send_activation_email(
                            user.email,
                            user.first_name,
                            user.activation_token,
                            user.activation_token_expiry.isoformat(),
                            user.password_expiry.isoformat()
                        )
                        logger.info(f"Email d'activation envoyé à {user.email}")
                    except Exception as e:
                        logger.error(f"Échec envoi email d'activation à {user.email}: {str(e)}")

            except Exception as e:
                logger.error(f"Erreur lors de bulk_create: {str(e)}")
                raise

        return results

# Vue pour la création d'un utilisateur unique
@method_decorator(csrf_exempt, name='dispatch')
class SingleUserCreateView(APIView):
    permission_classes = [IsAuthenticated]
    required_permission = 'users.create_single'  # permission dédiée

    def post(self, request):
        user = request.user
        if not user.has_perm(self.required_permission):
            return Response({'detail': "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)

        # Extraction et nettoyage des données
        email = str(request.data.get('email', '')).strip()
        first_name = str(request.data.get('prenom', '')).strip()
        last_name = str(request.data.get('nom', '')).strip()
        supervisor_email = str(request.data.get('supervisor_email', '')).strip() or None

        if not email or not first_name or not last_name:
            return Response({'detail': "Email, prénom, et nom sont requis."}, status=status.HTTP_400_BAD_REQUEST)

        from user_management.Services.ImportService import UserImportService
        service = UserImportService()
        normalized_email = service.normalize_email(email)

        # Check if email already exists
        if User.objects.filter(email__iexact=normalized_email).exists():
            return Response({'detail': "Email déjà existant dans la base."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                # Création stagiaire
                stagiaire_data = {
                    'email': normalized_email,
                    'first_name': first_name,
                    'last_name': last_name,
                    'role': 'intern',
                    'is_active': False,
                }
                stagiaire = User(**stagiaire_data)
                stagiaire.set_password(service.generate_secure_temp_password())
                stagiaire.must_change_password = True
                stagiaire.password_expiry = now() + timedelta(hours=24)
                stagiaire.activation_token = uuid.uuid4()
                stagiaire.activation_token_expiry = now() + timedelta(hours=48)
                stagiaire.save()

                # Création superviseur si nécessaire
                if supervisor_email:
                    normalized_supervisor_email = service.normalize_email(supervisor_email)
                    if User.objects.filter(email__iexact=normalized_supervisor_email).exists():
                        supervisor = User.objects.get(email__iexact=normalized_supervisor_email)
                    else:
                        supervisor_data = {
                            'email': normalized_supervisor_email,
                            'first_name': '',
                            'last_name': '',
                            'role': 'supervisor',
                            'is_active': False,
                        }
                        supervisor = User(**supervisor_data)
                        supervisor.set_password(service.generate_secure_temp_password())
                        supervisor.must_change_password = True
                        supervisor.password_expiry = now() + timedelta(hours=24)
                        supervisor.activation_token = uuid.uuid4()
                        supervisor.activation_token_expiry = now() + timedelta(hours=48)
                        supervisor.save()

                # Envoi email activation stagiaire
                from user_management.tasks import send_activation_email
                send_activation_email(
                    stagiaire.email,
                    stagiaire.first_name,
                    stagiaire.activation_token,
                    stagiaire.activation_token_expiry.isoformat(),
                    stagiaire.password_expiry.isoformat()
                )

                # Envoi email activation superviseur si nouveau
                if supervisor_email and supervisor.id and supervisor.id != stagiaire.id:
                    try:
                        send_activation_email(
                            supervisor.email,
                            supervisor.first_name,
                            supervisor.activation_token,
                            supervisor.activation_token_expiry.isoformat(),
                            supervisor.password_expiry.isoformat(),
                        )
                    except Exception as e:
                        logger.error(f"Échec envoi email d'activation au superviseur {supervisor.email}: {str(e)}")

                return Response({'detail': "Utilisateur créé avec succès."}, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Erreur lors de la création utilisateur: {str(e)}")
            return Response({'detail': f"Erreur lors de la création: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

# Vue pour l'exportation des utilisateurs
@method_decorator(csrf_exempt, name='dispatch')
class UserExportView(LoggingMixin, RateLimitMixin, APIView):
    # Définition de la permission requise
    required_permission = Permission.MANAGE_USERS

    # Limitation du nombre de requêtes (ex: 3 requêtes toutes les 60 secondes par IP)
    rate_limit = 3
    rate_period = 60
    rate_scope = 'ip'

    def get(self, request):
        self.setup_logging_context(request)

        # Vérification de la limite de requêtes
        allowed, rate_info = self.check_rate_limit(request, action='export_users')
        if not allowed:
            return self.rate_limit_response(request, rate_info)

        # Vérification de la permission user
        if not request.user.has_perm(self.required_permission):
            return Response({'detail': "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)

        # Récupération et préparation des filtres
        filters = {
            'role': request.query_params.get('role'),
            'domain': request.query_params.get('domain'),
            'university': request.query_params.get('university'),
        }

        # Obtention du queryset filtré via le service
        queryset = UserExportService.build_queryset(filters)

        # Choix des champs à exporter - ajustez selon votre besoin
        export_fields = {'profile_data'}

        if not queryset.exists():
            return Response({'detail': "Aucun utilisateur trouvé."}, status=status.HTTP_404_NOT_FOUND)

        # Format d'export demandé (csv par défaut)
        file_format = request.query_params.get('format', 'csv').lower()
        filename = f"users_export_{now().strftime('%Y%m%d_%H%M%S')}"

        try:
            if file_format == 'excel':
                file_content = UserExportService.export_to_excel(queryset, export_fields)
                content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                filename += '.xlsx'
            else:
                file_content = UserExportService.export_to_csv(queryset, export_fields)
                content_type = 'text/csv'
                filename += '.csv'

            response = HttpResponse(file_content, content_type=content_type)
            response['Content-Disposition'] = f'attachment; filename="{filename}"'

            # Logging succès export
            self.log_success('users_exported', {
                'count': queryset.count(),
                'filters': filters,
                'format': file_format
            })

            return response

        except Exception as e:
            logger.error(f"Erreur lors de l'export utilisateur: {str(e)}")
            return Response({'detail': f"Erreur lors de l'export: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)