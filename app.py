from flask import Flask, render_template, jsonify, request, send_from_directory
from flask_socketio import SocketIO, emit
from modules.port_forward import PortScanner
from modules.multi_scanner import MultiScanner
from modules.whois_lookup import WhoisLookup
from modules.settings import SettingsManager
from modules.ping_trace import PingTrace
from modules.dns_lookup import DNSLookup
from modules.ip_geolocation import IPGeolocation
from modules.network_tools import NetworkTools
from modules.ssl_checker import SSLChecker
from modules.network_monitor import NetworkMonitor
from modules.subnet_calc import SubnetCalculator
from modules.stress_test import StressTest
import threading
import json

app = Flask(__name__)
app.config['SECRET_KEY'] = 'network-control-panel-secret'
socketio = SocketIO(app, cors_allowed_origins="*")

# Инициализация модулей
port_scanner = PortScanner()
multi_scanner = MultiScanner()
whois_lookup = WhoisLookup()
settings_manager = SettingsManager()
ping_trace = PingTrace()
dns_lookup = DNSLookup()
ip_geo = IPGeolocation()
network_tools = NetworkTools()
ssl_checker = SSLChecker()
network_monitor = NetworkMonitor()
subnet_calc = SubnetCalculator()
stress_test = StressTest()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/assets/<path:filename>')
def assets(filename):
    return send_from_directory('assets', filename)

# Port Scanner
@app.route('/api/ports/scan', methods=['POST'])
def scan_ports():
    data = request.json
    host = data.get('host', '127.0.0.1')
    start_port = data.get('start_port', 1)
    end_port = data.get('end_port', 1024)
    threads = data.get('threads', 100)
    
    thread = threading.Thread(
        target=port_scanner.scan_ports, 
        args=(host, start_port, end_port, socketio, threads)
    )
    thread.daemon = True
    thread.start()
    
    return jsonify({'success': True, 'message': 'Сканирование запущено'})

@app.route('/api/ports/stop', methods=['POST'])
def stop_scan():
    port_scanner.stop_scan()
    return jsonify({'success': True, 'message': 'Остановка сканирования'})

# Multi Port Scanner
@app.route('/api/ports/scan-multi', methods=['POST'])
def scan_multi_ports():
    data = request.json
    hosts = data.get('hosts', [])
    ports = data.get('ports', [])
    threads = data.get('threads', 200)
    
    thread = threading.Thread(
        target=multi_scanner.scan_multiple_hosts,
        args=(hosts, ports, socketio, threads)
    )
    thread.daemon = True
    thread.start()
    
    return jsonify({'success': True, 'message': 'Массовое сканирование запущено'})

@app.route('/api/ports/stop-multi', methods=['POST'])
def stop_multi_scan():
    multi_scanner.stop_scan()
    return jsonify({'success': True, 'message': 'Остановка массового сканирования'})

# WHOIS
@app.route('/api/whois', methods=['POST'])
def whois_info():
    data = request.json
    result = whois_lookup.lookup(data['domain'])
    return jsonify(result)

# Ping & Traceroute
@app.route('/api/ping', methods=['POST'])
def ping():
    data = request.json
    host = data['host']
    count = data.get('count', 4)
    
    def run_ping():
        result = ping_trace.ping(host, count)
        socketio.emit('ping_result', result)
    
    thread = threading.Thread(target=run_ping)
    thread.daemon = True
    thread.start()
    
    return jsonify({'success': True, 'message': 'Ping запущен'})

@app.route('/api/traceroute', methods=['POST'])
def traceroute():
    data = request.json
    host = data['host']
    
    def run_trace():
        result = ping_trace.traceroute(host)
        socketio.emit('traceroute_result', result)
    
    thread = threading.Thread(target=run_trace)
    thread.daemon = True
    thread.start()
    
    return jsonify({'success': True, 'message': 'Traceroute запущен'})

# DNS Lookup
@app.route('/api/dns/lookup', methods=['POST'])
def dns_lookup_single():
    data = request.json
    domain = data['domain']
    record_type = data.get('type', 'A')
    
    def run_dns():
        result = dns_lookup.lookup(domain, record_type)
        socketio.emit('dns_result', result)
    
    thread = threading.Thread(target=run_dns)
    thread.daemon = True
    thread.start()
    
    return jsonify({'success': True, 'message': 'DNS lookup запущен'})

@app.route('/api/dns/lookup-all', methods=['POST'])
def dns_lookup_all():
    data = request.json
    domain = data['domain']
    
    def run_dns_all():
        result = dns_lookup.lookup_all(domain)
        socketio.emit('dns_all_result', result)
    
    thread = threading.Thread(target=run_dns_all)
    thread.daemon = True
    thread.start()
    
    return jsonify({'success': True, 'message': 'DNS lookup запущен'})

@app.route('/api/dns/reverse', methods=['POST'])
def dns_reverse():
    data = request.json
    ip = data['ip']
    
    def run_reverse():
        result = dns_lookup.reverse_lookup(ip)
        socketio.emit('dns_reverse_result', result)
    
    thread = threading.Thread(target=run_reverse)
    thread.daemon = True
    thread.start()
    
    return jsonify({'success': True, 'message': 'Reverse DNS запущен'})

# IP Geolocation
@app.route('/api/ip/geo', methods=['POST'])
def ip_geolocation():
    data = request.json
    ip = data['ip']
    
    def run_geo():
        result = ip_geo.lookup(ip)
        socketio.emit('geo_result', result)
    
    thread = threading.Thread(target=run_geo)
    thread.daemon = True
    thread.start()
    
    return jsonify({'success': True, 'message': 'Geolocation запущен'})

# Network Tools
@app.route('/api/tools/base64-encode', methods=['POST'])
def base64_encode():
    data = request.json
    result = network_tools.base64_encode(data['text'])
    return jsonify(result)

@app.route('/api/tools/base64-decode', methods=['POST'])
def base64_decode():
    data = request.json
    result = network_tools.base64_decode(data['text'])
    return jsonify(result)

@app.route('/api/tools/url-encode', methods=['POST'])
def url_encode():
    data = request.json
    result = network_tools.url_encode(data['text'])
    return jsonify(result)

@app.route('/api/tools/url-decode', methods=['POST'])
def url_decode():
    data = request.json
    result = network_tools.url_decode(data['text'])
    return jsonify(result)

@app.route('/api/tools/hash', methods=['POST'])
def hash_text():
    data = request.json
    result = network_tools.hash_text(data['text'], data.get('algorithm', 'md5'))
    return jsonify(result)

@app.route('/api/tools/generate-password', methods=['POST'])
def generate_password():
    data = request.json
    result = network_tools.generate_password(data.get('length', 16), data.get('use_special', True))
    return jsonify(result)

# SSL Checker
@app.route('/api/ssl/check', methods=['POST'])
def check_ssl():
    data = request.json
    hostname = data['hostname']
    port = data.get('port', 443)
    
    def run_ssl():
        result = ssl_checker.check_ssl(hostname, port)
        socketio.emit('ssl_result', result)
    
    thread = threading.Thread(target=run_ssl)
    thread.daemon = True
    thread.start()
    
    return jsonify({'success': True, 'message': 'SSL check запущен'})

# Network Monitor
@app.route('/api/monitor/stats', methods=['GET'])
def monitor_stats():
    result = network_monitor.get_stats()
    return jsonify(result)

@app.route('/api/monitor/connections', methods=['GET'])
def monitor_connections():
    result = network_monitor.get_connections()
    return jsonify(result)

# Subnet Calculator
@app.route('/api/subnet/calculate', methods=['POST'])
def calculate_subnet():
    data = request.json
    result = subnet_calc.calculate(data['network'])
    return jsonify(result)

# Setup config
@app.route('/api/setup', methods=['GET'])
def get_setup():
    try:
        with open('setup.json', 'r') as f:
            return jsonify(json.load(f))
    except Exception:
        return jsonify({"autosign": False})

# Settings
@app.route('/api/settings', methods=['GET'])
def get_settings():
    return jsonify(settings_manager.get_settings())

@app.route('/api/settings', methods=['POST'])
def update_settings():
    data = request.json
    result = settings_manager.update_settings(data)
    return jsonify(result)

# Stress Test
@app.route('/api/stress/ping', methods=['POST'])
def stress_ping():
    data = request.json
    host = data['host']
    
    try:
        result = ping_trace.ping(host, count=1)
        
        if result['success']:
            # Извлекаем время из результата
            avg_time = result.get('avg', 0)
            return jsonify({
                'success': True,
                'time': avg_time,
                'host': host
            })
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Ping failed')
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/api/stress/http', methods=['POST'])
def stress_http():
    data = request.json
    url = data['url']
    method = data.get('method', 'GET')
    threads = data.get('threads', 10)
    duration = data.get('duration', 30)
    
    def run_stress():
        result = stress_test.run_http_stress(url, method, threads, duration, socketio)
    
    thread = threading.Thread(target=run_stress)
    thread.daemon = True
    thread.start()
    
    return jsonify({'success': True, 'message': 'HTTP стресс-тест запущен'})

@app.route('/api/stress/tcp', methods=['POST'])
def stress_tcp():
    data = request.json
    host = data['host']
    port = data['port']
    threads = data.get('threads', 10)
    duration = data.get('duration', 30)
    
    def run_stress():
        result = stress_test.run_tcp_stress(host, port, threads, duration, socketio)
    
    thread = threading.Thread(target=run_stress)
    thread.daemon = True
    thread.start()
    
    return jsonify({'success': True, 'message': 'TCP стресс-тест запущен'})

@app.route('/api/stress/stop', methods=['POST'])
def stress_stop():
    stress_test.stop()
    return jsonify({'success': True, 'message': 'Стресс-тест остановлен'})

def run_flask():
    socketio.run(app, debug=True, host='127.0.0.1', port=5000, use_reloader=False, allow_unsafe_werkzeug=True)

if __name__ == '__main__':
    run_flask()
