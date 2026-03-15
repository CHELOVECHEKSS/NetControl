import socket
import threading
from datetime import datetime
import re

class MultiScanner:
    def __init__(self):
        self.results = []
        self.is_scanning = False
        self.progress = 0
        self.should_stop = False
    
    def stop_scan(self):
        """Остановить сканирование"""
        self.should_stop = True
        self.is_scanning = False
    
    def scan_multiple_hosts(self, hosts, ports, socketio, max_threads=200, timeout=1):
        """Сканирование нескольких хостов"""
        self.is_scanning = True
        self.should_stop = False
        self.results = []
        self.progress = 0
        
        # Резолв доменов в IP адреса
        resolved_hosts = []
        for host in hosts:
            resolved = self.resolve_host(host)
            if resolved:
                resolved_hosts.append(resolved)
        
        if not resolved_hosts:
            socketio.emit('multi_scan_error', {'error': 'Не удалось резолвить ни один хост'})
            self.is_scanning = False
            return
        
        total_checks = len(resolved_hosts) * len(ports)
        checked_count = 0
        lock = threading.Lock()
        
        # Отправка начала сканирования
        socketio.emit('multi_scan_started', {
            'total_hosts': len(resolved_hosts),
            'total_ports': len(ports),
            'total_checks': total_checks
        })
        
        def scan_host_port(host, port):
            nonlocal checked_count
            
            if self.should_stop:
                return
            
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(timeout)
                result = sock.connect_ex((host, port))
                sock.close()
                
                if result == 0 and not self.should_stop:
                    service = self._get_service_name(port)
                    port_info = {
                        'host': host,
                        'port': port,
                        'status': 'open',
                        'service': service,
                        'timestamp': datetime.now().isoformat()
                    }
                    
                    with lock:
                        self.results.append(port_info)
                    
                    # Отправка найденного порта через WebSocket
                    socketio.emit('multi_port_found', port_info)
                
                with lock:
                    checked_count += 1
                    self.progress = int((checked_count / total_checks) * 100)
                
                # Отправка прогресса
                if checked_count % max(1, total_checks // 50) == 0:
                    socketio.emit('multi_scan_progress', {
                        'progress': self.progress,
                        'checked': checked_count,
                        'total': total_checks
                    })
                
            except:
                with lock:
                    checked_count += 1
                    self.progress = int((checked_count / total_checks) * 100)
        
        # Создание задач для всех комбинаций хост-порт
        threads = []
        for host in resolved_hosts:
            for port in ports:
                if self.should_stop:
                    break
                
                thread = threading.Thread(target=scan_host_port, args=(host, port))
                thread.daemon = True
                thread.start()
                threads.append(thread)
                
                # Ограничение количества одновременных потоков
                if len(threads) >= max_threads:
                    for t in threads:
                        t.join()
                    threads = []
        
        # Ожидание завершения оставшихся потоков
        for t in threads:
            t.join()
        
        self.is_scanning = False
        self.progress = 100
        
        # Группировка результатов по хостам
        hosts_results = {}
        for result in self.results:
            host = result['host']
            if host not in hosts_results:
                hosts_results[host] = []
            hosts_results[host].append(result)
        
        # Отправка завершения сканирования
        if self.should_stop:
            socketio.emit('multi_scan_stopped', {
                'total_open': len(self.results),
                'total_checked': checked_count,
                'hosts_results': hosts_results
            })
        else:
            socketio.emit('multi_scan_completed', {
                'total_open': len(self.results),
                'total_checked': total_checks,
                'hosts_results': hosts_results
            })
    
    def _get_service_name(self, port):
        """Определить название сервиса по порту"""
        common_ports = {
            20: 'FTP-DATA', 21: 'FTP', 22: 'SSH', 23: 'Telnet',
            25: 'SMTP', 53: 'DNS', 80: 'HTTP', 110: 'POP3',
            135: 'RPC', 139: 'NetBIOS', 143: 'IMAP', 443: 'HTTPS',
            445: 'SMB', 3306: 'MySQL', 3389: 'RDP', 5432: 'PostgreSQL',
            5900: 'VNC', 8080: 'HTTP-Proxy', 27017: 'MongoDB',
            6379: 'Redis', 9200: 'Elasticsearch'
        }
        return common_ports.get(port, 'Unknown')
    
    def resolve_host(self, host):
        """Резолв домена в IP адрес"""
        # Проверка, является ли хост IP адресом
        ip_pattern = re.compile(r'^(\d{1,3}\.){3}\d{1,3}$')
        if ip_pattern.match(host):
            return host
        
        # Попытка резолва домена
        try:
            return socket.gethostbyname(host)
        except:
            return None
