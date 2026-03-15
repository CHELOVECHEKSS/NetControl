import subprocess
import platform
import re
from datetime import datetime
import socket

class PingTrace:
    def __init__(self):
        self.is_windows = platform.system().lower() == 'windows'
    
    def ping(self, host, count=4):
        """Выполнить ping"""
        try:
            # Резолв хоста в IP
            try:
                ip = socket.gethostbyname(host)
            except:
                ip = host
            
            param = '-n' if self.is_windows else '-c'
            timeout_param = '-w' if self.is_windows else '-W'
            
            command = ['ping', param, str(count), timeout_param, '5000' if self.is_windows else '5', ip]
            
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=30,
                encoding='cp866' if self.is_windows else 'utf-8',
                errors='ignore'
            )
            
            output = result.stdout + result.stderr
            
            # Парсинг результатов
            if self.is_windows:
                times = re.findall(r'[вВ]ремя[=<](\d+)', output)
            else:
                times = re.findall(r'time[=<](\d+\.?\d*)', output, re.IGNORECASE)
            
            times = [float(t) for t in times if t]
            
            if times:
                return {
                    'success': True,
                    'host': host,
                    'ip': ip,
                    'times': times,
                    'avg': round(sum(times) / len(times), 2),
                    'min': min(times),
                    'max': max(times),
                    'packet_loss': self._get_packet_loss(output),
                    'raw': output
                }
            else:
                # Проверка на ошибки
                if 'unreachable' in output.lower() or 'недостижим' in output.lower():
                    return {
                        'success': False,
                        'error': 'Хост недоступен',
                        'raw': output
                    }
                elif 'could not find host' in output.lower() or 'не найден' in output.lower():
                    return {
                        'success': False,
                        'error': 'Хост не найден',
                        'raw': output
                    }
                else:
                    return {
                        'success': False,
                        'error': 'Нет ответа от хоста',
                        'raw': output
                    }
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'error': 'Превышено время ожидания'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def traceroute(self, host):
        """Выполнить traceroute"""
        try:
            # Резолв хоста в IP
            try:
                ip = socket.gethostbyname(host)
            except:
                ip = host
            
            if self.is_windows:
                command = ['tracert', '-w', '2000', '-h', '30', ip]
            else:
                command = ['traceroute', '-w', '2', '-m', '30', ip]
            
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=90,
                encoding='cp866' if self.is_windows else 'utf-8',
                errors='ignore'
            )
            
            output = result.stdout + result.stderr
            hops = self._parse_traceroute(output)
            
            if hops:
                return {
                    'success': True,
                    'host': host,
                    'ip': ip,
                    'hops': hops,
                    'raw': output
                }
            else:
                return {
                    'success': False,
                    'error': 'Не удалось выполнить traceroute',
                    'raw': output
                }
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'error': 'Превышено время ожидания (90 сек)'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _get_packet_loss(self, output):
        """Извлечь процент потери пакетов"""
        match = re.search(r'(\d+)%.*[пП]отерь|(\d+)%.*loss', output, re.IGNORECASE)
        if match:
            return int(match.group(1) or match.group(2))
        return 0
    
    def _parse_traceroute(self, output):
        """Парсинг traceroute"""
        hops = []
        lines = output.split('\n')
        
        for line in lines:
            # Windows формат
            if self.is_windows:
                match = re.search(r'^\s*(\d+)\s+(.+)', line)
                if match:
                    hop_num = match.group(1)
                    hop_data = match.group(2)
                    
                    # Пропуск строк с *
                    if hop_data.strip().startswith('*'):
                        continue
                    
                    # Извлечение IP и времени
                    ip_match = re.search(r'\[?(\d+\.\d+\.\d+\.\d+)\]?', hop_data)
                    time_matches = re.findall(r'(\d+)\s*мс|(\d+)\s*ms', hop_data)
                    
                    times = []
                    for t in time_matches:
                        val = t[0] or t[1]
                        if val:
                            times.append(float(val))
                    
                    if ip_match or times:
                        hops.append({
                            'number': int(hop_num),
                            'ip': ip_match.group(1) if ip_match else 'N/A',
                            'times': times,
                            'raw': hop_data.strip()
                        })
            else:
                # Linux формат
                match = re.search(r'^\s*(\d+)\s+(.+)', line)
                if match:
                    hop_num = match.group(1)
                    hop_data = match.group(2)
                    
                    if '*' in hop_data and hop_data.count('*') >= 3:
                        continue
                    
                    ip_match = re.search(r'\((\d+\.\d+\.\d+\.\d+)\)', hop_data)
                    time_matches = re.findall(r'(\d+\.?\d*)\s*ms', hop_data)
                    
                    times = [float(t) for t in time_matches if t]
                    
                    if ip_match or times:
                        hops.append({
                            'number': int(hop_num),
                            'ip': ip_match.group(1) if ip_match else 'N/A',
                            'times': times,
                            'raw': hop_data.strip()
                        })
        
        return hops
