import socket
import re
from datetime import datetime

class WhoisLookup:
    def __init__(self):
        self.whois_servers = {
            'com': 'whois.verisign-grs.com',
            'net': 'whois.verisign-grs.com',
            'org': 'whois.pir.org',
            'ru': 'whois.tcinet.ru',
            'default': 'whois.iana.org'
        }
    
    def lookup(self, domain):
        """Выполнить WHOIS запрос"""
        try:
            # Определение WHOIS сервера
            tld = domain.split('.')[-1]
            whois_server = self.whois_servers.get(tld, self.whois_servers['default'])
            
            # Выполнение запроса
            result = self._query_whois(domain, whois_server)
            parsed = self._parse_whois(result)
            
            return {
                'success': True,
                'domain': domain,
                'data': parsed,
                'raw': result,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'domain': domain
            }
    
    def _query_whois(self, domain, server, port=43):
        """Выполнить запрос к WHOIS серверу"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(10)
            sock.connect((server, port))
            sock.send(f"{domain}\r\n".encode())
            
            response = b""
            while True:
                data = sock.recv(4096)
                if not data:
                    break
                response += data
            
            sock.close()
            return response.decode('utf-8', errors='ignore')
        except Exception as e:
            return f"Error: {str(e)}"
    
    def _parse_whois(self, whois_data):
        """Парсинг WHOIS данных"""
        parsed = {
            'registrar': self._extract_field(whois_data, r'Registrar:\s*(.+)'),
            'creation_date': self._extract_field(whois_data, r'Creation Date:\s*(.+)'),
            'expiration_date': self._extract_field(whois_data, r'Expir.*Date:\s*(.+)'),
            'name_servers': self._extract_nameservers(whois_data),
            'status': self._extract_field(whois_data, r'Status:\s*(.+)')
        }
        return parsed
    
    def _extract_field(self, text, pattern):
        """Извлечь поле по регулярному выражению"""
        match = re.search(pattern, text, re.IGNORECASE)
        return match.group(1).strip() if match else 'N/A'
    
    def _extract_nameservers(self, text):
        """Извлечь список name серверов"""
        matches = re.findall(r'Name Server:\s*(.+)', text, re.IGNORECASE)
        return [ns.strip() for ns in matches] if matches else []
