# mixins/LoggingMixin.py
import logging
import time
import json
from django.http import HttpRequest
from django.utils import timezone
from typing import Any, Dict, Optional
import uuid

# Configuration du logger dédié aux audits
AUDIT_LOGGER = logging.getLogger('django.audit')

class LoggingMixin:
    """
    Mixin pour le logging d'audit des actions dans les vues Django.
    """
    LOG_LEVEL_SUCCESS = logging.INFO
    LOG_LEVEL_ERROR = logging.ERROR
    LOG_LEVEL_SECURITY = logging.WARNING
    
    SENSITIVE_FIELDS = {
        'password', 'token', 'secret', 'key', 'authorization',
        'credit_card', 'cvv', 'ssn', 'social_security'
    }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._log_context = {}
        self._log_start_time = None
    
    def setup_logging_context(self, request: HttpRequest, **extra_context: Any) -> None:
        """
        Initialise le contexte de logging avec les informations de base.
        """
        user = getattr(request, 'user', None)
        
        self._log_context = {
            'log_id': str(uuid.uuid4()),
            'timestamp': timezone.now().isoformat(),
            'user_id': getattr(user, 'id', None) if user and user.is_authenticated else None,
            'username': getattr(user, 'email', None) if user and user.is_authenticated else 'anonymous',
            'ip_address': self._get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'http_method': request.method,
            'path': request.path,
            'view_name': self.__class__.__name__,
            **extra_context
        }
    
    def _get_client_ip(self, request: HttpRequest) -> str:
        """
        Extrait l'adresse IP réelle du client en tenant compte des proxies.
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR', '')
        return ip
    
    # Dans LoggingMixin.py
    def _sanitize_data(self, data):
        """Nettoie les données sensibles pour les logs."""
        if isinstance(data, (str, int, float, bool)) or data is None:
            return data
            
        if isinstance(data, dict):
            sanitized = {}
            for key, value in data.items():
                # Vérifier si la clé est une chaîne avant d'appeler .lower()
                if isinstance(key, str):
                    key_lower = key.lower()
                else:
                    key_lower = str(key)
                    
                if any(sensitive in key_lower for sensitive in self.SENSITIVE_FIELDS):
                    sanitized[key] = '***REDACTED***'
                else:
                    sanitized[key] = self._sanitize_data(value)
            return sanitized
            
        if isinstance(data, list):
            return [self._sanitize_data(item) for item in data]
            
        return str(data)
    
    def _format_log_message(self, action: str, status: str, 
                           details: Optional[Dict[str, Any]] = None) -> str:
        """
        Formate le message de log de manière structurée.
        """
        log_data = {
            **self._log_context,
            'action': action,
            'status': status,
            'processing_time': round((time.time() - self._log_start_time) * 1000, 2) if self._log_start_time else None,
            'details': self._sanitize_data(details) if details else {}
        }
        
        return json.dumps(log_data, ensure_ascii=False)
    
    def log_action(self, action: str, status: str, level: int = logging.INFO,
                  details: Optional[Dict[str, Any]] = None) -> None:
        """
        Journalise une action avec le niveau spécifié.
        """
        if not AUDIT_LOGGER.isEnabledFor(level):
            return
        
        message = self._format_log_message(action, status, details)
        
        if level == logging.ERROR:
            AUDIT_LOGGER.error(message)
        elif level == logging.WARNING:
            AUDIT_LOGGER.warning(message)
        elif level == logging.INFO:
            AUDIT_LOGGER.info(message)
        else:
            AUDIT_LOGGER.log(level, message)
    
    def log_success(self, action: str, details: Optional[Dict[str, Any]] = None) -> None:
        """Journalise une action réussie."""
        self.log_action(action, 'success', self.LOG_LEVEL_SUCCESS, details)
    
    def log_error(self, action: str, error: Exception, 
                 details: Optional[Dict[str, Any]] = None) -> None:
        """Journalise une action en erreur."""
        error_details = {
            'error_type': error.__class__.__name__,
            'error_message': str(error),
            **(details or {})
        }
        self.log_action(action, 'error', self.LOG_LEVEL_ERROR, error_details)
    
    def log_security_event(self, action: str, 
                          details: Optional[Dict[str, Any]] = None) -> None:
        """Journalise un événement de sécurité."""
        self.log_action(action, 'security_alert', self.LOG_LEVEL_SECURITY, details)
    
    def dispatch(self, request: HttpRequest, *args, **kwargs):
        """
        Surcharge de dispatch pour le logging automatique des requêtes.
        """
        self.setup_logging_context(request)
        self._log_start_time = time.time()
        
        try:
            response = super().dispatch(request, *args, **kwargs)
            
            if 200 <= response.status_code < 400:
                self.log_success(
                    'request_processed',
                    {'status_code': response.status_code}
                )
            else:
                self.log_error(
                    'request_failed',
                    Exception(f"HTTP {response.status_code}"),
                    {'status_code': response.status_code}
                )
                
            return response
            
        except Exception as e:
            self.log_error('request_exception', e)
            raise