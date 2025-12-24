from django.conf import settings
import requests, certifi, logging
logger = logging.getLogger(__name__)

def verify_captcha(token):
    """
    Vérifie la validité du token reCAPTCHA envoyé par le client via l'API Google.
    Args:
        token (str): Le token captcha reçu côté client.
    Returns:
        bool: True si le captcha est validé, False sinon.
    """

    if not token:
        return False

    secret_key = settings.RECAPTCHA_SECRET_KEY  
    payload = {
        'secret': secret_key,
        'response': token,
    }
    try:
        response = requests.post(
            'https://www.google.com/recaptcha/api/siteverify',
            data=payload,
            verify=certifi.where(),
            timeout=5  # Timeout raisonnable 
        )
        response.raise_for_status()
        result = response.json()
        logger.info(f"reCaptcha verification response: {result}")
        return result.get('success', False)

    except requests.exceptions.SSLError as e:
        logger.error(f"Erreur SSL lors de la vérification captcha : {e}")
    except requests.exceptions.RequestException as e:
        logger.error(f"Erreur requête HTTP lors de la vérification captcha : {e}")
    return False