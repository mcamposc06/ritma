/**
 * Polyfill for requestIdleCallback which is missing in some environments 
 * (like older Safari or certain browser extension contexts).
 * We place this at the very top of index.ts to ensure it's available as early as possible.
 */
const g: any = typeof window !== 'undefined' ? window : 
             typeof global !== 'undefined' ? global : 
             typeof self !== 'undefined' ? self : {};

const polyfillRich = (cb: any) => {
    const start = Date.now();
    return setTimeout(function () {
        cb({
            didTimeout: false,
            timeRemaining: function () {
                return Math.max(0, 50 - (Date.now() - start));
            }
        });
    }, 1);
};

const polyfillCancel = (id: any) => {
    clearTimeout(id);
};

if (!g.requestIdleCallback) {
    g.requestIdleCallback = polyfillRich;
    if (typeof window !== 'undefined') (window as any).requestIdleCallback = polyfillRich;
    if (typeof global !== 'undefined') (global as any).requestIdleCallback = polyfillRich;
}
if (!g.cancelIdleCallback) {
    g.cancelIdleCallback = polyfillCancel;
    if (typeof window !== 'undefined') (window as any).cancelIdleCallback = polyfillCancel;
    if (typeof global !== 'undefined') (global as any).cancelIdleCallback = polyfillCancel;
}

import 'react-native-url-polyfill/auto';
import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
