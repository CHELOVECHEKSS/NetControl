import socket
import subprocess
import re
from datetime import datetime

class DNSLookup:
    def __init__(self):
        pass
    
    def lookup(self, domain, record_type='A'):
        """DNS lookup"""
        try:
            if record_type == 'A':
                result = socket.gethostbyname(domain)
                return {
                    'success': True,
                    'domain': domain,
                    'type': 'A',
                    'result': result
                }
            else:
                # Использование nslookup для других типов
                return self._nslookup(domain, record_type)
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def lookup_all(self, domain):
        """Получить все DNS записи"""
        records = {}
        types = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME']
        
        for record_type in types:
            result = self._nslookup(domain, record_type)
            if result.get('success'):
                records[record_type] = result.get('records', [])
        
        return {
            'success': True,
            'domain': domain,
            'records': records
        }
    
    def reverse_lookup(self, ip):
        """Обратный DNS lookup"""
        try:
            hostname = socket.gethostbyaddr(ip)
            return {
                'success': True,
                'ip': ip,
                'hostname': hostname[0],
                'aliases': hostname[1]
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _nslookup(self, domain, record_type):
        """Выполнить nslookup"""
        try:
            result = subprocess.run(
                ['nslookup', '-type=' + record_type, domain],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            output = result.stdout
            records = self._parse_nslookup(output, record_type)
            
            return {
                'success': True,
                'domain': domain,
                'type': record_type,
                'records': records,
                'raw': output
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _parse_nslookup(self, output, record_type):
        """Парсинг nslookup"""
        records = []
        
        if record_type == 'A':
            matches = re.findall(r'Address:\s*(\d+\.\d+\.\d+\.\d+)', output)
            records = matches[1:] if len(matches) > 1 else matches
        elif record_type == 'MX':
            matches = re.findall(r'mail exchanger = \d+ (.+)', output)
            records = matches
        elif record_type == 'NS':
            matches = re.findall(r'nameserver = (.+)', output)
            records = matches
        elif record_type == 'TXT':
            matches = re.findall(r'"(.+)"', output)
            records = matches
        
        return records
