import socket
import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
from urllib.parse import urlparse

class StressTest:
    def __init__(self):
        self.active = False
        self.stats = {
            'sent': 0,
            'success': 0,
            'failed': 0,
            'times': []
        }
        
    def run_http_stress(self, url, method='GET', threads=10, duration=30, socketio=None):
        """HTTP стресс-тест"""
        self.active = True
        self.stats = {'sent': 0, 'success': 0, 'failed': 0, 'times': []}
        
        start_time = time.time()
        end_time = start_time + duration
        
        def worker():
            while self.active and time.time() < end_time:
                try:
                    req_start = time.time()
                    
                    if method == 'GET':
                        response = requests.get(url, timeout=5)
                    else:
                        response = requests.post(url, json={'test': 'data'}, timeout=5)
                    
                    elapsed = (time.time() - req_start) * 1000
                    
                    self.stats['sent'] += 1
                    if response.status_code < 400:
                        self.stats['success'] += 1
                    else:
                        self.stats['failed'] += 1
                    
                    self.stats['times'].append(elapsed)
                    
                except Exception as e:
                    self.stats['sent'] += 1
                    self.stats['failed'] += 1
                
                time.sleep(0.01)
        
        # Запуск потоков
        with ThreadPoolExecutor(max_workers=threads) as executor:
            futures = [executor.submit(worker) for _ in range(threads)]
            
            # Мониторинг прогресса
            while time.time() < end_time and self.active:
                progress = ((time.time() - start_time) / duration) * 100
                
                if socketio:
                    socketio.emit('stress_progress', {
                        'progress': min(progress, 100),
                        'stats': self.stats.copy()
                    })
                
                time.sleep(0.5)
            
            self.active = False
            
            # Ожидание завершения потоков
            for future in as_completed(futures):
                future.result()
        
        # Финальная статистика
        total_time = time.time() - start_time
        avg_time = sum(self.stats['times']) / len(self.stats['times']) if self.stats['times'] else 0
        
        result = {
            'success': True,
            'total_requests': self.stats['sent'],
            'successful': self.stats['success'],
            'failed': self.stats['failed'],
            'avg_response_time': round(avg_time, 2),
            'total_time': round(total_time, 2),
            'requests_per_second': round(self.stats['sent'] / total_time, 2)
        }
        
        if socketio:
            socketio.emit('stress_complete', result)
        
        return result
    
    def run_tcp_stress(self, host, port, threads=10, duration=30, socketio=None):
        """TCP стресс-тест"""
        self.active = True
        self.stats = {'sent': 0, 'success': 0, 'failed': 0, 'times': []}
        
        start_time = time.time()
        end_time = start_time + duration
        
        def worker():
            while self.active and time.time() < end_time:
                try:
                    req_start = time.time()
                    
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(5)
                    sock.connect((host, port))
                    sock.send(b'GET / HTTP/1.1\r\nHost: ' + host.encode() + b'\r\n\r\n')
                    sock.recv(1024)
                    sock.close()
                    
                    elapsed = (time.time() - req_start) * 1000
                    
                    self.stats['sent'] += 1
                    self.stats['success'] += 1
                    self.stats['times'].append(elapsed)
                    
                except Exception as e:
                    self.stats['sent'] += 1
                    self.stats['failed'] += 1
                
                time.sleep(0.01)
        
        with ThreadPoolExecutor(max_workers=threads) as executor:
            futures = [executor.submit(worker) for _ in range(threads)]
            
            while time.time() < end_time and self.active:
                progress = ((time.time() - start_time) / duration) * 100
                
                if socketio:
                    socketio.emit('stress_progress', {
                        'progress': min(progress, 100),
                        'stats': self.stats.copy()
                    })
                
                time.sleep(0.5)
            
            self.active = False
            
            for future in as_completed(futures):
                future.result()
        
        total_time = time.time() - start_time
        avg_time = sum(self.stats['times']) / len(self.stats['times']) if self.stats['times'] else 0
        
        result = {
            'success': True,
            'total_requests': self.stats['sent'],
            'successful': self.stats['success'],
            'failed': self.stats['failed'],
            'avg_response_time': round(avg_time, 2),
            'total_time': round(total_time, 2),
            'requests_per_second': round(self.stats['sent'] / total_time, 2)
        }
        
        if socketio:
            socketio.emit('stress_complete', result)
        
        return result
    
    def stop(self):
        """Остановка стресс-теста"""
        self.active = False
