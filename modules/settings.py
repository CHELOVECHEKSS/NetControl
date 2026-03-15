import json
import os

class SettingsManager:
    def __init__(self, config_file='config.json'):
        self.config_file = config_file
        self.default_settings = {
            'theme': 'dark',
            'language': 'ru',
            'notifications': True,
            'auto_refresh': True,
            'refresh_interval': 5,
            'max_ports': 50,
            'log_level': 'info',
            'animation_speed': 'normal',
            'show_stats': True,
            'advanced': {
                'timeout': 30,
                'retry_attempts': 3,
                'buffer_size': 4096,
                'enable_logging': True,
                'log_file': 'app.log'
            }
        }
        self.settings = self._load_settings()
    
    def _load_settings(self):
        """Загрузить настройки из файла"""
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                return self.default_settings.copy()
        return self.default_settings.copy()
    
    def _save_settings(self):
        """Сохранить настройки в файл"""
        try:
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(self.settings, f, indent=4, ensure_ascii=False)
            return True
        except Exception as e:
            return False
    
    def get_settings(self):
        """Получить текущие настройки"""
        return {
            'success': True,
            'settings': self.settings
        }
    
    def update_settings(self, new_settings):
        """Обновить настройки"""
        try:
            self.settings.update(new_settings)
            self._save_settings()
            return {
                'success': True,
                'settings': self.settings
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
