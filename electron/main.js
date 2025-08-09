const { app, BrowserWindow, session, globalShortcut } = require('electron');
const path = require('path');

// Disable autofill features
app.commandLine.appendSwitch('disable-features', 'AutofillEnableAccountWalletStorage,AutofillServerCommunication');

function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 700,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: false,
            devTools: true,
        },
    });

    const devUrl = process.env.VITE_DEV_SERVER_URL;
    if (devUrl) {
        win.loadURL(devUrl);
    } else {
        win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    }

    win.webContents.once('did-frame-finish-load', () => {
        win.webContents.openDevTools({ mode: 'right' });
    });

    // Chặn lỗi autofill trong DevTools
    win.webContents.on('devtools-opened', () => {
        win.webContents.devToolsWebContents.executeJavaScript(`
            // Override console để ẩn lỗi autofill
            const originalError = console.error;
            console.error = function(...args) {
                const message = args.join(' ');
                if (message.includes('Autofill.enable') ||
                    message.includes('Autofill.setAddresses') ||
                    message.includes('Request Autofill')) {
                    return; // Ẩn lỗi autofill
                }
                originalError.apply(console, args);
            };
        `).catch(() => {});
    });

    // Phím tắt trong cửa sổ
    win.webContents.on('before-input-event', (event, input) => {
        if ((input.control || input.meta) && input.shift && input.key.toLowerCase() === 'i') {
            event.preventDefault();
            if (win.webContents.isDevToolsOpened()) {
                win.webContents.closeDevTools();
            } else {
                win.webContents.openDevTools({ mode: 'right' });
            }
        }
    });

    return win;
}

app.whenReady().then(() => {
    session.defaultSession.webRequest.onBeforeRequest({ urls: ['*://*/autofill/*'] },
        (details, callback) => callback(details.url.includes('autofill') ? { cancel: true } : {}));

    const win = createWindow();

    const ok = globalShortcut.register('CommandOrControl+Shift+I', () => {
        if (win.webContents.isDevToolsOpened()) win.webContents.closeDevTools();
        else win.webContents.openDevTools({ mode: 'right' });
    });
    console.log('Global shortcut registered:', ok);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        globalShortcut.unregisterAll();
        app.quit();
    }
});
