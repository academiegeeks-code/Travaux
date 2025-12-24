import logging
from ..tasks import send_activation_email
import django.utils.timezone as timezone
from django.utils.timezone import now
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
import re , string, random
from rest_framework.exceptions import ValidationError as DRFValidationError
User = get_user_model()
logger = logging.getLogger(__name__)
import pandas as pd
from io import BytesIO


class UserExportService:
    """Service dédié à l'exportation des utilisateurs en CSV ou Excel selon filtres."""

    @staticmethod
    def build_queryset(filters=None):
        queryset = User.active_objects.all()
        if not filters:
            filters = {}

        role = filters.get('role')
        domain = filters.get('domain')
        university = filters.get('university')

        if role:
            queryset = queryset.filter(role=role)
        if domain:
            queryset = queryset.filter(profile__domain_study__icontains=domain)
        if university:
            queryset = queryset.filter(profile__university_studies__icontains=university)
        return queryset

    @staticmethod
    def serialize_users(queryset, export_fields):
        data = []
        for user in queryset:
            user_data = {
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'status': user.status if hasattr(user, 'status') else '',
                'last_login': user.last_login.isoformat() if user.last_login else '',
                'is_active': 'Yes' if user.is_active else 'No'
            }

            if 'profile_data' in export_fields and hasattr(user, 'profile') and user.profile:
                user_data.update({
                    'profession': getattr(user.profile, 'profession', ''),
                    'specialty': getattr(user.profile, 'specialty', ''),
                    'university': getattr(user.profile, 'university_studies', '') or getattr(user.profile, 'university_teaches', '')
                })
            data.append(user_data)
        return data

    @staticmethod
    def export_to_csv(queryset, export_fields):
        data = UserExportService.serialize_users(queryset, export_fields)
        if not data:
            return ''
        df = pd.DataFrame(data)
        return df.to_csv(index=False, encoding='utf-8-sig')

    @staticmethod
    def export_to_excel(queryset, export_fields):
        data = UserExportService.serialize_users(queryset, export_fields)
        if not data:
            return b''

        df = pd.DataFrame(data)
        output = BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            df.to_excel(writer, index=False, sheet_name='Utilisateurs')
        return output.getvalue()
