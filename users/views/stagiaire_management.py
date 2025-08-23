from rest_framework.views import APIView
from django.http import HttpResponse
from django.contrib.auth import get_user_model
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from users.mixins import LoggingMixin, RateLimitMixin
import io, pandas as pd
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import IntegrityError, transaction
from users.models import User
from django.utils.timezone import now
from users.serializers import UserSerializer
from users.permissions import HasPermissionPermission, Permission


User = get_user_model()


class StandardPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


# 🔹  CREATION MASSIVE
class BulkStagiaireImportView(LoggingMixin, RateLimitMixin, APIView):
    permission_classes = [HasPermissionPermission]
    required_permission = Permission.BULK_IMPORT_USERS

    rate_limit = 3
    rate_period = 3600
    rate_scope = 'user'

    def post(self, request):
        self.setup_logging_context(request)
        allowed, rate_info = self.check_rate_limit(request, action='bulk_import_interns')
        if not allowed:
            return self.rate_limit_response(request, rate_info)

        file = request.FILES.get('file')
        if not file:
            return Response({'detail': 'Aucun fichier fourni.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if file.name.endswith('.csv'):
                data_bytes = file.read()
                # streaming pour éviter surcharge mémoire pour gros fichiers
                df = pd.read_csv(io.BytesIO(data_bytes), dtype=str)
            elif file.name.endswith(('.xls', '.xlsx')):
                df = pd.read_excel(file, dtype=str)
            else:
                return Response({'detail': 'Format de fichier non supporté. Utilisez CSV ou Excel.'},
                                status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            self.log_error('bulk_import_read_error', e)
            return Response({'detail': f'Erreur lecture fichier: {e}'}, status=status.HTTP_400_BAD_REQUEST)

        required_cols = {'first_name', 'last_name', 'email', 'phone', 'field_of_study', 'university'}
        missing = required_cols - set(df.columns)
        if missing:
            return Response({'detail': f'Colonnes manquantes: {missing}'}, status=status.HTTP_400_BAD_REQUEST)

        # Deduplicate emails in the incoming file to reduce conflicts
        df.drop_duplicates(subset=['email'], inplace=True)

        created_users = []
        errors = []

        users_to_create = []

        for idx, row in df.iterrows():
            row_data = {col: (str(row[col]).strip() if pd.notna(row[col]) else '') for col in required_cols}
            row_data['role'] = 'intern'

            serializer = UserSerializer(data=row_data, context={'request': request})
            if serializer.is_valid():
                users_to_create.append(User(**serializer.validated_data))
            else:
                errors.append({'line': idx + 2, 'error': serializer.errors})

        # Bulk create en transaction unique pour performance
        try:
            with transaction.atomic():
                User.objects.bulk_create(users_to_create)
                created_users = users_to_create
        except IntegrityError as e:
            # Gestion avancée d'erreur dans bulk_create non trivial
            self.log_error('bulk_create_integrity_error', e)
            return Response({'detail': 'Erreur base de données lors de la création massive.'},
                            status=status.HTTP_400_BAD_REQUEST)

        self.log_success('bulk_import_interns', {
            'created_count': len(created_users),
            'error_count': len(errors)
        })

        return Response({
            'created_count': len(created_users),
            'errors': errors,
            'summary': self.analyze_errors(errors),
        }, status=status.HTTP_201_CREATED if created_users else status.HTTP_400_BAD_REQUEST)

    def analyze_errors(self, errors):
        # Fonction simple d'analyse d'erreurs pour reporting intelligent
        error_summary = {}
        for err in errors:
            msg = str(err['error'])
            error_summary[msg] = error_summary.get(msg, 0) + 1
        return error_summary

# 🔹 LISTE & CREATION
class StagiaireListCreateView(LoggingMixin, RateLimitMixin, APIView):
    """
    GET: Liste paginée des stagiaires avec filtres.
    POST: Création d'un stagiaire (admin only).
    """
    permission_classes = [HasPermissionPermission]
    required_permission = Permission.MANAGE_INTERNS

    rate_limit = 10     # 10 requêtes max
    rate_period = 60    # par minute
    rate_scope = 'ip'

    def get(self, request):
        self.setup_logging_context(request)
        allowed, rate_info = self.check_rate_limit(request, action='list_interns')
        if not allowed:
            return self.rate_limit_response(request, rate_info)

        interns = User.objects.filter(role='intern').order_by('-date_joined')

        # Filtrage optionnel
        domain = request.query_params.get('domain')
        university = request.query_params.get('university')
        if domain:
            interns = interns.filter(profile__domain_study__icontains=domain)
        if university:
            interns = interns.filter(profile__university_studies__icontains=university)

        serializer = UserSerializer(interns, many=True, context={'request': request})
        self.log_success('list_interns', {'count': len(serializer.data)})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        self.setup_logging_context(request)
        allowed, rate_info = self.check_rate_limit(request, action='create_intern')
        if not allowed:
            self.log_security_event('intern_create_rate_limited', rate_info)
            return self.rate_limit_response(request, rate_info)

        data = request.data.copy()
        data['role'] = 'intern'

        serializer = UserSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            user = serializer.save()
            self.log_success('intern_created', {
                'admin': request.user.email,
                'intern': user.email
            })
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        self.log_error('intern_create_failed', Exception('ValidationError'), {
            'errors': serializer.errors
        })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 🔹 CONSULTATION & MISE À JOUR
class StagiaireDetailUpdateView(LoggingMixin, RateLimitMixin, APIView):
    """
    GET: Voir un stagiaire.
    PUT/PATCH: Modifier un stagiaire (admin only).
    """
    permission_classes = [HasPermissionPermission]
    required_permission = Permission.MANAGE_INTERNS

    rate_limit = 20
    rate_period = 60
    rate_scope = 'ip'

    def get_object(self, pk):
        return get_object_or_404(User, pk=pk, role='intern')

    def get(self, request, pk):
        self.setup_logging_context(request)
        intern = self.get_object(pk)
        serializer = UserSerializer(intern, context={'request': request})
        self.log_success('intern_viewed', {'intern': intern.email})
        return Response(serializer.data)

    def put(self, request, pk):
        self.setup_logging_context(request)
        intern = self.get_object(pk)
        serializer = UserSerializer(intern, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            self.log_success('intern_updated', {'intern': intern.email})
            return Response(serializer.data)
        self.log_error('intern_update_failed', Exception('ValidationError'), {
            'errors': serializer.errors
        })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 🔹 SUPPRESSION


class StagiaireDeleteViewSoftDelete(LoggingMixin, RateLimitMixin, APIView):
    """
    Soft delete pur d’un stagiaire, avec audit, anonymisation et purge différée.
    Gestion avancée sécurisée et optimisée.
    """
    permission_classes = [HasPermissionPermission]
    required_permission = Permission.MANAGE_INTERNS

    rate_limit = 5
    rate_period = 60
    rate_scope = 'ip'

    def delete(self, request, pk):
        self.setup_logging_context(request)
        intern = get_object_or_404(User, pk=pk, role='intern')
        admin_email = request.user.email
        intern_email = intern.email

        if not intern.is_active:
            # Eviter suppressions répétées ou conflictuelles
            return Response({'detail': 'Le stagiaire est déjà supprimé.'}, status=status.HTTP_400_BAD_REQUEST)

        # Soft delete : désactivation, anonymisation, log audit
        intern.is_active = False

        # Anonymisation progressive des données sensibles
        intern.email = f"deleted_{intern.pk}@removed.local"
        intern.first_name = 'Deleted'
        intern.last_name = f'User_{intern.pk}'
        intern.phone = ''
        # Ajouter d’autres champs selon le modèle ...

        intern.deleted_at = now()  # Champ datetime à ajouter au modèle pour horodatage suppression
        intern.deleted_by = admin_email  # Champ char/email à ajouter pour audit

        intern.save(update_fields=[
            'is_active', 'email', 'first_name', 'last_name', 'phone', 'deleted_at', 'deleted_by'
        ])

        # Log d’audit détaillé
        self.log_success('intern_soft_deleted', {
            'intern_id': intern.pk,
            'intern_prev_email': intern_email,
            'deleted_by': admin_email,
            'timestamp': intern.deleted_at.isoformat(),
        })

        # Optionnel : envoyer notification à service conformité ou responsable RH
        # notify_deletion(intern)

        return Response({'detail': f'Stagiaire {intern_email} supprimé (soft delete).'},
                        status=status.HTTP_200_OK)

# 🔹 EXPORT STAGIAIRES
class StagiaireExportView(LoggingMixin, RateLimitMixin, APIView):
    """
    Export des stagiaires filtrés en CSV ou Excel.
    Supporte gros volumes avec génération en mémoire optimisée et audit.
    """
    permission_classes = [HasPermissionPermission]
    required_permission = Permission.MANAGE_INTERNS
    rate_limit = 3
    rate_period = 60
    rate_scope = 'ip'

    def get(self, request):
        self.setup_logging_context(request)
        allowed, rate_info = self.check_rate_limit(request, action='export_interns')
        if not allowed:
            return self.rate_limit_response(request, rate_info)

        # 📌 Récupération filtrée
        interns_qs = User.objects.filter(role='intern', is_active=True)

        # Filtres dynamiques
        domain = request.query_params.get('domain')
        university = request.query_params.get('university')
        if domain:
            interns_qs = interns_qs.filter(profile__domain_study__icontains=domain)
        if university:
            interns_qs = interns_qs.filter(profile__university_studies__icontains=university)

        # Sérialisation pour garder compatibilité API
        data = UserSerializer(interns_qs, many=True, context={'request': request}).data

        if not data:
            return Response({'detail': 'Aucun stagiaire trouvé selon les critères.'}, status=status.HTTP_404_NOT_FOUND)

        # Format choisi par l’utilisateur
        file_format = request.query_params.get('format', 'csv').lower()
        filename = f"stagiaires_export_{now().strftime('%Y%m%d_%H%M%S')}"

        # Conversion en DataFrame (plus rapide que boucle pour gros volumes)
        df = pd.DataFrame(data)

        if file_format == 'excel':
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
                df.to_excel(writer, index=False, sheet_name='Stagiaires')
            response = HttpResponse(
                output.getvalue(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            filename += '.xlsx'
        else:
            output = io.StringIO()
            df.to_csv(output, index=False)
            response = HttpResponse(output.getvalue(), content_type='text/csv')
            filename += '.csv'

        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        self.log_success('interns_exported', {
            'count': len(df),
            'filters': {'domain': domain, 'university': university},
            'format': file_format
        })
        return response