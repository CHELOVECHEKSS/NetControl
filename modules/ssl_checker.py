import ssl
import socket
from datetime import datetime

class SSLChecker:
    def __init__(self):
        pass
    
    def check_ssl(self, hostname, port=443):
        """Проверить SSL сертификат"""
        try:
            context = ssl.create_default_context()
            
            with socket.create_connection((hostname, port), timeout=10) as sock:
                with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cert = ssock.getpeercert()
                    
                    # Парсинг даты истечения
                    not_after = cert.get('notAfter')
                    expiry_date = datetime.strptime(not_after, '%b %d %H:%M:%S %Y %Z')
                    days_left = (expiry_date - datetime.now()).days
                    
                    return {
                        'success': True,
                        'hostname': hostname,
                        'issuer': dict(x[0] for x in cert.get('issuer', [])),
                        'subject': dict(x[0] for x in cert.get('subject', [])),
                        'version': cert.get('version'),
                        'serial_number': cert.get('serialNumber'),
                        'not_before': cert.get('notBefore'),
                        'not_after': not_after,
                        'days_left': days_left,
                        'expired': days_left < 0,
                        'san': cert.get('subjectAltName', [])
                    }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
