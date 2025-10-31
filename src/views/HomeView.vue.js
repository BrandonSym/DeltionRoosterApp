import { defineComponent, ref, computed, onUnmounted } from 'vue';
import { WifiPlugin } from '@/services/wifi-plugin';
debugger; /* PartiallyEnd: #3632/script.vue */
const __VLS_export = defineComponent({
    setup() {
        const message = ref('');
        const messageType = ref('info');
        const networks = ref([]);
        const isScanning = ref(false);
        const lastScanTime = ref('Never');
        const scanCount = ref(0);
        const isCurrentlyScanning = ref(false);
        let scanInterval = null;
        const sortedNetworks = computed(() => {
            return [...networks.value].sort((a, b) => b.level - a.level);
        });
        const getSignalClass = (level) => {
            if (level >= -50)
                return 'signal-excellent';
            if (level >= -60)
                return 'signal-good';
            if (level >= -70)
                return 'signal-fair';
            return 'signal-poor';
        };
        const getBand = (frequency) => {
            if (frequency >= 2400 && frequency <= 2500)
                return '2.4 GHz';
            if (frequency >= 5000 && frequency <= 6000)
                return '5 GHz';
            return 'Unknown';
        };
        const requestPermissions = async () => {
            try {
                const result = await WifiPlugin.requestPermissions();
                if (result.granted) {
                    message.value = 'Permissions granted! You can now scan networks.';
                    messageType.value = 'success';
                }
                else {
                    message.value = 'Permissions denied. Please enable location permissions in settings.';
                    messageType.value = 'error';
                }
            }
            catch (err) {
                console.error('[v0] Permission error:', err);
                message.value = `Permission Error: ${err.message || err}`;
                messageType.value = 'error';
            }
        };
        const scanNetworks = async () => {
            if (isCurrentlyScanning.value) {
                return;
            }
            try {
                isCurrentlyScanning.value = true;
                const result = await WifiPlugin.scanNetworks();
                networks.value = result.networks;
                lastScanTime.value = new Date().toLocaleTimeString();
                scanCount.value++;
                if (result.networks.length > 0) {
                    message.value = `Found ${result.networks.length} access points (Scan #${scanCount.value})`;
                    messageType.value = 'success';
                }
                else {
                    message.value = `No access points found (Scan #${scanCount.value})`;
                    messageType.value = 'info';
                }
            }
            catch (err) {
                console.error('[v0] Scan error:', err);
                if (err.message && err.message.includes('Scan failed to start')) {
                    message.value = `Android scan throttling detected. Scans are limited to 4 per 2 minutes. Waiting...`;
                    messageType.value = 'error';
                }
                else {
                    message.value = `Scan Error: ${err.message || err}`;
                    messageType.value = 'error';
                }
            }
            finally {
                isCurrentlyScanning.value = false;
            }
        };
        const toggleScanning = async () => {
            if (isScanning.value) {
                if (scanInterval !== null) {
                    clearInterval(scanInterval);
                    scanInterval = null;
                }
                isScanning.value = false;
                isCurrentlyScanning.value = false;
                message.value = `Scanning stopped. Completed ${scanCount.value} scans.`;
                messageType.value = 'info';
            }
            else {
                isScanning.value = true;
                scanCount.value = 0;
                message.value = 'Scanning started (every 30 seconds to avoid Android throttling)...';
                messageType.value = 'info';
                await scanNetworks();
                scanInterval = window.setInterval(() => {
                    if (isScanning.value) {
                        scanNetworks().catch(err => {
                            console.error('[v0] Interval scan error (continuing):', err);
                        });
                    }
                }, 30000); // Changed from 2000ms to 30000ms (30 seconds)
            }
        };
        onUnmounted(() => {
            if (scanInterval !== null) {
                clearInterval(scanInterval);
                scanInterval = null;
            }
            isScanning.value = false;
            isCurrentlyScanning.value = false;
        });
        return {
            message,
            messageType,
            networks,
            isScanning,
            lastScanTime,
            scanCount,
            sortedNetworks,
            requestPermissions,
            toggleScanning,
            getSignalClass,
            getBand
        };
    },
});
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        const message = ref('');
        const messageType = ref('info');
        const networks = ref([]);
        const isScanning = ref(false);
        const lastScanTime = ref('Never');
        const scanCount = ref(0);
        const isCurrentlyScanning = ref(false);
        let scanInterval = null;
        const sortedNetworks = computed(() => {
            return [...networks.value].sort((a, b) => b.level - a.level);
        });
        const getSignalClass = (level) => {
            if (level >= -50)
                return 'signal-excellent';
            if (level >= -60)
                return 'signal-good';
            if (level >= -70)
                return 'signal-fair';
            return 'signal-poor';
        };
        const getBand = (frequency) => {
            if (frequency >= 2400 && frequency <= 2500)
                return '2.4 GHz';
            if (frequency >= 5000 && frequency <= 6000)
                return '5 GHz';
            return 'Unknown';
        };
        const requestPermissions = async () => {
            try {
                const result = await WifiPlugin.requestPermissions();
                if (result.granted) {
                    message.value = 'Permissions granted! You can now scan networks.';
                    messageType.value = 'success';
                }
                else {
                    message.value = 'Permissions denied. Please enable location permissions in settings.';
                    messageType.value = 'error';
                }
            }
            catch (err) {
                console.error('[v0] Permission error:', err);
                message.value = `Permission Error: ${err.message || err}`;
                messageType.value = 'error';
            }
        };
        const scanNetworks = async () => {
            if (isCurrentlyScanning.value) {
                return;
            }
            try {
                isCurrentlyScanning.value = true;
                const result = await WifiPlugin.scanNetworks();
                networks.value = result.networks;
                lastScanTime.value = new Date().toLocaleTimeString();
                scanCount.value++;
                if (result.networks.length > 0) {
                    message.value = `Found ${result.networks.length} access points (Scan #${scanCount.value})`;
                    messageType.value = 'success';
                }
                else {
                    message.value = `No access points found (Scan #${scanCount.value})`;
                    messageType.value = 'info';
                }
            }
            catch (err) {
                console.error('[v0] Scan error:', err);
                if (err.message && err.message.includes('Scan failed to start')) {
                    message.value = `Android scan throttling detected. Scans are limited to 4 per 2 minutes. Waiting...`;
                    messageType.value = 'error';
                }
                else {
                    message.value = `Scan Error: ${err.message || err}`;
                    messageType.value = 'error';
                }
            }
            finally {
                isCurrentlyScanning.value = false;
            }
        };
        const toggleScanning = async () => {
            if (isScanning.value) {
                if (scanInterval !== null) {
                    clearInterval(scanInterval);
                    scanInterval = null;
                }
                isScanning.value = false;
                isCurrentlyScanning.value = false;
                message.value = `Scanning stopped. Completed ${scanCount.value} scans.`;
                messageType.value = 'info';
            }
            else {
                isScanning.value = true;
                scanCount.value = 0;
                message.value = 'Scanning started (every 30 seconds to avoid Android throttling)...';
                messageType.value = 'info';
                await scanNetworks();
                scanInterval = window.setInterval(() => {
                    if (isScanning.value) {
                        scanNetworks().catch(err => {
                            console.error('[v0] Interval scan error (continuing):', err);
                        });
                    }
                }, 30000); // Changed from 2000ms to 30000ms (30 seconds)
            }
        };
        onUnmounted(() => {
            if (scanInterval !== null) {
                clearInterval(scanInterval);
                scanInterval = null;
            }
            isScanning.value = false;
            isCurrentlyScanning.value = false;
        });
        return {
            message,
            messageType,
            networks,
            isScanning,
            lastScanTime,
            scanCount,
            sortedNetworks,
            requestPermissions,
            toggleScanning,
            getSignalClass,
            getBand
        };
    },
});
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['header']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['message']} */ ;
/** @type {__VLS_StyleScopedClasses['message']} */ ;
/** @type {__VLS_StyleScopedClasses['message']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['scanner']} */ ;
/** @type {__VLS_StyleScopedClasses['header']} */ ;
/** @type {__VLS_StyleScopedClasses['controls']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['stats']} */ ;
/** @type {__VLS_StyleScopedClasses['network-header']} */ ;
/** @type {__VLS_StyleScopedClasses['network-signal']} */ ;
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "scanner" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "header" },
});
__VLS_asFunctionalElement(__VLS_elements.h1, __VLS_elements.h1)({});
__VLS_asFunctionalElement(__VLS_elements.p, __VLS_elements.p)({
    ...{ class: "subtitle" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "controls" },
});
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (__VLS_ctx.toggleScanning) },
    ...{ class: "btn-primary" },
});
// @ts-ignore
[toggleScanning,];
(__VLS_ctx.isScanning ? 'Stop Scanning' : 'Start Scanning');
// @ts-ignore
[isScanning,];
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (__VLS_ctx.requestPermissions) },
    ...{ class: "btn-secondary" },
});
// @ts-ignore
[requestPermissions,];
if (__VLS_ctx.message) {
    // @ts-ignore
    [message,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "message" },
        ...{ class: (__VLS_ctx.messageType) },
    });
    // @ts-ignore
    [messageType,];
    (__VLS_ctx.message);
    // @ts-ignore
    [message,];
}
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "stats" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "stat-card" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "stat-value" },
});
(__VLS_ctx.networks.length);
// @ts-ignore
[networks,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "stat-label" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "stat-card" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "stat-value" },
});
(__VLS_ctx.isScanning ? 'Active' : 'Stopped');
// @ts-ignore
[isScanning,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "stat-label" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "stat-card" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "stat-value" },
});
(__VLS_ctx.lastScanTime);
// @ts-ignore
[lastScanTime,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "stat-label" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "stat-card" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "stat-value" },
});
(__VLS_ctx.scanCount);
// @ts-ignore
[scanCount,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "stat-label" },
});
if (__VLS_ctx.networks.length > 0) {
    // @ts-ignore
    [networks,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "networks-list" },
    });
    __VLS_asFunctionalElement(__VLS_elements.h2, __VLS_elements.h2)({});
    for (const [network] of __VLS_getVForSourceType((__VLS_ctx.sortedNetworks))) {
        // @ts-ignore
        [sortedNetworks,];
        __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
            ...{ class: "network-card" },
            key: (network.BSSID),
        });
        __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
            ...{ class: "network-header" },
        });
        __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
            ...{ class: "network-ssid" },
        });
        (network.SSID || '(Hidden Network)');
        __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
            ...{ class: "network-signal" },
            ...{ class: (__VLS_ctx.getSignalClass(network.level)) },
        });
        // @ts-ignore
        [getSignalClass,];
        (network.level);
        __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
            ...{ class: "network-details" },
        });
        __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
            ...{ class: "detail-item" },
        });
        __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
            ...{ class: "detail-label" },
        });
        __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
            ...{ class: "detail-value" },
        });
        (network.BSSID);
        __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
            ...{ class: "detail-item" },
        });
        __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
            ...{ class: "detail-label" },
        });
        __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
            ...{ class: "detail-value" },
        });
        (network.frequency);
        __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
            ...{ class: "detail-item" },
        });
        __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
            ...{ class: "detail-label" },
        });
        __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
            ...{ class: "detail-value" },
        });
        (__VLS_ctx.getBand(network.frequency));
        // @ts-ignore
        [getBand,];
    }
}
else if (!__VLS_ctx.isScanning) {
    // @ts-ignore
    [isScanning,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "empty-state" },
    });
    __VLS_asFunctionalElement(__VLS_elements.p, __VLS_elements.p)({});
    __VLS_asFunctionalElement(__VLS_elements.p, __VLS_elements.p)({});
}
/** @type {__VLS_StyleScopedClasses['scanner']} */ ;
/** @type {__VLS_StyleScopedClasses['header']} */ ;
/** @type {__VLS_StyleScopedClasses['subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['controls']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['message']} */ ;
/** @type {__VLS_StyleScopedClasses['stats']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
/** @type {__VLS_StyleScopedClasses['networks-list']} */ ;
/** @type {__VLS_StyleScopedClasses['network-card']} */ ;
/** @type {__VLS_StyleScopedClasses['network-header']} */ ;
/** @type {__VLS_StyleScopedClasses['network-ssid']} */ ;
/** @type {__VLS_StyleScopedClasses['network-signal']} */ ;
/** @type {__VLS_StyleScopedClasses['network-details']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-item']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-label']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-value']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-item']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-label']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-value']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-item']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-label']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-value']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
export default {};
