# mixins/RateLimitMixin.py
import logging
import time
from django.core.cache import cache
from django.http import JsonResponse, HttpRequest

RATE_LOGGER = logging.getLogger('django.ratelimit')

class RateLimitMixin:
    rate_limit = 100  # Nombre maximum de requêtes
    rate_period = 60  # Période en secondes
    rate_scope = 'ip'  # 'ip' ou 'user'

    def get_rate_key(self, request: HttpRequest) -> str:
        if self.rate_scope == 'user' and request.user.is_authenticated:
            identifier = f"user:{request.user.id}"
        else:
            ip = self._get_client_ip(request)
            identifier = f"ip:{ip}" if ip else 'ip:unknown'
        
        view_name = self.__class__.__name__
        return f"ratelimit:{identifier}:{view_name}"

    def _get_client_ip(self, request: HttpRequest) -> str:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')

    def check_rate_limit(self, request: HttpRequest, action: str) -> tuple[bool, dict]:
        key = self.get_rate_key(request)
        try:
            # Récupérer la valeur du cache
            cached_value = cache.get(key, 0)
            
            # Gérer le cas où la valeur est un dictionnaire (erreur précédente)
            if isinstance(cached_value, dict):
                # Corriger la valeur erronée - utiliser la valeur count si elle existe
                current_count = cached_value.get('count', 0)
                # Réécrire la valeur correctement
                cache.set(key, current_count, self.rate_period)
            else:
                current_count = cached_value
            
            # Vérifier la limite
            if current_count >= self.rate_limit:
                rate_info = {
                    'detail': f'Too many {action} attempts. Please try again later.', 
                    'count': current_count
                }
                self.log_rate_limit_exceeded(request, key, current_count)
                return False, rate_info
            
            # Incrémenter le compteur
            cache.set(key, current_count + 1, self.rate_period)
            return True, {}
            
        except Exception as e:
            RATE_LOGGER.error(f"Cache error for key {key}: {str(e)}")
            # En cas d'erreur, on autorise la requête
            return True, {}

    def log_rate_limit_exceeded(self, request: HttpRequest, key: str, count: int) -> None:
        ip = self._get_client_ip(request)
        user = request.user if request.user.is_authenticated else 'anonymous'
        RATE_LOGGER.warning(
            f"Rate limit exceeded - Key: {key}, Count: {count}, "
            f"Path: {request.path}, IP: {ip}, User: {user}"
        )

    def rate_limit_response(self, rate_info: dict) -> JsonResponse:
        return JsonResponse(rate_info, status=429)

    def dispatch(self, request: HttpRequest, *args, **kwargs):
        allowed, rate_info = self.check_rate_limit(request, action=self.__class__.__name__.lower())
        if not allowed:
            return self.rate_limit_response(rate_info)
        return super().dispatch(request, *args, **kwargs)