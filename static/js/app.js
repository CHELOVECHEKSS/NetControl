// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    I18N.init();
    initParticles();
    initNavigation();
    initPortsSection();
    initWhoisSection();
    initSettingsSection();
    loadSettings();
    initWebSocket();
    initAllModules();
    animateNavItems();
    initTypingSounds();
    initGlitchObserver();
});

// Частицы на фоне
function initParticles() {
    const particles = document.getElementById('particles');
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = Math.random() * 3 + 'px';
        particle.style.height = particle.style.width;
        particle.style.background = `rgba(99, 102, 241, ${Math.random() * 0.5})`;
        particle.style.borderRadius = '50%';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animation = `float ${Math.random() * 10 + 5}s linear infinite`;
        particles.appendChild(particle);
    }
}

// CSS для анимации частиц
const style = document.createElement('style');
style.textContent = `
    @keyframes float {
        0%, 100% { transform: translate(0, 0); }
        25% { transform: translate(10px, -10px); }
        50% { transform: translate(-10px, 10px); }
        75% { transform: translate(10px, 10px); }
    }
`;
document.head.appendChild(style);

// animateNavItems — логика перенесена в intro.js
function animateNavItems() {}



// Звуки печати
function initTypingSounds() {
    document.addEventListener('keydown', (e) => {
        const tag = document.activeElement?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') return;

        if (e.key === 'Backspace') {
            playSound('stdout.wav', 0.5);
        } else if (e.key.length === 1) {
            playSound('stdin.wav', 0.4);
        }
    });
}

// Глитч-эффект на текстовый узел или элемент
function glitchReveal(el, finalText, duration) {
    if (!el) return;
    duration = duration || 350;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%<>/\\|';
    const steps = Math.ceil(duration / 40);
    let step = 0;
    const original = finalText !== undefined ? finalText : el.textContent;
    const interval = setInterval(function() {
        step++;
        if (step >= steps) {
            clearInterval(interval);
            el.textContent = original;
            el.style.color = '';
            return;
        }
        const progress = step / steps;
        let result = '';
        for (let i = 0; i < original.length; i++) {
            if (original[i] === ' ' || original[i] === '\n') {
                result += original[i];
            } else if (Math.random() < progress) {
                result += original[i];
            } else {
                result += chars[Math.floor(Math.random() * chars.length)];
            }
        }
        el.textContent = result;
        el.style.color = `hsl(${120 + Math.random() * 20}, 100%, ${50 + Math.random() * 20}%)`;
    }, 40);
}

// Наблюдатель — глитч при появлении новых данных в result-box
function initGlitchObserver() {
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(m) {
            m.addedNodes.forEach(function(node) {
                if (node.nodeType !== 1) return;
                // Глитч на числа и значения
                node.querySelectorAll('.result-value, .port-number, .hop-ip, .stat-info h3, .host-ip').forEach(function(el) {
                    glitchReveal(el, el.textContent, 300);
                });
                // Если сам узел — результат
                const cls = node.className || '';
                if (cls.includes('result-item') || cls.includes('port-result') || cls.includes('hop-item') || cls.includes('host-result')) {
                    node.style.opacity = '0';
                    node.style.transition = 'opacity 0.15s';
                    setTimeout(function() { node.style.opacity = '1'; }, 30);
                }
            });
        });
    });

    // Вешаем на все result-box и контейнеры результатов
    document.querySelectorAll('.result-box, #ports-list, #multi-results-list, #whois-result').forEach(function(box) {
        observer.observe(box, { childList: true, subtree: true });
    });
}

// Вспомогательная функция воспроизведения звука
function playSound(file, volume = 0.6) {
    const audio = new Audio(`/assets/audio/${file}`);
    audio.volume = volume;
    audio.play().catch(() => {});
}

// Эффект "загрузки" контента — один keyboard.wav + мигание элементов
function playBootEffect(section) {
    const target = section || document.querySelector('.section.active');
    if (!target) return;

    const elements = target.querySelectorAll(
        '.form-group, .stat-card, .scan-controls, .tool-tabs, .btn, .result-box, .settings-group, .stress-options'
    );

    if (elements.length === 0) return;

    // Один звук на всю секцию
    playSound('keyboard.wav', 0.5);

    elements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transition = 'none';

        setTimeout(() => {
            let flickers = 0;
            const flickerInterval = setInterval(() => {
                el.style.opacity = flickers % 2 === 0 ? '0.4' : '0';
                flickers++;
                if (flickers >= 6) {
                    clearInterval(flickerInterval);
                    el.style.opacity = '1';
                    el.style.transition = '';
                }
            }, 35);
        }, index * 60);
    });
}

// Навигация
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionId = item.dataset.section;
            
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            
            item.classList.add('active');
            const newSection = document.getElementById(`${sectionId}-section`);
            newSection.classList.add('active');
            playBootEffect(newSection);
        });
    });
}

// WebSocket соединение
let socket;
let scanStartTime = 0;
let scanInterval = null;
let foundPorts = [];
let isScanning = false;

function initWebSocket() {
    socket = io();
    
    // Начало сканирования
    socket.on('scan_started', (data) => {
        console.log('Сканирование началось:', data);
        isScanning = true;
        foundPorts = [];
        
        // Изменение кнопки на "Стоп"
        const btn = document.getElementById('start-scan-btn');
        const btnText = document.getElementById('scan-btn-text');
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-danger');
        btnText.textContent = 'Остановить';
        
        document.getElementById('progress-container').style.display = 'block';
        document.getElementById('ports-list').innerHTML = '';
        document.getElementById('total-scanned').textContent = '0';
        document.getElementById('total-open').textContent = '0';
        document.getElementById('progress-fill').style.width = '0%';
        document.getElementById('progress-text').textContent = '0%';
        
        scanStartTime = Date.now();
        
        // Обновление времени сканирования
        if (scanInterval) clearInterval(scanInterval);
        scanInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - scanStartTime) / 1000);
            document.getElementById('scan-time').textContent = elapsed + 's';
        }, 1000);
    });
    
    // Найден открытый порт
    socket.on('port_found', (port) => {
        console.log('Найден порт:', port);
        foundPorts.push(port);
        document.getElementById('total-open').textContent = foundPorts.length;
        
        // Добавление порта в список (с анимацией)
        const container = document.getElementById('ports-list');
        const portElement = document.createElement('div');
        portElement.className = 'port-result';
        portElement.innerHTML = `
            <div class="port-number">${port.port}</div>
            <div class="port-service">${port.service}</div>
            <div class="port-status">Открыт</div>
            <div class="port-timestamp">${new Date(port.timestamp).toLocaleTimeString()}</div>
        `;
        container.appendChild(portElement);
    });
    
    // Прогресс сканирования
    socket.on('scan_progress', (data) => {
        document.getElementById('progress-fill').style.width = data.progress + '%';
        document.getElementById('progress-text').textContent = data.progress + '%';
        document.getElementById('total-scanned').textContent = data.scanned;
    });
    
    // Завершение сканирования
    socket.on('scan_completed', (data) => {
        console.log('Сканирование завершено:', data);
        finishScan(data, 'Сканирование завершено!');
    });
    
    // Остановка сканирования
    socket.on('scan_stopped', (data) => {
        console.log('Сканирование остановлено:', data);
        finishScan(data, 'Сканирование остановлено');
    });
}

function finishScan(data, message) {
    isScanning = false;
    
    // Возврат кнопки в исходное состояние
    const btn = document.getElementById('start-scan-btn');
    const btnText = document.getElementById('scan-btn-text');
    btn.classList.remove('btn-danger');
    btn.classList.add('btn-primary');
    btnText.textContent = 'Начать сканирование';
    
    if (scanInterval) {
        clearInterval(scanInterval);
        scanInterval = null;
    }
    
    document.getElementById('progress-fill').style.width = '100%';
    document.getElementById('progress-text').textContent = '100%';
    document.getElementById('total-scanned').textContent = data.total_scanned;
    document.getElementById('total-open').textContent = data.total_open;
    
    if (data.total_open === 0) {
        document.getElementById('ports-list').innerHTML = 
            '<div style="text-align: center; padding: 3rem; color: var(--text-secondary);">Открытых портов не найдено</div>';
    }
    
    showNotification(`${message} Найдено портов: ${data.total_open}`, 'success');
}

// Проброс портов
function initPortsSection() {
    const startScanBtn = document.getElementById('start-scan-btn');
    startScanBtn.addEventListener('click', toggleScan);
}

function toggleScan() {
    if (isScanning) {
        stopPortScan();
    } else {
        startPortScan();
    }
}

async function startPortScan() {
    const host = document.getElementById('scan-host').value.trim();
    const startPort = parseInt(document.getElementById('start-port').value);
    const endPort = parseInt(document.getElementById('end-port').value);
    const threads = parseInt(document.getElementById('threads-count').value);
    
    if (!host) {
        showNotification('Введите хост или IP адрес', 'error');
        return;
    }
    
    if (startPort < 1 || endPort > 65535 || startPort > endPort) {
        showNotification('Неверный диапазон портов', 'error');
        return;
    }
    
    
    try {
        const response = await fetch('/api/ports/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                host: host,
                start_port: startPort,
                end_port: endPort,
                threads: threads
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Сканирование запущено', 'success');
        }
    } catch (error) {
        showNotification('Ошибка запуска сканирования', 'error');
    }
}

async function stopPortScan() {
    try {
        const response = await fetch('/api/ports/stop', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Остановка сканирования...', 'info');
        }
    } catch (error) {
        showNotification('Ошибка остановки сканирования', 'error');
    }
}

// WHOIS
function initWhoisSection() {
    const whoisBtn = document.getElementById('whois-btn');
    const domainInput = document.getElementById('domain-input');
    
    whoisBtn.addEventListener('click', performWhoisLookup);
    domainInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performWhoisLookup();
    });
}

async function performWhoisLookup() {
    const domain = document.getElementById('domain-input').value.trim();
    const resultDiv = document.getElementById('whois-result');
    
    if (!domain) {
        showNotification('Введите домен', 'error');
        return;
    }
    
    resultDiv.innerHTML = '<div style="text-align: center; padding: 3rem;"><div class="loading"></div></div>';
    
    try {
        const response = await fetch('/api/whois', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domain: domain })
        });
        
        const data = await response.json();
        
        if (data.success) {
            renderWhoisData(data);
        } else {
            resultDiv.innerHTML = `<div style="color: var(--danger); text-align: center; padding: 2rem;">Ошибка: ${data.error}</div>`;
        }
    } catch (error) {
        resultDiv.innerHTML = '<div style="color: var(--danger); text-align: center; padding: 2rem;">Ошибка выполнения запроса</div>';
    }
}

function renderWhoisData(data) {
    const resultDiv = document.getElementById('whois-result');
    const parsed = data.data;
    
    resultDiv.innerHTML = `
        <div class="whois-data">
            <div class="whois-item">
                <label>Домен:</label>
                <span>${data.domain}</span>
            </div>
            <div class="whois-item">
                <label>Регистратор:</label>
                <span>${parsed.registrar}</span>
            </div>
            <div class="whois-item">
                <label>Дата создания:</label>
                <span>${parsed.creation_date}</span>
            </div>
            <div class="whois-item">
                <label>Дата истечения:</label>
                <span>${parsed.expiration_date}</span>
            </div>
            <div class="whois-item">
                <label>Статус:</label>
                <span>${parsed.status}</span>
            </div>
            ${parsed.name_servers.length > 0 ? `
                <div class="whois-item">
                    <label>Name серверы:</label>
                    <span>${parsed.name_servers.join(', ')}</span>
                </div>
            ` : ''}
        </div>
        <details style="margin-top: 2rem;">
            <summary style="cursor: pointer; color: var(--primary); margin-bottom: 1rem;">Показать полный ответ</summary>
            <pre style="background: var(--bg-dark); padding: 1rem; border-radius: 0.5rem; overflow-x: auto; font-size: 0.85rem;">${data.raw}</pre>
        </details>
    `;
}

// Настройки
function initSettingsSection() {
    const saveBtn = document.getElementById('save-settings-btn');
    saveBtn.addEventListener('click', saveSettings);

    // Смена языка в реальном времени
    const langSelect = document.getElementById('language-select');
    langSelect.addEventListener('change', () => {
        I18N.apply(langSelect.value);
    });
}

async function loadSettings() {
    try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        
        if (data.success) {
            const settings = data.settings;
            document.getElementById('theme-select').value = settings.theme;
            document.getElementById('language-select').value = settings.language;
            document.getElementById('notifications-toggle').checked = settings.notifications;
            document.getElementById('timeout-input').value = settings.advanced.timeout;
            document.getElementById('retry-input').value = settings.advanced.retry_attempts;
            document.getElementById('buffer-input').value = settings.advanced.buffer_size;
            document.getElementById('logging-toggle').checked = settings.advanced.enable_logging;
        }
    } catch (error) {
        console.error('Ошибка загрузки настроек:', error);
    }
}

async function saveSettings() {
    const settings = {
        theme: document.getElementById('theme-select').value,
        language: document.getElementById('language-select').value,
        notifications: document.getElementById('notifications-toggle').checked,
        advanced: {
            timeout: parseInt(document.getElementById('timeout-input').value),
            retry_attempts: parseInt(document.getElementById('retry-input').value),
            buffer_size: parseInt(document.getElementById('buffer-input').value),
            enable_logging: document.getElementById('logging-toggle').checked
        }
    };
    
    try {
        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Настройки сохранены', 'success');
        } else {
            showNotification('Ошибка сохранения', 'error');
        }
    } catch (error) {
        showNotification('Ошибка сохранения настроек', 'error');
    }
}

// Утилиты
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function showNotification(message, type = 'info') {
    // Звук по типу уведомления
    if (type === 'error') {
        playSound('error.wav', 0.6);
    } else if (type === 'success') {
        playSound('info.wav', 0.5);
    } else {
        playSound('alarm.wav', 0.4);
    }

    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--primary)'};
        color: white;
        border-radius: 0.5rem;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Анимации для уведомлений
const notifStyle = document.createElement('style');
notifStyle.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(notifStyle);


// Массовое сканирование
let multiScanStartTime = 0;
let multiScanInterval = null;
let isMultiScanning = false;

function initMultiScanner() {
    const startBtn = document.getElementById('start-multi-scan-btn');
    if (startBtn) {
        startBtn.addEventListener('click', toggleMultiScan);
    }
    
    // WebSocket события для массового сканирования
    socket.on('multi_scan_started', (data) => {
        isMultiScanning = true;
        
        const btn = document.getElementById('start-multi-scan-btn');
        const btnText = document.getElementById('multi-scan-btn-text');
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-danger');
        btnText.textContent = 'Остановить';
        
        document.getElementById('multi-progress-container').style.display = 'block';
        document.getElementById('multi-results-list').innerHTML = '';
        document.getElementById('multi-total-hosts').textContent = '0';
        document.getElementById('multi-total-open').textContent = '0';
        document.getElementById('multi-progress-fill').style.width = '0%';
        document.getElementById('multi-progress-text').textContent = '0%';
        
        multiScanStartTime = Date.now();
        
        if (multiScanInterval) clearInterval(multiScanInterval);
        multiScanInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - multiScanStartTime) / 1000);
            document.getElementById('multi-scan-time').textContent = elapsed + 's';
        }, 1000);
    });
    
    socket.on('multi_port_found', (port) => {
        const currentOpen = parseInt(document.getElementById('multi-total-open').textContent);
        document.getElementById('multi-total-open').textContent = currentOpen + 1;
        
        // Добавление в список
        const container = document.getElementById('multi-results-list');
        const existingHost = container.querySelector(`[data-host="${port.host}"]`);
        
        if (existingHost) {
            const portsContainer = existingHost.querySelector('.host-ports');
            const portElement = document.createElement('div');
            portElement.className = 'host-port-item';
            portElement.innerHTML = `
                <span class="port-num">${port.port}</span>
                <span class="port-service">${port.service}</span>
            `;
            portsContainer.appendChild(portElement);
        } else {
            const hostElement = document.createElement('div');
            hostElement.className = 'host-result';
            hostElement.setAttribute('data-host', port.host);
            hostElement.innerHTML = `
                <div class="host-header">
                    <span class="host-ip">${port.host}</span>
                    <span class="host-count">1 порт</span>
                </div>
                <div class="host-ports">
                    <div class="host-port-item">
                        <span class="port-num">${port.port}</span>
                        <span class="port-service">${port.service}</span>
                    </div>
                </div>
            `;
            container.appendChild(hostElement);
        }
    });
    
    socket.on('multi_scan_progress', (data) => {
        document.getElementById('multi-progress-fill').style.width = data.progress + '%';
        document.getElementById('multi-progress-text').textContent = data.progress + '%';
    });
    
    socket.on('multi_scan_completed', (data) => {
        finishMultiScan(data, 'Массовое сканирование завершено!');
    });
    
    socket.on('multi_scan_stopped', (data) => {
        finishMultiScan(data, 'Массовое сканирование остановлено');
    });
}

function finishMultiScan(data, message) {
    isMultiScanning = false;
    
    const btn = document.getElementById('start-multi-scan-btn');
    const btnText = document.getElementById('multi-scan-btn-text');
    btn.classList.remove('btn-danger');
    btn.classList.add('btn-primary');
    btnText.textContent = 'Начать массовое сканирование';
    
    if (multiScanInterval) {
        clearInterval(multiScanInterval);
        multiScanInterval = null;
    }
    
    document.getElementById('multi-progress-fill').style.width = '100%';
    document.getElementById('multi-progress-text').textContent = '100%';
    document.getElementById('multi-total-hosts').textContent = Object.keys(data.hosts_results || {}).length;
    document.getElementById('multi-total-open').textContent = data.total_open;
    
    // Обновление счетчиков портов
    document.querySelectorAll('.host-result').forEach(hostEl => {
        const portsCount = hostEl.querySelectorAll('.host-port-item').length;
        const countEl = hostEl.querySelector('.host-count');
        countEl.textContent = portsCount + ' ' + (portsCount === 1 ? 'порт' : portsCount < 5 ? 'порта' : 'портов');
    });
    
    if (data.total_open === 0) {
        document.getElementById('multi-results-list').innerHTML = 
            '<div style="text-align: center; padding: 3rem; color: var(--text-secondary);">Открытых портов не найдено</div>';
    }
    
    showNotification(`${message} Найдено портов: ${data.total_open}`, 'success');
}

function toggleMultiScan() {
    if (isMultiScanning) {
        stopMultiScan();
    } else {
        startMultiScan();
    }
}

async function startMultiScan() {
    const hostsText = document.getElementById('multi-hosts').value.trim();
    const startPort = parseInt(document.getElementById('multi-start-port').value);
    const endPort = parseInt(document.getElementById('multi-end-port').value);
    const threads = parseInt(document.getElementById('multi-threads').value);
    
    if (!hostsText) {
        showNotification('Введите IP адреса', 'error');
        return;
    }
    
    if (startPort < 1 || endPort > 65535 || startPort > endPort) {
        showNotification('Неверный диапазон портов', 'error');
        return;
    }
    
    // Парсинг хостов с поддержкой масок
    let hosts = [];
    const lines = hostsText.split('\n').map(h => h.trim()).filter(h => h);
    
    for (const line of lines) {
        if (line.includes('*') || line.includes('-')) {
            // Генерация IP адресов из маски
            const generated = generateIPsFromMask(line);
            if (generated.length > 0) {
                hosts = hosts.concat(generated);
            }
        } else {
            // Обычный IP или домен
            hosts.push(line);
        }
    }
    
    // Создание массива портов из диапазона
    const ports = [];
    for (let port = startPort; port <= endPort; port++) {
        ports.push(port);
    }
    
    if (hosts.length === 0) {
        showNotification('Нет валидных хостов', 'error');
        return;
    }
    
    // Предупреждение если слишком много хостов
    if (hosts.length > 1000) {
        const totalChecks = hosts.length * ports.length;
        if (!confirm(`Будет просканировано ${hosts.length} хостов на ${ports.length} портах (${totalChecks} проверок). Это может занять много времени. Продолжить?`)) {
            return;
        }
    }
    
    try {
        await fetch('/api/ports/scan-multi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hosts, ports, threads })
        });
        
        showNotification(`Запущено сканирование ${hosts.length} хостов на ${ports.length} портах`, 'success');
    } catch (error) {
        showNotification('Ошибка запуска сканирования', 'error');
    }
}

function generateIPsFromMask(mask) {
    const ips = [];
    const parts = mask.split('.');
    
    if (parts.length !== 4) {
        return [];
    }
    
    // Определяем диапазоны для каждого октета
    const ranges = parts.map(part => {
        if (part === '*') {
            // Для * генерируем 1-254 (пропускаем 0 и 255)
            return Array.from({length: 254}, (_, i) => i + 1);
        } else if (part.includes('-')) {
            const [start, end] = part.split('-').map(n => parseInt(n));
            if (isNaN(start) || isNaN(end) || start < 0 || end > 255 || start > end) {
                return [];
            }
            return Array.from({length: end - start + 1}, (_, i) => start + i);
        } else {
            const num = parseInt(part);
            if (isNaN(num) || num < 0 || num > 255) {
                return [];
            }
            return [num];
        }
    });
    
    // Проверка на валидность всех диапазонов
    if (ranges.some(r => r.length === 0)) {
        return [];
    }
    
    // Ограничение на количество генерируемых IP
    const totalIPs = ranges.reduce((acc, r) => acc * r.length, 1);
    if (totalIPs > 100000) {
        alert(`Маска ${mask} генерирует слишком много IP адресов (${totalIPs}). Максимум 100,000.`);
        return [];
    }
    
    // Генерация всех комбинаций
    for (const a of ranges[0]) {
        for (const b of ranges[1]) {
            for (const c of ranges[2]) {
                for (const d of ranges[3]) {
                    ips.push(`${a}.${b}.${c}.${d}`);
                }
            }
        }
    }
    
    return ips;
}

async function stopMultiScan() {
    try {
        await fetch('/api/ports/stop-multi', {
            method: 'POST'
        });
        
        showNotification('Остановка массового сканирования...', 'info');
    } catch (error) {
        showNotification('Ошибка остановки сканирования', 'error');
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initMultiScanner();
    }, 1000);
});
