import socket
import json
import requests

class IPGeolocation:
    def __init__(self):
        pass
    
    def lookup(self, ip):
        """Получить геолокацию IP через бесплатный API"""
        try:
            # Получение hostname
            try:
                hostname = socket.gethostbyaddr(ip)[0]
            except:
                hostname = 'N/A'
            
            # Определение типа IP
            ip_type = 'IPv4' if ':' not in ip else 'IPv6'
            
            # Проверка на приватный IP
            is_private = self._is_private_ip(ip)
            
            if is_private:
                return {
                    'success': True,
                    'ip': ip,
                    'hostname': hostname,
                    'type': ip_type,
                    'is_private': True,
                    'country': 'N/A',
                    'city': 'N/A',
                    'note': 'Приватный IP адрес'
                }
            
            # Запрос к бесплатному API
            try:
                response = requests.get(f'http://ip-api.com/json/{ip}', timeout=5)
                data = response.json()
                
                if data.get('status') == 'success':
                    return {
                        'success': True,
                        'ip': ip,
                        'hostname': hostname,
                        'type': ip_type,
                        'is_private': False,
                        'country': data.get('country', 'N/A'),
                        'country_code': data.get('countryCode', 'N/A'),
                        'region': data.get('regionName', 'N/A'),
                        'city': data.get('city', 'N/A'),
                        'zip': data.get('zip', 'N/A'),
                        'lat': data.get('lat', 'N/A'),
                        'lon': data.get('lon', 'N/A'),
                        'timezone': data.get('timezone', 'N/A'),
                        'isp': data.get('isp', 'N/A'),
                        'org': data.get('org', 'N/A'),
                        'as': data.get('as', 'N/A')
                    }
                else:
                    return {
                        'success': True,
                        'ip': ip,
                        'hostname': hostname,
                        'type': ip_type,
                        'is_private': False,
                        'note': 'Не удалось получить геолокацию'
                    }
            except:
                return {
                    'success': True,
                    'ip': ip,
                    'hostname': hostname,
                    'type': ip_type,
                    'is_private': False,
                    'note': 'API недоступен'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _is_private_ip(self, ip):
        """Проверка на приватный IP"""
        try:
            parts = ip.split('.')
            if len(parts) != 4:
                return False
            
            first = int(parts[0])
            second = int(parts[1])
            
            # 10.0.0.0/8
            if first == 10:
                return True
            # 172.16.0.0/12
            if first == 172 and 16 <= second <= 31:
                return True
            # 192.168.0.0/16
            if first == 192 and second == 168:
                return True
            # 127.0.0.0/8
            if first == 127:
                return True
            
            return False
        except:
            return False
