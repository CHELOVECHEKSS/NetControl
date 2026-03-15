import psutil
import time
from datetime import datetime

class NetworkMonitor:
    def __init__(self):
        self.last_bytes_sent = 0
        self.last_bytes_recv = 0
        self.last_time = time.time()
    
    def get_stats(self):
        """Получить статистику сети"""
        try:
            net_io = psutil.net_io_counters()
            current_time = time.time()
            
            # Вычисление скорости
            time_delta = current_time - self.last_time
            
            if time_delta > 0 and self.last_bytes_sent > 0:
                upload_speed = (net_io.bytes_sent - self.last_bytes_sent) / time_delta
                download_speed = (net_io.bytes_recv - self.last_bytes_recv) / time_delta
            else:
                upload_speed = 0
                download_speed = 0
            
            self.last_bytes_sent = net_io.bytes_sent
            self.last_bytes_recv = net_io.bytes_recv
            self.last_time = current_time
            
            return {
                'success': True,
                'bytes_sent': net_io.bytes_sent,
                'bytes_recv': net_io.bytes_recv,
                'packets_sent': net_io.packets_sent,
                'packets_recv': net_io.packets_recv,
                'upload_speed': upload_speed,
                'download_speed': download_speed,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_connections(self):
        """Получить активные соединения"""
        try:
            connections = psutil.net_connections(kind='inet')
            
            conn_list = []
            for conn in connections[:50]:  # Ограничение 50
                try:
                    conn_list.append({
                        'local_addr': f"{conn.laddr.ip}:{conn.laddr.port}" if conn.laddr else 'N/A',
                        'remote_addr': f"{conn.raddr.ip}:{conn.raddr.port}" if conn.raddr else 'N/A',
                        'status': conn.status,
                        'pid': conn.pid
                    })
                except:
                    pass
            
            return {
                'success': True,
                'connections': conn_list,
                'total': len(connections)
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
