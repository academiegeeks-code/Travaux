# mixins/RateLimitMixin.py
import logging
from django.core.cache import cache
from django.http import JsonResponse
from django.http import HttpRequest

RATE_LOGGER = logging.getLogger('django.ratelimit')

class RateLimitMixin:
    rate_limit = 100
    rate_period = 60
    rate_scope = 'ip'

    def get_rate_key(self, request: HttpRequest) -> str:
        if self.rate_scope == 'user' and request.user.is_authenticated:
            identifier = f"user:{request.user.id}"
        else:
            ip = self._get_client_ip(request)
            if not ip:
                ip = 'unknown_ip'
            identifier = f"ip:{ip}"
        
        view_name = self.__class__.__name__.replace(':', '_')
        return f"ratelimit:{identifier}:{view_name}"

    def _get_client_ip(self, request: HttpRequest) -> str:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'unknown_ip')

    def check_rate_limit(self, request: HttpRequest, action: str) -> tuple[bool, dict]:
        key = self.get_rate_key(request)
        try:
            current_count = cache.get(key, 0)
            if current_count >= self.rate_limit:
                rate_info = {'detail': f'Too many {action} attempts. Please try again later.', 'count': current_count}
                self.log_rate_limit_exceeded(request, key, current_count)
                return False, rate_info
            cache.set(key, current_count + 1, timeout=self.rate_period)  # Utiliser set au lieu de incr pour compatibilité
            return True, {}
        except Exception as e:
            RATE_LOGGER.error(f"Cache error for key {key}: {str(e)}")
            return True, {}  # Autoriser si le cache échoue

    def log_rate_limit_exceeded(self, request: HttpRequest, key: str, count: int) -> None:
        ip = self._get_client_ip(request)
        RATE_LOGGER.warning(f"Rate limit exceeded: key={key}, count={count}, path={request.path}, ip={ip}")

    def rate_limit_response(self, request: HttpRequest, rate_info: dict) -> JsonResponse:
        return JsonResponse(rate_info, status=429)

    def dispatch(self, request: HttpRequest, *args, **kwargs):
        allowed, rate_info = self.check_rate_limit(request, action=self.__class__.__name__.lower())
        if not allowed:
            return self.rate_limit_response(request, rate_info)
        return super().dispatch(request, *args, **kwargs)