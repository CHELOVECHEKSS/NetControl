"""
NetControl Desktop — pywebview обёртка над Flask приложением.
Запуск: python main_desktop.py
"""

import threading
import time
import sys
import os
import webview

# Скрываем консольное окно на Windows (работает даже с console=True в spec)
if sys.platform == 'win32':
    import ctypes
    ctypes.windll.user32.ShowWindow(ctypes.windll.kernel32.GetConsoleWindow(), 0)

# Перенаправляем stdout/stderr в лог файл когда нет консоли (exe без консоли)
if sys.stdout is None or sys.stderr is None:
    log_path = os.path.join(os.path.expanduser('~'), 'netcontrol.log')
    log_file = open(log_path, 'w', encoding='utf-8')
    sys.stdout = log_file
    sys.stderr = log_file

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

FLASK_PORT = 5000
FLASK_URL  = f'http://127.0.0.1:{FLASK_PORT}'


def start_flask():
    from app import app, socketio
    socketio.run(app, host='127.0.0.1', port=FLASK_PORT, use_reloader=False, log_output=False)


def wait_for_flask(timeout=10):
    import urllib.request
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            urllib.request.urlopen(FLASK_URL, timeout=1)
            return True
        except Exception:
            time.sleep(0.1)
    return False


if __name__ == '__main__':
    # Запускаем Flask в фоне
    t = threading.Thread(target=start_flask, daemon=True)
    t.start()

    # Ждём пока Flask поднимется
    if not wait_for_flask():
        print("Flask не запустился за 10 секунд")
        sys.exit(1)

    # Создаём окно
    class Api:
        def exit_app(self):
            import sys
            window.destroy()
            sys.exit(0)

    api = Api()

    window = webview.create_window(
        title='NetControl',
        url=FLASK_URL,
        width=1400,
        height=900,
        min_size=(1100, 700),
        background_color='#000000',
        text_select=False,
        fullscreen=True,
        js_api=api,
    )

    def on_loaded():
        pass  # exit.js подключён в index.html

    window.events.loaded += on_loaded

    webview.start(debug=False, private_mode=False)
