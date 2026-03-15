import base64
import hashlib
import secrets
import string
from urllib.parse import quote, unquote

class NetworkTools:
    def __init__(self):
        pass
    
    def base64_encode(self, text):
        """Base64 кодирование"""
        try:
            encoded = base64.b64encode(text.encode()).decode()
            return {'success': True, 'result': encoded}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def base64_decode(self, text):
        """Base64 декодирование"""
        try:
            decoded = base64.b64decode(text.encode()).decode()
            return {'success': True, 'result': decoded}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def url_encode(self, text):
        """URL кодирование"""
        try:
            encoded = quote(text)
            return {'success': True, 'result': encoded}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def url_decode(self, text):
        """URL декодирование"""
        try:
            decoded = unquote(text)
            return {'success': True, 'result': decoded}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def hash_text(self, text, algorithm='md5'):
        """Хеширование текста"""
        try:
            if algorithm == 'md5':
                result = hashlib.md5(text.encode()).hexdigest()
            elif algorithm == 'sha1':
                result = hashlib.sha1(text.encode()).hexdigest()
            elif algorithm == 'sha256':
                result = hashlib.sha256(text.encode()).hexdigest()
            elif algorithm == 'sha512':
                result = hashlib.sha512(text.encode()).hexdigest()
            else:
                return {'success': False, 'error': 'Unknown algorithm'}
            
            return {'success': True, 'result': result, 'algorithm': algorithm}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def generate_password(self, length=16, use_special=True):
        """Генерация пароля"""
        try:
            chars = string.ascii_letters + string.digits
            if use_special:
                chars += string.punctuation
            
            password = ''.join(secrets.choice(chars) for _ in range(length))
            
            return {'success': True, 'password': password}
        except Exception as e:
            return {'success': False, 'error': str(e)}
