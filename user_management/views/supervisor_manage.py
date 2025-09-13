from rest_framework.views import APIView
from django.http import HttpResponse
from django.contrib.auth import get_user_model
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from user_management.mixins import LoggingMixin, RateLimitMixin
import io, pandas as pd
from rest_framework.response import Response
from rest_framework import status
from django.db import IntegrityError, transaction
from user_management.models import User
from user_management.Serializers.User_Serializer import UserSerializer
from user_management import HasPermissionPermission, Permission
from django.utils.timezone import now


User = get_user_model()


class StandardPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


# 🔹 CREATION MASSIVE
class BulkSupervisorImportView(LoggingMixin, RateLimitMixin, APIView):
    permission_classes = [HasPermissionPermission]
    required_permission = Permission.BULK_IMPORT_USERS

    rate_limit = 3
    rate_period = 3600
    rate_scope = 'user'

    def post(self, request):
        self.setup_logging_context(request)
        allowed, rate_info = self.check_rate_limit(request, action='bulk_import_supervisors')
        if not allowed:
            return self.rate_limit_response(request, rate_info)

        file = request.FILES.get('file')
        if not file:
            return Response({'detail': 'Aucun fichier fourni.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if file.name.endswith('.csv'):
                data_bytes = file.read()
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

        df.drop_duplicates(subset=['email'], inplace=True)

        created_users = []
        errors = []

        users_to_create = []

        for idx, row in df.iterrows():
            row_data = {col: (str(row[col]).strip() if pd.notna(row[col]) else '') for col in required_cols}
            row_data['role'] = 'supervisor'

            serializer = UserSerializer(data=row_data, context={'request': request})
            if serializer.is_valid():
                users_to_create.append(User(**serializer.validated_data))
            else:
                errors.append({'line': idx + 2, 'error': serializer.errors})

        try:
            with transaction.atomic():
                User.objects.bulk_create(users_to_create)
                created_users = users_to_create
        except IntegrityError as e:
            self.log_error('bulk_create_integrity_error', e)
            return Response({'detail': 'Erreur base de données lors de la création massive.'},
                            status=status.HTTP_400_BAD_REQUEST)

        self.log_success('bulk_import_supervisors', {
            'created_count': len(created_users),
            'error_count': len(errors)
        })

        return Response({
            'created_count': len(created_users),
            'errors': errors,
            'summary': self.analyze_errors(errors),
        }, status=status.HTTP_201_CREATED if created_users else status.HTTP_400_BAD_REQUEST)

    def analyze_errors(self, errors):
        error_summary = {}
        for err in errors:
            msg = str(err['error'])
            error_summary[msg] = error_summary.get(msg, 0) + 1
        return error_summary


# 🔹 LISTE & CREATION
class SupervisorListCreateView(LoggingMixin, RateLimitMixin, APIView):
    """
    GET: Liste paginée des maitres de suivi avec filtres.
    POST: Création d'un maitre de suivi (admin only).
    """
    permission_classes = [HasPermissionPermission]
    required_permission = Permission.MANAGE_SUPERVISORS

    rate_limit = 10
    rate_period = 60
    rate_scope = 'ip'

    def get(self, request):
        self.setup_logging_context(request)
        allowed, rate_info = self.check_rate_limit(request, action='list_supervisors')
        if not allowed:
            return self.rate_limit_response(request, rate_info)

        supervisors = User.objects.filter(role='supervisor').order_by('-date_joined')

        domain = request.query_params.get('domain')
        university = request.query_params.get('university')
        if domain:
            supervisors = supervisors.filter(profile__domain_study__icontains=domain)
        if university:
            supervisors = supervisors.filter(profile__university_studies__icontains=university)

        serializer = UserSerializer(supervisors, many=True, context={'request': request})
        self.log_success('list_supervisors', {'count': len(serializer.data)})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        self.setup_logging_context(request)
        allowed, rate_info = self.check_rate_limit(request, action='create_supervisor')
        if not allowed:
            self.log_security_event('supervisor_create_rate_limited', rate_info)
            return self.rate_limit_response(request, rate_info)

        data = request.data.copy()
        data['role'] = 'supervisor'

        serializer = UserSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            user = serializer.save()
            self.log_success('supervisor_created', {
                'admin': request.user.email,
                'supervisor': user.email
            })
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        self.log_error('supervisor_create_failed', Exception('ValidationError'), {
            'errors': serializer.errors
        })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 🔹 CONSULTATION & MISE À JOUR
class SupervisorDetailUpdateView(LoggingMixin, RateLimitMixin, APIView):
    """
    GET: Voir un maitre de suivi.
    PUT/PATCH: Modifier un maitre de suivi (admin only).
    """
    permission_classes = [HasPermissionPermission]
    required_permission = Permission.MANAGE_SUPERVISORS

    rate_limit = 20
    rate_period = 60
    rate_scope = 'ip'

    def get_object(self, pk):
        return get_object_or_404(User, pk=pk, role='supervisor')

    def get(self, request, pk):
        self.setup_logging_context(request)
        supervisor = self.get_object(pk)
        serializer = UserSerializer(supervisor, context={'request': request})
        self.log_success('supervisor_viewed', {'supervisor': supervisor.email})
        return Response(serializer.data)

    def put(self, request, pk):
        self.setup_logging_context(request)
        supervisor = self.get_object(pk)
        serializer = UserSerializer(supervisor, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            self.log_success('supervisor_updated', {'supervisor': supervisor.email})
            return Response(serializer.data)
        self.log_error('supervisor_update_failed', Exception('ValidationError'), {
            'errors': serializer.errors
        })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 🔹 SUPPRESSION SOFT DELETE
class SupervisorDeleteViewSoftDelete(LoggingMixin, RateLimitMixin, APIView):
    """
    Soft delete pur d’un maitre de suivi, avec audit, anonymisation et purge différée.
    Gestion avancée sécurisée et optimisée.
    """
    permission_classes = [HasPermissionPermission]
    required_permission = Permission.MANAGE_SUPERVISORS

    rate_limit = 5
    rate_period = 60
    rate_scope = 'ip'

    def delete(self, request, pk):
        self.setup_logging_context(request)
        supervisor = get_object_or_404(User, pk=pk, role='supervisor')
        admin_email = request.user.email
        supervisor_email = supervisor.email

        if not supervisor.is_active:
            return Response({'detail': 'Le maitre de suivi est déjà supprimé.'}, status=status.HTTP_400_BAD_REQUEST)

        supervisor.is_active = False
        supervisor.email = f"deleted_{supervisor.pk}@removed.local"
        supervisor.first_name = 'Deleted'
        supervisor.last_name = f'User_{supervisor.pk}'
        supervisor.phone_number = ''

        supervisor.deleted_at = now()
        supervisor.deleted_by = admin_email

        supervisor.save(update_fields=[
            'is_active', 'email', 'first_name', 'last_name', 'phone_number', 'deleted_at', 'deleted_by'
        ])

        self.log_success('supervisor_soft_deleted', {
            'supervisor_id': supervisor.pk,
            'supervisor_prev_email': supervisor_email,
            'deleted_by': admin_email,
            'timestamp': supervisor.deleted_at.isoformat(),
        })

        return Response({'detail': f'Maitre de suivi {supervisor_email} supprimé (soft delete).'},
                        status=status.HTTP_200_OK)

# 🔹 EXPORT SUPERVISEURS

class SupervisorExportView(LoggingMixin, RateLimitMixin, APIView):
    """
    Export des maitres de suivi filtrés en CSV ou Excel.
    Supporte gros volumes avec génération en mémoire optimisée et audit.
    """
    permission_classes = [HasPermissionPermission]
    required_permission = Permission.MANAGE_SUPERVISORS

    rate_limit = 3
    rate_period = 60
    rate_scope = 'ip'

    def get(self, request):
        self.setup_logging_context(request)
        allowed, rate_info = self.check_rate_limit(request, action='export_supervisors')
        if not allowed:
            return self.rate_limit_response(request, rate_info)

        supervisors_qs = User.objects.filter(role='supervisor', is_active=True)

        domain = request.query_params.get('domain')
        university = request.query_params.get('university')
        if domain:
            supervisors_qs = supervisors_qs.filter(profile__domain_study__icontains=domain)
        if university:
            supervisors_qs = supervisors_qs.filter(profile__university_studies__icontains=university)

        data = UserSerializer(supervisors_qs, many=True, context={'request': request}).data

        if not data:
            return Response({'detail': 'Aucun maitre de suivi trouvé selon les critères.'}, status=status.HTTP_404_NOT_FOUND)

        file_format = request.query_params.get('format', 'csv').lower()
        filename = f"supervisors_export_{now().strftime('%Y%m%d_%H%M%S')}"

        df = pd.DataFrame(data)

        if file_format == 'excel':
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
                df.to_excel(writer, index=False, sheet_name='Maitres_de_suivi')
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

        self.log_success('supervisors_exported', {
            'count': len(df),
            'filters': {'domain': domain, 'university': university},
            'format': file_format
        })

        return response
