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
from user_management.Serializers.Services_Serializers import BulkUserCreateSerializer, UserRegistrationSerializer
from user_management.Serializers.User_Serializer import UserSerializer
from user_management.permissions import HasPermissionPermission, Permission
from django.utils.timezone import now


# 🔹 P-A-G-I-N-A-T-I-O-N
class StandardPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

# 🔹 L-I-S-T
class UserListCreateView(LoggingMixin, RateLimitMixin, APIView):
    permission_classes = [HasPermissionPermission]
    required_permission = Permission.MANAGE_USERS
    rate_limit = 10
    rate_period = 60
    rate_scope = 'ip'

    def get(self, request):
        self.setup_logging_context(request)
        allowed, rate_info = self.check_rate_limit(request, action='list_users')
        if not allowed:
            return self.rate_limit_response(request, rate_info)

        #queryset = User.objects.filter(is_active=True).order_by('-date_joined')
        queryset = User.objects.all().order_by('-date_joined')
        
        # Filtres dynamiques via query params
        role = request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)

        domain = request.query_params.get('domain')
        if domain:
            queryset = queryset.filter(profile__domain_study__icontains=domain)

        university = request.query_params.get('university')
        if university:
            queryset = queryset.filter(profile__university_studies__icontains=university)

        # Pagination standard
        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = UserSerializer(page, many=True, context={'request': request})

        self.log_success('list_users', {'count': len(serializer.data), 'role_filter': role})
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        self.setup_logging_context(request)
        allowed, rate_info = self.check_rate_limit(request, action='create_user')
        if not allowed:
            self.log_security_event('user_create_rate_limited', rate_info)
            return self.rate_limit_response(request, rate_info)

        data = request.data.copy()
        # Si pas de role précisé, mettre un rôle par défaut
        data['role'] = data.get('role', 'user')

        serializer = UserSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            user = serializer.save()
            self.log_success('user_created', {'admin': request.user.email, 'user': user.email, 'role': user.role})
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        self.log_error('user_create_failed', Exception('ValidationError'), {'errors': serializer.errors})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# 🔹 D-E-T-A-I-L
class UserDetailView(LoggingMixin, RateLimitMixin, APIView):
    permission_classes = [HasPermissionPermission]
    required_permission = Permission.MANAGE_USERS
    rate_limit = 20
    rate_period = 60
    rate_scope = 'ip'

    def get_object(self, pk):
        return get_object_or_404(User, pk=pk, is_active=True)

    def get(self, request, pk):
        self.setup_logging_context(request)
        user = self.get_object(pk)
        serializer = UserSerializer(user, context={'request': request})
        self.log_success('user_viewed', {'user': user.email, 'role': user.role})
        return Response(serializer.data)

    def put(self, request, pk):
        self.setup_logging_context(request)
        user = self.get_object(pk)
        serializer = UserSerializer(user, data=request.data, partial=True, context={'request': request})

        if serializer.is_valid():
            serializer.save()
            self.log_success('user_updated', {'user': user.email, 'role': user.role})
            return Response(serializer.data)

        self.log_error('user_update_failed', Exception('ValidationError'), {'errors': serializer.errors})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        self.setup_logging_context(request)
        user = self.get_object(pk)

        if not user.is_active:
            return Response({'detail': 'Utilisateur déjà supprimé.'}, status=status.HTTP_400_BAD_REQUEST)

        # Soft delete
        admin_email = request.user.email
        old_email = user.email
        user.is_active = False
        user.email = f"deleted_{user.pk}@removed.local"
        user.first_name = 'Deleted'
        user.last_name = f'User_{user.pk}'
        user.phone = ''
        user.deleted_at = now()
        user.deleted_by = admin_email
        user.save(update_fields=[
            'is_active', 'email', 'first_name', 'last_name', 'phone', 'deleted_at', 'deleted_by'
        ])

        self.log_success('user_soft_deleted', {
            'user_id': user.pk,
            'user_prev_email': old_email,
            'deleted_by': admin_email,
            'timestamp': user.deleted_at.isoformat(),
        })

        return Response({'detail': f'Utilisateur {old_email} supprimé (soft delete).'}, status=status.HTTP_200_OK)

from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

@method_decorator(csrf_exempt, name='dispatch')
class BulkUserImportView( APIView):                  #LoggingMixin, RateLimitMixin,
    permission_classes = [HasPermissionPermission]
    required_permission = "bulk_import_users"
    #rate_limit = 100
    #rate_period = 3600
    #rate_scope = 'user'
    def get(self, request):
        """Méthode temporaire pour tester que la route est accessible"""
        return Response({"message": "GET method works - route is correct"}, status=status.HTTP_200_OK)
        

        

    def post(self, request):
        print("🔍 DEBUG: POST request reçue!")
        print(f"🔍 Method: {request.method}")
        print(f"🔍 Path: {request.path}")
        print(f"🔍 User: {request.user}")
        print(f"🔍 Authenticated: {request.user.is_authenticated}")
        print(f"🔍 FILES: {dict(request.FILES)}")
        print(f"🔍 DATA: {dict(request.data)}")
        #self.setup_logging_context(request)
        #allowed, rate_info = self.check_rate_limit(request, action='bulk_import_users')
        #if not allowed:
        #    return self.rate_limit_response(request, rate_info)

        file = request.FILES.get('file')
        role_from_request = request.data.get('role', 'admin')
        
        # Validation du rôle
        valid_roles = [ 'admin', 'supervisor', 'intern', 'visitor']
        if role_from_request not in valid_roles:
            role_from_request = 'admin'  # Valeur par défaut
        
        if not file:
            return Response({'detail': "Aucun fichier fourni."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if file.name.endswith('.csv'):
                data_bytes = file.read()
                df = pd.read_csv(io.BytesIO(data_bytes), dtype=str)
            elif file.name.endswith(('.xls', '.xlsx')):
                df = pd.read_excel(file, dtype=str)
            else:
                return Response({'detail': "Format de fichier non supporté. Utilisez CSV ou Excel."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            self.log_error('bulk_import_read_error', e)
            return Response({'detail': f"Erreur lecture fichier: {e}"}, status=status.HTTP_400_BAD_REQUEST)

        required_cols = {'first_name', 'last_name', 'email'}
        missing = required_cols - set(df.columns)
        if missing:
            return Response({'detail': f"Colonnes manquantes: {missing}"}, status=status.HTTP_400_BAD_REQUEST)

        # Supprime doublons emails dans le fichier
        df.drop_duplicates(subset=['email'], inplace=True)

        # Conversion en liste de dictionnaires avec validation des rôles
        users_data = []
        for _, row in df.iterrows():
            user_data = {}
            for col in df.columns:
                value = row[col]
                if pd.notna(value):
                    user_data[col] = str(value).strip()
                else:
                    user_data[col] = ''
            
            # Validation et nettoyage du rôle
            role_value = user_data.get('role', role_from_request)
            if role_value not in valid_roles:
                user_data['role'] = role_from_request  # Utiliser le rôle de la requête
            else:
                user_data['role'] = role_value
                
            users_data.append(user_data)
        print(f"📊 Données extraites: {users_data}")

        # Validation et création des utilisateurs
        created_users = []
        errors = []

        for index, user_data in enumerate(users_data, start=2):  # start=2 pour inclure l'en-tête
            try:
                # Nettoyer les données avant validation
                cleaned_data = self.clean_user_data(user_data)
                print(f"🧹 Ligne {index}: Données nettoyées: {cleaned_data}")
                # Validation avec UserRegistrationSerializer
                user_serializer = UserRegistrationSerializer(
                    data=cleaned_data, 
                    context={'request': request}
                )
                
                if user_serializer.is_valid():
                    print(f"✅ Ligne {index}: Validation réussie")
                    user = user_serializer.save()
                    created_users.append({
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name
                    })
                else:
                    print(f"❌ Ligne {index}: Erreurs validation: {user_serializer.errors}")
                    errors.append({
                        'line': index,
                        'email': user_data.get('email', 'N/A'),
                        'errors': user_serializer.errors
                    })
                    
            except Exception as e:
                print(f"💥 Ligne {index}: Exception: {e}")
                errors.append({
                    'line': index,
                    'email': user_data.get('email', 'N/A'),
                    'errors': str(e)
                })

       # self.log_success('bulk_import_users', {
        #    'created_count': len(created_users),
       #     'error_count': len(errors)
       # })
        print(f"✅ Import réussi: {len(created_users)} créés, {len(errors)} erreurs")


        response_data = {
            'created_count': len(created_users),
            'errors': errors,
            'summary': self.analyze_errors(errors),
        }

        if created_users:
            return Response(response_data, status=status.HTTP_201_CREATED)
        else:
            return Response(response_data, status=status.HTTP_400_BAD_REQUEST)

    def clean_user_data(self, user_data):
        """Nettoie et valide les données utilisateur."""
        cleaned = user_data.copy()
        
        # Liste des rôles valides
        valid_roles = ['user', 'admin', 'supervisor', 'intern', 'visitor']
        
        # Nettoyer le rôle
        role = cleaned.get('role', 'user')
        if not isinstance(role, str) or role not in valid_roles:
            cleaned['role'] = 'user'
        
        # S'assurer que les champs requis existent
        for field in ['first_name', 'last_name', 'email']:
            if field not in cleaned:
                cleaned[field] = ''
            elif not isinstance(cleaned[field], str):
                cleaned[field] = str(cleaned[field])
        
        return cleaned

    def analyze_errors(self, errors):
        error_summary = {}
        for err in errors:
            if isinstance(err['errors'], dict):
                for field, field_errors in err['errors'].items():
                    if isinstance(field_errors, list):
                        for error_msg in field_errors:
                            key = f"{field}: {error_msg}"
                            error_summary[key] = error_summary.get(key, 0) + 1
                    else:
                        key = f"{field}: {field_errors}"
                        error_summary[key] = error_summary.get(key, 0) + 1
            else:
                msg = str(err['errors'])
                error_summary[msg] = error_summary.get(msg, 0) + 1
        return error_summary
# 🔹 E-X-P-O-R-T
class UserExportView(LoggingMixin, RateLimitMixin, APIView):
    permission_classes = [HasPermissionPermission]
    required_permission = Permission.MANAGE_USERS
    rate_limit = 3
    rate_period = 60
    rate_scope = 'ip'

    def get(self, request):
        self.setup_logging_context(request)
        allowed, rate_info = self.check_rate_limit(request, action='export_users')
        if not allowed:
            return self.rate_limit_response(request, rate_info)

        queryset = User.objects.filter(is_active=True)

        role = request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)

        domain = request.query_params.get('domain')
        if domain:
            queryset = queryset.filter(profile__domain_study__icontains=domain)

        university = request.query_params.get('university')
        if university:
            queryset = queryset.filter(profile__university_studies__icontains=university)

        data = UserSerializer(queryset, many=True, context={'request': request}).data

        if not data:
            return Response({'detail': "Aucun utilisateur trouvé."}, status=status.HTTP_404_NOT_FOUND)

        file_format = request.query_params.get('format', 'csv').lower()
        filename = f"users_export_{now().strftime('%Y%m%d_%H%M%S')}"

        df = pd.DataFrame(data)
        if file_format == 'excel':
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
                df.to_excel(writer, index=False, sheet_name='Utilisateurs')
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

        self.log_success('users_exported', {
            'count': len(data),
            'filters': {'role': role, 'domain': domain, 'university': university},
            'format': file_format
        })

        return response
