# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['main_desktop.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('templates',  'templates'),
        ('static',     'static'),
        ('assets',     'assets'),        ('modules',    'modules'),
        ('config.json', '.'),
    ],
    hiddenimports=[
        'flask',
        'flask_socketio',
        'engineio',
        'socketio',
        'psutil',
        'requests',
        'whois',
        'dns',
        'dns.resolver',
        'webview',
        'webview.platforms.winforms',
        'clr',
        'pythonnet',
        'engineio.async_drivers.threading',
        'socketio.async_drivers.threading',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='NetControl',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    uac_admin=False,
    icon='cmd_16549.ico',
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='NetControl',
)
