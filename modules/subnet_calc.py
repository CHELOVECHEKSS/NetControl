import ipaddress

class SubnetCalculator:
    def __init__(self):
        pass
    
    def calculate(self, network_str):
        """Рассчитать подсеть"""
        try:
            # Обработка ввода без CIDR
            if '/' not in network_str:
                # Если это просто IP, добавляем /32 или /24
                try:
                    ip = ipaddress.ip_address(network_str)
                    if isinstance(ip, ipaddress.IPv4Address):
                        network_str = network_str + '/24'
                    else:
                        network_str = network_str + '/64'
                except:
                    return {
                        'success': False,
                        'error': 'Неверный формат. Используйте CIDR нотацию (например, 192.168.1.0/24)'
                    }
            
            network = ipaddress.ip_network(network_str, strict=False)
            
            # Получение первого и последнего хоста
            hosts = list(network.hosts())
            first_host = str(hosts[0]) if hosts else 'N/A'
            last_host = str(hosts[-1]) if hosts else 'N/A'
            
            return {
                'success': True,
                'network': str(network),
                'netmask': str(network.netmask),
                'broadcast': str(network.broadcast_address) if network.broadcast_address else 'N/A',
                'first_host': first_host,
                'last_host': last_host,
                'num_addresses': network.num_addresses,
                'num_hosts': len(hosts),
                'prefix_length': network.prefixlen,
                'ip_version': network.version
            }
        except ValueError as e:
            return {
                'success': False,
                'error': f'Неверный формат сети: {str(e)}'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
