# NetControl

Десктопное приложение для сетевой диагностики и мониторинга. Построено на Flask + pywebview с терминальным UI в стиле хакерского интерфейса.

## Возможности

- **Port Scanner** — сканирование портов одного хоста с прогрессом в реальном времени
- **Multi Scanner** — массовое сканирование нескольких хостов, поддержка масок IP (192.168.1.*)
- **Ping & Traceroute** — пинг и трассировка маршрута
- **DNS Lookup** — запросы A, MX, NS, TXT, CNAME, AAAA + reverse DNS
- **WHOIS** — информация о домене
- **IP Geolocation** — геолокация IP адреса
- **SSL Checker** — проверка SSL сертификата
- **Network Monitor** — мониторинг сетевых интерфейсов и активных соединений
- **Subnet Calculator** — расчёт подсети по CIDR
- **Network Tools** — Base64, URL encode/decode, хэширование, генератор паролей
- **Stress Test** — HTTP и TCP стресс-тестирование

## Установка

```bash
pip install -r requirements.txt
```

## Запуск

Десктопное приложение (pywebview):
```bash
python main_desktop.py
```

Только веб-сервер (браузер на `http://localhost:5000`):
```bash
python app.py
```

## Настройки

`setup.json` — конфиг запуска:
```json
{
  "autosign": false
}
```

`autosign: true` — интро пропускается автоматически по Enter без ввода команды.

## Стек

| Компонент | Технология |
|-----------|-----------|
| Backend | Python, Flask, Flask-SocketIO |
| Frontend | Vanilla JS, Socket.IO |
| Desktop | pywebview |
| Шрифты | FiraCode, FiraMono |
| Локализация | RU / EN |

## Структура

```
NetControl/
├── app.py                  — Flask backend, все API маршруты
├── main_desktop.py         — pywebview обёртка
├── setup.json              — конфиг автозапуска
├── requirements.txt
├── modules/
│   ├── port_forward.py     — сканер портов
│   ├── multi_scanner.py    — массовый сканер
│   ├── ping_trace.py       — ping / traceroute
│   ├── dns_lookup.py       — DNS запросы
│   ├── whois_lookup.py     — WHOIS
│   ├── ip_geolocation.py   — геолокация IP
│   ├── ssl_checker.py      — SSL проверка
│   ├── network_monitor.py  — мониторинг сети
│   ├── subnet_calc.py      — калькулятор подсетей
│   ├── network_tools.py    — утилиты (base64, hash, etc.)
│   ├── stress_test.py      — стресс-тест
│   └── settings.py         — настройки
├── templates/
│   └── index.html
├── static/
│   ├── css/style.css
│   └── js/
│       ├── app.js
│       ├── intro.js        — анимация запуска
│       ├── exit.js         — анимация выхода
│       ├── i18n.js         — локализация
│       └── lang/ru.js, en.js
└── assets/
    ├── audio/              — звуки интерфейса
    └── font/               — FiraCode, FiraMono
```
