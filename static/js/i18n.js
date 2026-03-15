// Система локализации
const I18N = {
    current: 'ru',
    langs: { ru: null, en: null },

    init() {
        this.langs.ru = LANG_RU;
        this.langs.en = LANG_EN;
        const saved = localStorage.getItem('lang') || 'ru';
        this.apply(saved);
    },

    t(key) {
        return this.langs[this.current]?.[key] || this.langs['ru']?.[key] || key;
    },

    apply(lang) {
        this.current = lang;
        localStorage.setItem('lang', lang);

        // Обновляем все элементы с data-i18n
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            const val = this.t(key);
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                if (el.dataset.i18nAttr === 'placeholder') el.placeholder = val;
            } else {
                el.textContent = val;
            }
        });

        // placeholder отдельно
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            el.placeholder = this.t(el.dataset.i18nPlaceholder);
        });

        // Синхронизируем select в настройках
        const sel = document.getElementById('language-select');
        if (sel) sel.value = lang;
    }
};
