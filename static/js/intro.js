(function() {
    'use strict';

    var themeAudio = null;
    var entered = false;
    var inputText = '';

    function playSound(file, vol) {
        var a = new Audio('/assets/audio/' + file);
        a.volume = vol !== undefined ? vol : 0.6;
        a.play().catch(function(){});
    }

    function startIntro() {
        var overlay   = document.getElementById('intro-overlay');
        var cmdBlock  = document.getElementById('intro-cmd');
        var cmdHist   = document.getElementById('intro-cmd-history');
        var termInput = document.getElementById('intro-term-input');

        if (!overlay || !cmdBlock) return;

        themeAudio = new Audio('/assets/audio/theme.wav');
        themeAudio.volume = 0.7;
        themeAudio.preload = 'auto';

        function addLine(html, color) {
            var d = document.createElement('div');
            d.innerHTML = html;
            if (color) d.style.color = color;
            cmdHist.appendChild(d);
            cmdHist.scrollTop = cmdHist.scrollHeight;
        }

        // Читаем setup.json
        fetch('/api/setup')
            .then(function(r) { return r.json(); })
            .catch(function() { return { autosign: false }; })
            .then(function(setup) {
                var autosign = setup && setup.autosign === true;

                var hint = autosign
                    ? '<span style="color:#555">press <span style="color:#00ff41">ENTER</span> to continue</span>'
                    : '<span style="color:#555">type <span style="color:#00ff41">run</span> and press <span style="color:#00ff41">ENTER</span></span>';

                var initLines = [
                    { html: 'NetControl service [Version 10.0.19045]', delay: 0 },
                    { html: '(c) Chelovechek Corporation. All rights reserved.', delay: 100 },
                    { html: '', delay: 200 },
                    { html: hint, delay: 350 },
                ];
                initLines.forEach(function(item) {
                    setTimeout(function() { addLine(item.html); }, item.delay);
                });

                function onKey(e) {
                    if (entered) return;
                    if (e.ctrlKey || e.altKey || e.metaKey) return;

                    if (e.key === 'Enter') {
                        // autosign — Enter без ввода, иначе нужен "run"
                        if (!autosign && inputText.toLowerCase() !== 'run') return;
                        entered = true;
                        document.removeEventListener('keydown', onKey);

                        var label = autosign && inputText === '' ? 'run' : inputText;
                        addLine('<span style="color:#00ff41">C:\\NetControl&gt;&nbsp;</span><span style="color:#fff">' + label + '</span>');
                        inputText = '';
                        termInput.textContent = '';

                        runBootSequence(cmdHist, function() {
                            themeAudio.currentTime = 0;
                            themeAudio.play().catch(function(){});
                            startIntroPhase();
                        });

                    } else if (e.key === 'Backspace') {
                        e.preventDefault();
                        if (inputText.length > 0) {
                            playSound('stdout.wav', 0.5);
                            inputText = inputText.slice(0, -1);
                            termInput.textContent = inputText;
                        }
                    } else if (e.key.length === 1) {
                        if (autosign) return;
                        if (inputText.length >= 3) return;
                        playSound('stdin.wav', 0.4);
                        // Всегда вводим буквы r-u-n по позиции, независимо от нажатой клавиши
                        var runWord = 'run';
                        inputText += runWord[inputText.length];
                        termInput.textContent = inputText;
                    }
                }

                document.addEventListener('keydown', onKey);
            });
    }

    function runBootSequence(cmdHist, done) {
        var lines = [
            'C:\\NetControl&gt; Initializing system...',
            'CPU cores detected: 8 ... <span style="color:#00ff41">OK</span>',
            'RAM: 16384 MB ... <span style="color:#00ff41">OK</span>',
            'net.ipv4 ... <span style="color:#00ff41">loaded</span>',
            'net.ipv6 ... <span style="color:#00ff41">loaded</span>',
            'Mounting filesystem ... <span style="color:#00ff41">OK</span>',
            'DNS resolver ... <span style="color:#00ff41">OK</span>',
            'Firewall rules ... <span style="color:#00ff41">loaded</span>',
            'module: port_scanner ... <span style="color:#00ff41">OK</span>',
            'module: dns_lookup ... <span style="color:#00ff41">OK</span>',
            'module: ssl_checker ... <span style="color:#00ff41">OK</span>',
            'module: stress_test ... <span style="color:#00ff41">OK</span>',
            'module: multi_scanner ... <span style="color:#00ff41">OK</span>',
            'Socket.IO port 5000 ... <span style="color:#00ff41">OK</span>',
            'REST API ... <span style="color:#00ff41">registered</span>',
            'Loading i18n: ru/en ... <span style="color:#00ff41">OK</span>',
            'Audio engine ... <span style="color:#00ff41">OK</span>',
            'Security scan ... <span style="color:#00ff41">CLEAN</span>',
            'Flask server ... <span style="color:#00ff41">running</span>',
            '&nbsp;',
            '<span style="color:#00ff41">All systems GO. Launching NetControl...</span>',
        ];

        var step = 55;
        lines.forEach(function(html, i) {
            setTimeout(function() {
                var snd = new Audio('/assets/audio/stdin.wav');
                snd.volume = 0.25;
                snd.play().catch(function(){});
                var d = document.createElement('div');
                d.innerHTML = html;
                d.style.color = '#666';
                d.style.fontSize = '0.88rem';
                cmdHist.appendChild(d);
                cmdHist.scrollTop = cmdHist.scrollHeight;
            }, i * step);
        });

        setTimeout(done, lines.length * step + 300);
    }

    function startIntroPhase() {
        var overlay   = document.getElementById('intro-overlay');
        var cmdBlock  = document.getElementById('intro-cmd');
        var canvas    = document.getElementById('intro-matrix');
        var logoImg   = document.getElementById('intro-logo-img');
        var titleEl   = document.getElementById('intro-title-text');
        var subtitle  = document.getElementById('intro-subtitle');
        var corners   = overlay.querySelectorAll('.intro-corner');
        var content   = document.getElementById('intro-content');
        var scanlines = document.getElementById('intro-scanlines');

        cmdBlock.style.transition = 'opacity 0.2s';
        cmdBlock.style.opacity = '0';

        setTimeout(function() {
            cmdBlock.style.display = 'none';

            canvas.style.display = 'block';
            scanlines.style.display = 'block';

            var ctx = canvas.getContext('2d');
            canvas.width  = window.innerWidth;
            canvas.height = window.innerHeight;
            var cols  = Math.floor(canvas.width / 16);
            var drops = [];
            for (var i = 0; i < cols; i++) drops[i] = 1;
            var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*<>/\\|';

            var matrixTimer = setInterval(function() {
                ctx.fillStyle = 'rgba(0,0,0,0.05)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#00ff41';
                ctx.font = '14px monospace';
                for (var j = 0; j < drops.length; j++) {
                    var ch = chars[Math.floor(Math.random() * chars.length)];
                    ctx.fillText(ch, j * 16, drops[j] * 16);
                    if (drops[j] * 16 > canvas.height && Math.random() > 0.975) drops[j] = 0;
                    drops[j]++;
                }
            }, 40);

            content.style.display = 'flex';

            // Угловые рамки сразу
            setTimeout(function() {
                corners.forEach(function(c) { c.style.opacity = '1'; });
            }, 50);

            // 0.6s — полоска растягивается снизу вверх поверх логотипа → логотип появляется → полоска сжимается вверх
            setTimeout(function() {
                var logoEl = document.getElementById('intro-logo');

                var bar = document.createElement('div');
                bar.style.cssText = [
                    'position:absolute',
                    'left:0', 'right:0', 'top:0', 'bottom:0',
                    'background:#00ff41',
                    'transform:scaleY(0)',
                    'transform-origin:bottom center',
                    'transition:transform 0.2s ease-out',
                    'box-shadow:0 0 20px #00ff41',
                    'z-index:5',
                ].join(';');

                // position:relative на логотипе чтобы absolute работал внутри
                logoEl.style.position = 'relative';
                logoEl.appendChild(bar);

                // Растягиваем снизу вверх
                requestAnimationFrame(function() {
                    requestAnimationFrame(function() {
                        bar.style.transform = 'scaleY(1)';
                    });
                });

                // Полоска полностью растянулась — показываем логотип
                setTimeout(function() {
                    logoImg.classList.add('visible');

                    // Сжимаем вверх
                    bar.style.transformOrigin = 'top center';
                    bar.style.transition = 'transform 0.18s ease-in';
                    bar.style.transform = 'scaleY(0)';
                }, 220);

                // Убираем полоску
                setTimeout(function() {
                    if (bar.parentNode) bar.parentNode.removeChild(bar);
                }, 420);
            }, 600);

            // 1.1s — начинаем печатать NetControl (до 1.6s = 500мс на 10 символов = 50мс/символ)
            setTimeout(function() {
                titleEl.textContent = '';
                typeText(titleEl, 'NetControl', 50, null);
            }, 1100);

            // 1.7s — глитч
            setTimeout(function() {
                var tp = document.getElementById('intro-title');
                tp.classList.add('glitch-active');
                setTimeout(function() { tp.classList.remove('glitch-active'); }, 300);
            }, 1700);

            // subtitle чуть после глитча
            setTimeout(function() {
                subtitle.style.opacity = '1';
            }, 2000);

            setTimeout(function() {
                clearInterval(matrixTimer);

                if (themeAudio) {
                    themeAudio.pause();
                    themeAudio.currentTime = 0;
                }

                overlay.classList.add('fade-out');
                setTimeout(function() {
                    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                }, 600);

                var navItems = document.querySelectorAll('.nav-item');
                var interval = Math.min(80, 400 / navItems.length);
                navItems.forEach(function(item, index) {
                    setTimeout(function() {
                        item.classList.add('nav-visible');
                        playSound('panels.wav', 0.6);
                    }, index * interval);
                });

                var lastDelay = (navItems.length - 1) * interval + 150;
                setTimeout(function() {
                    var mainContent = document.querySelector('.content');
                    if (mainContent) mainContent.style.visibility = 'visible';
                    if (typeof playBootEffect === 'function') playBootEffect();
                }, lastDelay);

            }, 2800);

        }, 100);
    }

    function typeText(el, text, speed, cb) {
        el.textContent = '';
        var i = 0;
        var t = setInterval(function() {
            el.textContent += text[i++];
            if (i >= text.length) {
                clearInterval(t);
                if (cb) cb();
            }
        }, speed);
    }

    window.animateNavItems = function() {};

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startIntro);
    } else {
        startIntro();
    }
})();
