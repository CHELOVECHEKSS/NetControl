// Инициализация всех модулей
function initAllModules() {
    initPingTrace();
    initDNS();
    initGeo();
    initSSL();
    initMonitor();
    initSubnet();
    initTools();
    initStressTest();
    initTabs();
    initWebSocketEvents();
}

// WebSocket события для модулей
function initWebSocketEvents() {
    // Ping результат
    socket.on('ping_result', (data) => {
        const resultDiv = document.getElementById('ping-result');
        if (data.success) {
            resultDiv.innerHTML = `
                <div class="result-item">
                    <span class="result-label">Хост:</span>
                    <span class="result-value">${data.host} (${data.ip})</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Средний пинг:</span>
                    <span class="result-value">${data.avg} ms</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Минимум:</span>
                    <span class="result-value">${data.min} ms</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Максимум:</span>
                    <span class="result-value">${data.max} ms</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Потеря пакетов:</span>
                    <span class="result-value">${data.packet_loss}%</span>
                </div>
                <details style="margin-top: 1rem;">
                    <summary style="cursor: pointer; color: var(--primary);">Полный вывод</summary>
                    <pre style="margin-top: 1rem; padding: 1rem; background: var(--bg-dark); border-radius: 0.5rem; overflow-x: auto;">${data.raw}</pre>
                </details>
            `;
        } else {
            resultDiv.innerHTML = `<div style="color: var(--danger); text-align: center;">Ошибка: ${data.error}</div>`;
        }
    });
    
    // Traceroute результат
    socket.on('traceroute_result', (data) => {
        const resultDiv = document.getElementById('trace-result');
        if (data.success) {
            const hopsHtml = data.hops.map(hop => `
                <div class="hop-item">
                    <div class="hop-number">${hop.number}</div>
                    <div class="hop-ip">${hop.ip}</div>
                    <div class="hop-time">${hop.times.length > 0 ? hop.times[0] + ' ms' : 'N/A'}</div>
                </div>
            `).join('');
            
            resultDiv.innerHTML = hopsHtml || '<div style="text-align: center; color: var(--text-secondary);">Нет данных</div>';
        } else {
            resultDiv.innerHTML = `<div style="color: var(--danger); text-align: center;">Ошибка: ${data.error}</div>`;
        }
    });
    
    // DNS результат
    socket.on('dns_all_result', (data) => {
        const resultDiv = document.getElementById('dns-result');
        if (data.success) {
            let html = '';
            
            for (const [type, records] of Object.entries(data.records)) {
                if (records && records.length > 0) {
                    html += `
                        <div class="dns-record-group">
                            <h4>${type} Records</h4>
                            ${records.map(r => `<div class="dns-record">${r}</div>`).join('')}
                        </div>
                    `;
                }
            }
            
            resultDiv.innerHTML = html || '<div style="text-align: center; color: var(--text-secondary);">Записи не найдены</div>';
        } else {
            resultDiv.innerHTML = `<div style="color: var(--danger); text-align: center;">Ошибка: ${data.error}</div>`;
        }
    });
    
    // DNS single результат (для резолва домена)
    socket.on('dns_result', (data) => {
        const resultDiv = document.getElementById('resolve-result');
        if (data.success) {
            resultDiv.innerHTML = `
                <div class="result-item">
                    <span class="result-label">Домен:</span>
                    <span class="result-value">${data.domain}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">IP адрес:</span>
                    <span class="result-value" style="font-size: 1.5rem; color: var(--primary); font-weight: 700;">${data.result}</span>
                </div>
                <div style="margin-top: 1rem;">
                    <button class="btn btn-secondary" onclick="navigator.clipboard.writeText('${data.result}'); showNotification('IP скопирован', 'success')">Копировать IP</button>
                    <button class="btn btn-primary" onclick="document.getElementById('geo-ip').value='${data.result}'; document.querySelector('[data-tab=geo-lookup-tab]').click(); performGeoLookup()">Узнать геолокацию</button>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `<div style="color: var(--danger); text-align: center;">Ошибка: ${data.error}</div>`;
        }
    });
    
    // Geo результат
    socket.on('geo_result', (data) => {
        const resultDiv = document.getElementById('geo-result');
        if (data.success) {
            let html = `
                <div class="result-item">
                    <span class="result-label">IP адрес:</span>
                    <span class="result-value">${data.ip}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Hostname:</span>
                    <span class="result-value">${data.hostname}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Тип:</span>
                    <span class="result-value">${data.type}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Приватный IP:</span>
                    <span class="result-value">${data.is_private ? 'Да' : 'Нет'}</span>
                </div>
            `;
            
            if (data.country && data.country !== 'N/A') {
                const countryRu = translateCountry(data.country);
                const regionRu = translateRegion(data.region, data.country);
                const cityRu = translateCity(data.city);
                
                html += `
                    <div class="geo-location-card">
                        <h4>Местоположение</h4>
                        <div class="result-item">
                            <span class="result-label">Страна:</span>
                            <span class="result-value">${countryRu} (${data.country_code})</span>
                        </div>
                        <div class="result-item">
                            <span class="result-label">Регион:</span>
                            <span class="result-value">${regionRu}</span>
                        </div>
                        <div class="result-item">
                            <span class="result-label">Город:</span>
                            <span class="result-value">${cityRu}</span>
                        </div>
                        ${data.zip && data.zip !== 'N/A' ? `
                        <div class="result-item">
                            <span class="result-label">Индекс:</span>
                            <span class="result-value">${data.zip}</span>
                        </div>
                        ` : ''}
                        <div class="result-item">
                            <span class="result-label">Координаты:</span>
                            <span class="result-value">${data.lat}, ${data.lon}</span>
                        </div>
                        <div class="result-item">
                            <span class="result-label">Часовой пояс:</span>
                            <span class="result-value">${data.timezone}</span>
                        </div>
                    </div>
                    
                    <div class="geo-network-card">
                        <h4>Сеть</h4>
                        <div class="result-item">
                            <span class="result-label">Провайдер (ISP):</span>
                            <span class="result-value">${data.isp}</span>
                        </div>
                        <div class="result-item">
                            <span class="result-label">Организация:</span>
                            <span class="result-value">${data.org}</span>
                        </div>
                        <div class="result-item">
                            <span class="result-label">AS номер:</span>
                            <span class="result-value">${data.as}</span>
                        </div>
                    </div>
                `;
            }
            
            if (data.note) {
                html += `<div style="margin-top: 1rem; padding: 1rem; background: var(--bg-dark); border-radius: 0.5rem; color: var(--text-secondary);">${data.note}</div>`;
            }
            
            resultDiv.innerHTML = html;
        } else {
            resultDiv.innerHTML = `<div style="color: var(--danger); text-align: center;">Ошибка: ${data.error}</div>`;
        }
    });
    
    // SSL результат
    socket.on('ssl_result', (data) => {
        const resultDiv = document.getElementById('ssl-result');
        if (data.success) {
            const statusClass = data.expired ? 'ssl-expired' : 'ssl-valid';
            const statusText = data.expired ? 'Истек' : 'Действителен';
            
            resultDiv.innerHTML = `
                <div class="ssl-cert-item">
                    <h4>Статус: <span class="${statusClass}">${statusText}</span></h4>
                    <div class="result-item">
                        <span class="result-label">Домен:</span>
                        <span class="result-value">${data.hostname}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Издатель:</span>
                        <span class="result-value">${data.issuer.organizationName || 'N/A'}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Действителен до:</span>
                        <span class="result-value">${data.not_after}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Дней осталось:</span>
                        <span class="result-value ${statusClass}">${data.days_left}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Серийный номер:</span>
                        <span class="result-value">${data.serial_number}</span>
                    </div>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `<div style="color: var(--danger); text-align: center;">Ошибка: ${data.error}</div>`;
        }
    });
    
    // Stress Test прогресс
    socket.on('stress_progress', (data) => {
        if (data.progress) {
            document.getElementById('stress-progress-fill').style.width = data.progress + '%';
            document.getElementById('stress-progress-text').textContent = Math.round(data.progress) + '%';
        }
        if (data.stats) {
            document.getElementById('stress-requests-sent').textContent = data.stats.sent;
            document.getElementById('stress-requests-success').textContent = data.stats.success;
            document.getElementById('stress-requests-failed').textContent = data.stats.failed;
            
            const avgTime = data.stats.times.length > 0 
                ? (data.stats.times.reduce((a, b) => a + b, 0) / data.stats.times.length).toFixed(0)
                : 0;
            document.getElementById('stress-avg-time').textContent = avgTime + ' ms';
        }
    });
    
    // Stress Test завершен
    socket.on('stress_complete', (data) => {
        stressActive = false;
        document.getElementById('stress-start-btn').style.display = 'inline-flex';
        document.getElementById('stress-stop-btn').style.display = 'none';
        
        addStressLog('INFO', '=== ТЕСТ ЗАВЕРШЕН (СЕРВЕРНЫЙ) ===');
        addStressLog('INFO', `Всего запросов: ${data.total_requests}`);
        addStressLog('INFO', `Успешных: ${data.successful}`);
        addStressLog('INFO', `Ошибок: ${data.failed}`);
        addStressLog('INFO', `Среднее время: ${data.avg_response_time} ms`);
        addStressLog('INFO', `Запросов в секунду: ${data.requests_per_second}`);
        
        showNotification('Стресс-тест завершен', 'success');
    });
}

// Табы
function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            const parent = btn.closest('section');
            
            parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            parent.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            const newTab = parent.querySelector(`#${tabId}`);
            newTab.classList.add('active');

            // Анимация контента таба
            playBootEffect(newTab);
        });
    });
}

// Ping & Traceroute
function initPingTrace() {
    document.getElementById('ping-btn').addEventListener('click', performPing);
    document.getElementById('trace-btn').addEventListener('click', performTraceroute);
}

async function performPing() {
    const host = document.getElementById('ping-host').value.trim();
    const count = parseInt(document.getElementById('ping-count').value);
    const resultDiv = document.getElementById('ping-result');
    
    if (!host) {
        showNotification('Введите хост', 'error');
        return;
    }
    
    resultDiv.innerHTML = '<div class="loading-container"><div class="spinner"></div></div>';
    
    try {
        await fetch('/api/ping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ host, count })
        });
        
        showNotification('Ping запущен...', 'info');
    } catch (error) {
        resultDiv.innerHTML = `<div style="color: var(--danger); text-align: center;">Ошибка выполнения запроса</div>`;
    }
}

async function performTraceroute() {
    const host = document.getElementById('trace-host').value.trim();
    const resultDiv = document.getElementById('trace-result');
    
    if (!host) {
        showNotification('Введите хост', 'error');
        return;
    }
    
    resultDiv.innerHTML = '<div class="loading-container"><div class="spinner"></div></div>';
    
    try {
        await fetch('/api/traceroute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ host })
        });
        
        showNotification('Traceroute запущен (может занять до 90 сек)...', 'info');
    } catch (error) {
        resultDiv.innerHTML = `<div style="color: var(--danger); text-align: center;">Ошибка выполнения запроса</div>`;
    }
}

// DNS Lookup
function initDNS() {
    document.getElementById('dns-lookup-btn').addEventListener('click', performDNSLookup);
}

async function performDNSLookup() {
    const domain = document.getElementById('dns-domain').value.trim();
    const resultDiv = document.getElementById('dns-result');
    
    if (!domain) {
        showNotification('Введите домен', 'error');
        return;
    }
    
    resultDiv.innerHTML = '<div class="loading-container"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch('/api/dns/lookup-all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domain })
        });
        
        const data = await response.json();
        
        if (data.success) {
            let html = '';
            
            for (const [type, records] of Object.entries(data.records)) {
                if (records && records.length > 0) {
                    html += `
                        <div class="dns-record-group">
                            <h4>${type} Records</h4>
                            ${records.map(r => `<div class="dns-record">${r}</div>`).join('')}
                        </div>
                    `;
                }
            }
            
            resultDiv.innerHTML = html || '<div style="text-align: center; color: var(--text-secondary);">Записи не найдены</div>';
        } else {
            resultDiv.innerHTML = `<div style="color: var(--danger); text-align: center;">Ошибка: ${data.error}</div>`;
        }
    } catch (error) {
        resultDiv.innerHTML = `<div style="color: var(--danger); text-align: center;">Ошибка выполнения запроса</div>`;
    }
}

// IP Geolocation
function initGeo() {
    document.getElementById('geo-btn').addEventListener('click', performGeoLookup);
    document.getElementById('resolve-btn').addEventListener('click', performDomainResolve);
}

async function performGeoLookup() {
    const ip = document.getElementById('geo-ip').value.trim();
    const resultDiv = document.getElementById('geo-result');
    
    if (!ip) {
        showNotification('Введите IP адрес', 'error');
        return;
    }
    
    resultDiv.innerHTML = '<div class="loading-container"><div class="spinner"></div></div>';
    
    try {
        await fetch('/api/ip/geo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip })
        });
        
        showNotification('Geolocation запущен...', 'info');
    } catch (error) {
        resultDiv.innerHTML = `<div style="color: var(--danger); text-align: center;">Ошибка выполнения запроса</div>`;
    }
}

// SSL Checker
function initSSL() {
    document.getElementById('ssl-btn').addEventListener('click', performSSLCheck);
}

async function performSSLCheck() {
    const hostname = document.getElementById('ssl-host').value.trim();
    const port = parseInt(document.getElementById('ssl-port').value);
    const resultDiv = document.getElementById('ssl-result');
    
    if (!hostname) {
        showNotification('Введите домен', 'error');
        return;
    }
    
    resultDiv.innerHTML = '<div class="loading-container"><div class="spinner"></div></div>';
    
    try {
        await fetch('/api/ssl/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hostname, port })
        });
        
        showNotification('SSL check запущен...', 'info');
    } catch (error) {
        resultDiv.innerHTML = `<div style="color: var(--danger); text-align: center;">Ошибка выполнения запроса</div>`;
    }
}

// Network Monitor
let monitorInterval = null;
let isMonitoring = false;

function initMonitor() {
    document.getElementById('monitor-toggle-btn').addEventListener('click', toggleMonitor);
}

function toggleMonitor() {
    const btn = document.getElementById('monitor-toggle-btn');
    
    if (isMonitoring) {
        clearInterval(monitorInterval);
        isMonitoring = false;
        btn.textContent = 'Старт';
        btn.classList.remove('btn-danger');
        btn.classList.add('btn-primary');
    } else {
        isMonitoring = true;
        btn.textContent = 'Стоп';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-danger');
        updateMonitor();
        monitorInterval = setInterval(updateMonitor, 2000);
    }
}

async function updateMonitor() {
    try {
        const [statsRes, connRes] = await Promise.all([
            fetch('/api/monitor/stats'),
            fetch('/api/monitor/connections')
        ]);
        
        const stats = await statsRes.json();
        const connections = await connRes.json();
        
        if (stats.success) {
            document.getElementById('upload-speed').textContent = formatBytes(stats.upload_speed) + '/s';
            document.getElementById('download-speed').textContent = formatBytes(stats.download_speed) + '/s';
        }
        
        if (connections.success) {
            document.getElementById('connections-count').textContent = connections.total;
            
            const connList = document.getElementById('connections-list');
            connList.innerHTML = connections.connections.slice(0, 20).map(conn => `
                <div class="connection-item">
                    <div class="connection-local">${conn.local_addr}</div>
                    <div class="connection-remote">${conn.remote_addr}</div>
                    <div class="connection-status">${conn.status}</div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Monitor error:', error);
    }
}

// Subnet Calculator
function initSubnet() {
    document.getElementById('subnet-btn').addEventListener('click', calculateSubnet);
}

async function calculateSubnet() {
    const network = document.getElementById('subnet-input').value.trim();
    const resultDiv = document.getElementById('subnet-result');
    
    if (!network) {
        showNotification('Введите сеть', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/subnet/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ network })
        });
        
        const data = await response.json();
        
        if (data.success) {
            resultDiv.innerHTML = `
                <div class="result-item">
                    <span class="result-label">Сеть:</span>
                    <span class="result-value">${data.network}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Маска:</span>
                    <span class="result-value">${data.netmask}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Broadcast:</span>
                    <span class="result-value">${data.broadcast}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Первый хост:</span>
                    <span class="result-value">${data.first_host}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Последний хост:</span>
                    <span class="result-value">${data.last_host}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Всего адресов:</span>
                    <span class="result-value">${data.num_addresses}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Хостов:</span>
                    <span class="result-value">${data.num_hosts}</span>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `<div style="color: var(--danger); text-align: center;">Ошибка: ${data.error}</div>`;
        }
    } catch (error) {
        resultDiv.innerHTML = `<div style="color: var(--danger); text-align: center;">Ошибка выполнения запроса</div>`;
    }
}

// Network Tools
function initTools() {
    // Encode/Decode
    document.getElementById('base64-encode-btn').addEventListener('click', () => encodeText('base64-encode'));
    document.getElementById('base64-decode-btn').addEventListener('click', () => encodeText('base64-decode'));
    document.getElementById('url-encode-btn').addEventListener('click', () => encodeText('url-encode'));
    document.getElementById('url-decode-btn').addEventListener('click', () => encodeText('url-decode'));
    
    // Hash
    document.querySelectorAll('[data-hash]').forEach(btn => {
        btn.addEventListener('click', () => hashText(btn.dataset.hash));
    });
    
    // Password
    document.getElementById('generate-password-btn').addEventListener('click', generatePassword);
}

async function encodeText(type) {
    const text = document.getElementById('encode-input').value;
    const resultDiv = document.getElementById('encode-result');
    
    if (!text) {
        showNotification('Введите текст', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/tools/${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        
        const data = await response.json();
        
        if (data.success) {
            resultDiv.innerHTML = `
                <div class="result-item">
                    <span class="result-label">Результат:</span>
                    <button class="btn btn-secondary" onclick="navigator.clipboard.writeText('${data.result}')">Копировать</button>
                </div>
                <pre style="padding: 1rem; background: var(--bg-dark); border-radius: 0.5rem; overflow-x: auto; word-wrap: break-word; white-space: pre-wrap;">${data.result}</pre>
            `;
        } else {
            resultDiv.innerHTML = `<div style="color: var(--danger);">Ошибка: ${data.error}</div>`;
        }
    } catch (error) {
        resultDiv.innerHTML = `<div style="color: var(--danger);">Ошибка выполнения запроса</div>`;
    }
}

async function hashText(algorithm) {
    const text = document.getElementById('hash-input').value;
    const resultDiv = document.getElementById('hash-result');
    
    if (!text) {
        showNotification('Введите текст', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/tools/hash', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, algorithm })
        });
        
        const data = await response.json();
        
        if (data.success) {
            resultDiv.innerHTML = `
                <div class="result-item">
                    <span class="result-label">${data.algorithm.toUpperCase()}:</span>
                    <button class="btn btn-secondary" onclick="navigator.clipboard.writeText('${data.result}')">Копировать</button>
                </div>
                <pre style="padding: 1rem; background: var(--bg-dark); border-radius: 0.5rem; overflow-x: auto; word-wrap: break-word; white-space: pre-wrap;">${data.result}</pre>
            `;
        } else {
            resultDiv.innerHTML = `<div style="color: var(--danger);">Ошибка: ${data.error}</div>`;
        }
    } catch (error) {
        resultDiv.innerHTML = `<div style="color: var(--danger);">Ошибка выполнения запроса</div>`;
    }
}

async function generatePassword() {
    const length = parseInt(document.getElementById('password-length').value);
    const useSpecial = document.getElementById('password-special').checked;
    const resultDiv = document.getElementById('password-result');
    
    try {
        const response = await fetch('/api/tools/generate-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ length, use_special: useSpecial })
        });
        
        const data = await response.json();
        
        if (data.success) {
            resultDiv.innerHTML = `
                <div class="result-item">
                    <span class="result-label">Пароль:</span>
                    <button class="btn btn-secondary" onclick="navigator.clipboard.writeText('${data.password}')">Копировать</button>
                </div>
                <pre style="padding: 1rem; background: var(--bg-dark); border-radius: 0.5rem; font-size: 1.2rem; letter-spacing: 2px;">${data.password}</pre>
            `;
        } else {
            resultDiv.innerHTML = `<div style="color: var(--danger);">Ошибка: ${data.error}</div>`;
        }
    } catch (error) {
        resultDiv.innerHTML = `<div style="color: var(--danger);">Ошибка выполнения запроса</div>`;
    }
}


// Domain to IP resolve
async function performDomainResolve() {
    const domain = document.getElementById('resolve-domain').value.trim();
    const resultDiv = document.getElementById('resolve-result');
    
    if (!domain) {
        showNotification('Введите домен', 'error');
        return;
    }
    
    resultDiv.innerHTML = '<div class="loading-container"><div class="spinner"></div></div>';
    
    try {
        await fetch('/api/dns/lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domain, type: 'A' })
        });
        
        showNotification('Резолв запущен...', 'info');
    } catch (error) {
        resultDiv.innerHTML = `<div style="color: var(--danger); text-align: center;">Ошибка выполнения запроса</div>`;
    }
}


// Stress Test
let stressWorkers = [];
let stressActive = false;
let stressStats = {
    sent: 0,
    success: 0,
    failed: 0,
    times: []
};

function initStressTest() {
    document.getElementById('stress-use-ports').addEventListener('change', (e) => {
        document.getElementById('stress-ports-group').style.display = e.target.checked ? 'block' : 'none';
    });
    
    document.getElementById('stress-use-method').addEventListener('change', (e) => {
        document.getElementById('stress-method-group').style.display = e.target.checked ? 'block' : 'none';
    });
    
    document.getElementById('stress-start-btn').addEventListener('click', startStressTest);
    document.getElementById('stress-stop-btn').addEventListener('click', stopStressTest);
}

function startStressTest() {
    const host = document.getElementById('stress-host').value.trim();
    const threads = parseInt(document.getElementById('stress-threads').value);
    const duration = parseInt(document.getElementById('stress-duration').value);
    const usePorts = document.getElementById('stress-use-ports').checked;
    const useMethod = document.getElementById('stress-use-method').checked;
    
    if (!host) {
        showNotification('Введите IP адрес или хост', 'error');
        return;
    }
    
    // Сброс статистики
    stressStats = { sent: 0, success: 0, failed: 0, times: [] };
    stressActive = true;
    
    // UI обновления
    document.getElementById('stress-start-btn').style.display = 'none';
    document.getElementById('stress-stop-btn').style.display = 'inline-flex';
    document.getElementById('stress-progress').style.display = 'block';
    document.getElementById('stress-stats').style.display = 'grid';
    document.getElementById('stress-result').innerHTML = '<div class="stress-log-item stress-log-info"><span class="stress-log-time">INFO</span><span class="stress-log-message">Инициализация стресс-теста...</span></div>';
    
    // Если галочки не отмечены - используем ICMP ping через сервер
    if (!usePorts && !useMethod) {
        addStressLog('INFO', `Режим: ICMP Ping`);
        addStressLog('INFO', `Хост: ${host}`);
        addStressLog('INFO', `Потоков: ${threads}, Длительность: ${duration}с`);
        addStressLog('INFO', `Запросов в секунду: ~${threads}`);
        addStressLog('INFO', `Запуск потоков...`);
        
        setTimeout(() => {
            addStressLog('INFO', `Все потоки запущены. Начало тестирования!`);
            
            const startTime = Date.now();
            const endTime = startTime + (duration * 1000);
            
            // Запуск ping потоков
            for (let i = 0; i < threads; i++) {
                runPingStressWorker(host, endTime, i);
            }
            
            // Обновление прогресса
            const progressInterval = setInterval(() => {
                if (!stressActive) {
                    clearInterval(progressInterval);
                    return;
                }
                
                const elapsed = Date.now() - startTime;
                const progress = Math.min((elapsed / (duration * 1000)) * 100, 100);
                
                document.getElementById('stress-progress-fill').style.width = progress + '%';
                document.getElementById('stress-progress-text').textContent = Math.round(progress) + '%';
                
                updateStressStats();
                
                if (progress >= 100) {
                    clearInterval(progressInterval);
                    stopStressTest();
                }
            }, 100);
        }, 500);
        
        return;
    }
    
    // HTTP режим
    let ports = [];
    if (usePorts) {
        const portsInput = document.getElementById('stress-ports').value.trim();
        ports = parsePorts(portsInput);
    }
    
    let method = 'GET';
    if (useMethod) {
        method = document.querySelector('input[name="stress-method"]:checked').value;
    }
    
    // Определение URL
    let urls = [];
    if (usePorts && ports.length > 0) {
        ports.forEach(port => {
            const protocol = (port === 443 || port === 8443) ? 'https' : 'http';
            urls.push(`${protocol}://${host}:${port}`);
        });
    } else {
        // Попробуем оба протокола
        urls.push(`http://${host}`);
        urls.push(`https://${host}`);
    }
    
    addStressLog('INFO', `Режим: HTTP`);
    addStressLog('INFO', `Цели: ${urls.join(', ')}`);
    addStressLog('INFO', `Потоков: ${threads}, Длительность: ${duration}с, Метод: ${method}`);
    addStressLog('INFO', `Запуск потоков...`);
    
    // Задержка перед началом теста - даем всем потокам запуститься
    setTimeout(() => {
        addStressLog('INFO', `Все потоки запущены. Начало тестирования!`);
        
        const startTime = Date.now();
        const endTime = startTime + (duration * 1000);
        
        // Запуск всех потоков одновременно
        for (let i = 0; i < threads; i++) {
            runStressWorker(urls, method, endTime, i);
        }
        
        // Обновление прогресса
        const progressInterval = setInterval(() => {
            if (!stressActive) {
                clearInterval(progressInterval);
                return;
            }
            
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / (duration * 1000)) * 100, 100);
            
            document.getElementById('stress-progress-fill').style.width = progress + '%';
            document.getElementById('stress-progress-text').textContent = Math.round(progress) + '%';
            
            updateStressStats();
            
            if (progress >= 100) {
                clearInterval(progressInterval);
                stopStressTest();
            }
        }, 100);
    }, 500); // Задержка 500мс для инициализации
}

function runStressWorker(urls, method, endTime, workerId) {
    if (!stressActive || Date.now() >= endTime) {
        return;
    }
    
    const url = urls[Math.floor(Math.random() * urls.length)];
    const startTime = Date.now();
    
    const options = {
        method: method,
        mode: 'no-cors', // Обход CORS
        cache: 'no-cache'
    };
    
    if (method === 'POST') {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify({ test: 'data', timestamp: Date.now() });
    }
    
    // Используем Promise.race для таймаута без AbortController
    const fetchPromise = fetch(url, options);
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 5000)
    );
    
    Promise.race([fetchPromise, timeoutPromise])
        .then(response => {
            const elapsed = Date.now() - startTime;
            stressStats.sent++;
            stressStats.success++;
            stressStats.times.push(elapsed);
            
            if (stressStats.success % 100 === 0) {
                addStressLog('SUCCESS', `${stressStats.success} успешных запросов`);
            }
        })
        .catch(error => {
            stressStats.sent++;
            stressStats.failed++;
            
            // Логируем только каждую 50-ю ошибку чтобы не засорять лог
            if (stressStats.failed % 50 === 0) {
                addStressLog('ERROR', `Ошибок: ${stressStats.failed}`);
            }
        })
        .finally(() => {
            // Следующий запрос с минимальной задержкой
            if (stressActive && Date.now() < endTime) {
                setTimeout(() => runStressWorker(urls, method, endTime, workerId), 5);
            }
        });
}

function runPingStressWorker(host, endTime, workerId) {
    if (!stressActive || Date.now() >= endTime) {
        return;
    }
    
    const startTime = Date.now();
    
    // Отправляем ping запрос через сервер
    fetch('/api/stress/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: host })
    })
    .then(response => response.json())
    .then(data => {
        const elapsed = Date.now() - startTime;
        stressStats.sent++;
        
        if (data.success) {
            stressStats.success++;
            stressStats.times.push(data.time || elapsed);
            
            if (stressStats.success % 50 === 0) {
                addStressLog('SUCCESS', `${stressStats.success} успешных ping`);
            }
        } else {
            stressStats.failed++;
            
            if (stressStats.failed % 20 === 0) {
                addStressLog('ERROR', `Ошибок: ${stressStats.failed}`);
            }
        }
    })
    .catch(error => {
        stressStats.sent++;
        stressStats.failed++;
    })
    .finally(() => {
        // Следующий ping через ~1 секунду (для имитации запросов в секунду)
        if (stressActive && Date.now() < endTime) {
            setTimeout(() => runPingStressWorker(host, endTime, workerId), 1000);
        }
    });
}

function stopStressTest() {
    stressActive = false;
    
    document.getElementById('stress-start-btn').style.display = 'inline-flex';
    document.getElementById('stress-stop-btn').style.display = 'none';
    document.getElementById('stress-progress-fill').style.width = '100%';
    document.getElementById('stress-progress-text').textContent = '100%';
    
    updateStressStats();
    
    // Итоговая статистика
    const avgTime = stressStats.times.length > 0 
        ? (stressStats.times.reduce((a, b) => a + b, 0) / stressStats.times.length).toFixed(2)
        : 0;
    
    const successRate = stressStats.sent > 0 
        ? ((stressStats.success / stressStats.sent) * 100).toFixed(2)
        : 0;
    
    addStressLog('INFO', '=== ТЕСТ ЗАВЕРШЕН ===');
    addStressLog('INFO', `Всего запросов: ${stressStats.sent}`);
    addStressLog('INFO', `Успешных: ${stressStats.success} (${successRate}%)`);
    addStressLog('INFO', `Ошибок: ${stressStats.failed}`);
    addStressLog('INFO', `Среднее время ответа: ${avgTime} ms`);
    
    showNotification('Стресс-тест завершен', 'success');
}

function updateStressStats() {
    document.getElementById('stress-requests-sent').textContent = stressStats.sent;
    document.getElementById('stress-requests-success').textContent = stressStats.success;
    document.getElementById('stress-requests-failed').textContent = stressStats.failed;
    
    const avgTime = stressStats.times.length > 0 
        ? (stressStats.times.reduce((a, b) => a + b, 0) / stressStats.times.length).toFixed(0)
        : 0;
    
    document.getElementById('stress-avg-time').textContent = avgTime + ' ms';
}

function addStressLog(type, message) {
    const resultDiv = document.getElementById('stress-result');
    const time = new Date().toLocaleTimeString();
    
    const logClass = type === 'SUCCESS' ? 'stress-log-success' : 
                     type === 'ERROR' ? 'stress-log-error' : 
                     'stress-log-info';
    
    const logItem = document.createElement('div');
    logItem.className = `stress-log-item ${logClass}`;
    logItem.innerHTML = `
        <span class="stress-log-time">${time}</span>
        <span class="stress-log-message">${message}</span>
    `;
    
    resultDiv.insertBefore(logItem, resultDiv.firstChild);
    
    // Ограничение количества логов
    while (resultDiv.children.length > 100) {
        resultDiv.removeChild(resultDiv.lastChild);
    }
}

function parsePorts(input) {
    const ports = [];
    const parts = input.split(',');
    
    parts.forEach(part => {
        part = part.trim();
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(p => parseInt(p.trim()));
            if (!isNaN(start) && !isNaN(end) && start <= end) {
                for (let i = start; i <= Math.min(end, start + 100); i++) {
                    ports.push(i);
                }
            }
        } else {
            const port = parseInt(part);
            if (!isNaN(port)) {
                ports.push(port);
            }
        }
    });
    
    return ports;
}
