import socket
import threading
import time
from datetime import datetime

class PortScanner:
    def __init__(self):
        self.scan_results = []
        self.is_scanning = False
        self.scan_progress = 0
        self.should_stop = False
    
    def stop_scan(self):
        """Остановить сканирование"""
        self.should_stop = True
        self.is_scanning = False
    
    def scan_ports(self, host, start_port, end_port, socketio, max_threads=100, timeout=1):
        """Сканирование портов в диапазоне с WebSocket уведомлениями"""
        self.is_scanning = True
        self.should_stop = False
        self.scan_results = []
        self.scan_progress = 0
        
        total_ports = end_port - start_port + 1
        scanned_count = 0
        lock = threading.Lock()
        
        # Отправка начала сканирования
        socketio.emit('scan_started', {
            'total_ports': total_ports,
            'host': host,
            'threads': max_threads
        })
        
        def scan_port(port):
            nonlocal scanned_count
            
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
                        'port': port,
                        'status': 'open',
                        'service': service,
                        'timestamp': datetime.now().isoformat()
                    }
                    
                    with lock:
                        self.scan_results.append(port_info)
                    
                    # Отправка найденного порта через WebSocket
                    socketio.emit('port_found', port_info)
                
                with lock:
                    scanned_count += 1
                    self.scan_progress = int((scanned_count / total_ports) * 100)
                
                # Отправка прогресса постоянно
                socketio.emit('scan_progress', {
                    'progress': self.scan_progress,
                    'scanned': scanned_count,
                    'total': total_ports
                })
                
            except:
                with lock:
                    scanned_count += 1
                    self.scan_progress = int((scanned_count / total_ports) * 100)
                
                socketio.emit('scan_progress', {
                    'progress': self.scan_progress,
                    'scanned': scanned_count,
                    'total': total_ports
                })
        
        threads = []
        for port in range(start_port, end_port + 1):
            if self.should_stop:
                break
                
            thread = threading.Thread(target=scan_port, args=(port,))
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
        self.scan_progress = 100
        
        # Отправка завершения сканирования
        if self.should_stop:
            socketio.emit('scan_stopped', {
                'total_open': len(self.scan_results),
                'total_scanned': scanned_count,
                'results': sorted(self.scan_results, key=lambda x: x['port'])
            })
        else:
            socketio.emit('scan_completed', {
                'total_open': len(self.scan_results),
                'total_scanned': total_ports,
                'results': sorted(self.scan_results, key=lambda x: x['port'])
            })
    
    def _get_service_name(self, port):
        """Определить название сервиса по порту"""
        common_ports = {
            20: 'FTP-DATA', 21: 'FTP', 22: 'SSH', 23: 'Telnet',
            25: 'SMTP', 53: 'DNS', 80: 'HTTP', 110: 'POP3',
            143: 'IMAP', 443: 'HTTPS', 445: 'SMB', 3306: 'MySQL',
            3389: 'RDP', 5432: 'PostgreSQL', 5900: 'VNC', 8080: 'HTTP-Proxy',
            27017: 'MongoDB', 6379: 'Redis', 9200: 'Elasticsearch'
        }
        return common_ports.get(port, 'Unknown')
