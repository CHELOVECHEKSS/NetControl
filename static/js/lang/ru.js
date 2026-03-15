const LANG_RU = {
    // Интро
    'intro.prompt': '[ НАЖМИТЕ ДЛЯ ВХОДА ]',

    // Навигация
    'nav.ports': 'Сканер портов',
    'nav.ping': 'Ping/Trace',
    'nav.dns': 'DNS Lookup',
    'nav.whois': 'WHOIS',
    'nav.geo': 'IP Geo',
    'nav.ssl': 'SSL Checker',
    'nav.monitor': 'Monitor',
    'nav.subnet': 'Subnet Calc',
    'nav.tools': 'Tools',
    'nav.stress': 'Stress Test',
    'nav.settings': 'Настройки',
    'nav.online': 'Онлайн',

    // Сканер портов
    'ports.title': 'Сканер портов',
    'ports.tab.single': 'Один хост',
    'ports.tab.multi': 'Несколько хостов',
    'ports.host': 'Хост / IP адрес',
    'ports.start_port': 'Начальный порт',
    'ports.end_port': 'Конечный порт',
    'ports.threads': 'Потоков',
    'ports.btn.start': 'Начать сканирование',
    'ports.btn.stop': 'Остановить',
    'ports.stat.scanned': 'Просканировано',
    'ports.stat.open': 'Открытых портов',
    'ports.stat.time': 'Время сканирования',
    'ports.multi.hosts': 'IP адреса (каждый с новой строки, поддержка масок)',
    'ports.multi.hint': 'Примеры: 192.168.1.* | 26.*.*.* | 10.0.0-10.* | google.com',
    'ports.multi.btn.start': 'Начать массовое сканирование',
    'ports.multi.stat.hosts': 'Хостов проверено',

    // WHOIS
    'whois.title': 'WHOIS Информация',
    'whois.placeholder': 'Введите домен (например, google.com)',
    'whois.btn': 'Поиск',

    // Ping
    'ping.host': 'Хост',
    'ping.count': 'Количество',
    'ping.btn': 'Ping',
    'trace.btn': 'Traceroute',

    // DNS
    'dns.title': 'DNS Lookup',
    'dns.domain': 'Домен',
    'dns.btn': 'Все записи',

    // Geo
    'geo.title': 'IP Geolocation',
    'geo.tab.lookup': 'IP Lookup',
    'geo.tab.resolve': 'Домен → IP',
    'geo.ip': 'IP адрес',
    'geo.btn': 'Поиск',
    'geo.domain': 'Домен',
    'geo.resolve.btn': 'Получить IP',

    // SSL
    'ssl.title': 'SSL/TLS Checker',
    'ssl.domain': 'Домен',
    'ssl.port': 'Порт',
    'ssl.btn': 'Проверить',

    // Monitor
    'monitor.title': 'Network Monitor',
    'monitor.btn.start': 'Старт',
    'monitor.btn.stop': 'Стоп',
    'monitor.upload': 'Скорость отправки',
    'monitor.download': 'Скорость загрузки',
    'monitor.connections': 'Активных соединений',

    // Subnet
    'subnet.title': 'Subnet Calculator',
    'subnet.network': 'Сеть (CIDR)',
    'subnet.btn': 'Рассчитать',

    // Tools
    'tools.title': 'Network Tools',
    'tools.tab.encode': 'Encode/Decode',
    'tools.tab.hash': 'Hash',
    'tools.tab.password': 'Password',
    'tools.text': 'Текст',
    'tools.password.length': 'Длина пароля',
    'tools.password.special': 'Специальные символы',
    'tools.password.btn': 'Генерировать',

    // Stress Test
    'stress.title': 'Stress Test',
    'stress.host': 'IP адрес или хост *',
    'stress.host.placeholder': 'example.com или 192.168.1.1',
    'stress.threads': 'Количество потоков',
    'stress.duration': 'Длительность (сек)',
    'stress.use_ports': 'Использовать порты',
    'stress.ports': 'Порты (через запятую или диапазон)',
    'stress.ports.placeholder': '80,443 или 1-1000',
    'stress.use_method': 'Тип запросов',
    'stress.method': 'Метод HTTP:',
    'stress.btn.start': 'Запустить стресс-тест',
    'stress.btn.stop': 'Остановить',
    'stress.stat.sent': 'Запросов отправлено',
    'stress.stat.success': 'Успешных',
    'stress.stat.failed': 'Ошибок',
    'stress.stat.avg': 'Среднее время',

    // Настройки
    'settings.title': 'Настройки',
    'settings.general': 'Основные',
    'settings.theme': 'Тема',
    'settings.theme.dark': 'Темная',
    'settings.theme.light': 'Светлая',
    'settings.language': 'Язык',
    'settings.notifications': 'Уведомления',
    'settings.advanced': 'Расширенные',
    'settings.timeout': 'Таймаут (сек)',
    'settings.retry': 'Попытки повтора',
    'settings.buffer': 'Размер буфера',
    'settings.logging': 'Логирование',
    'settings.save': 'Сохранить настройки',
};
