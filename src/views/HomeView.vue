<template>
  <div class="scanner">
    <div class="header">
      <h1>WiFi Access Point Scanner</h1>
      <p class="subtitle">Discovering nearby access points</p>
    </div>

    <div class="controls">
      <button @click="toggleScanning" class="btn-primary">
        {{ isScanning ? 'Stop Scanning' : 'Start Scanning' }}
      </button>
      <button @click="requestPermissions" class="btn-secondary">
        Request Permissions
      </button>
    </div>

    <div v-if="message" class="message" :class="messageType">
      {{ message }}
    </div>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">{{ networks.length }}</div>
        <div class="stat-label">Access Points Found</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ isScanning ? 'Active' : 'Stopped' }}</div>
        <div class="stat-label">Scan Status</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ lastScanTime }}</div>
        <div class="stat-label">Last Scan</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ scanCount }}</div>
        <div class="stat-label">Total Scans</div>
      </div>
    </div>

    <div v-if="networks.length > 0" class="networks-list">
      <h2>Detected Access Points</h2>
      <div class="network-card" v-for="network in sortedNetworks" :key="network.BSSID">
        <div class="network-header">
          <div class="network-ssid">{{ network.SSID || '(Hidden Network)' }}</div>
          <div class="network-signal" :class="getSignalClass(network.level)">
            {{ network.level }} dBm
          </div>
        </div>
        <div class="network-details">
          <div class="detail-item">
            <span class="detail-label">BSSID:</span>
            <span class="detail-value">{{ network.BSSID }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Frequency:</span>
            <span class="detail-value">{{ network.frequency }} MHz</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Band:</span>
            <span class="detail-value">{{ getBand(network.frequency) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="!isScanning" class="empty-state">
      <p>No access points detected yet.</p>
      <p>Click "Start Scanning" to begin.</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onUnmounted } from 'vue';
import { WifiPlugin, type WifiNetwork } from '@/services/wifi-plugin';

export default defineComponent({
  setup() {
    const message = ref<string>('');
    const messageType = ref<'info' | 'success' | 'error'>('info');
    const networks = ref<WifiNetwork[]>([]);
    const isScanning = ref<boolean>(false);
    const lastScanTime = ref<string>('Never');
    const scanCount = ref<number>(0);
    const isCurrentlyScanning = ref<boolean>(false);
    let scanInterval: number | null = null;

    const sortedNetworks = computed(() => {
      return [...networks.value].sort((a, b) => b.level - a.level);
    });

    const getSignalClass = (level: number): string => {
      if (level >= -50) return 'signal-excellent';
      if (level >= -60) return 'signal-good';
      if (level >= -70) return 'signal-fair';
      return 'signal-poor';
    };

    const getBand = (frequency: number): string => {
      if (frequency >= 2400 && frequency <= 2500) return '2.4 GHz';
      if (frequency >= 5000 && frequency <= 6000) return '5 GHz';
      return 'Unknown';
    };

    const requestPermissions = async () => {
      try {
        const result = await WifiPlugin.requestPermissions();
        
        if (result.granted) {
          message.value = 'Permissions granted! You can now scan networks.';
          messageType.value = 'success';
        } else {
          message.value = 'Permissions denied. Please enable location permissions in settings.';
          messageType.value = 'error';
        }
      } catch (err: any) {
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
        } else {
          message.value = `No access points found (Scan #${scanCount.value})`;
          messageType.value = 'info';
        }
      } catch (err: any) {
        console.error('[v0] Scan error:', err);
        if (err.message && err.message.includes('Scan failed to start')) {
          message.value = `Android scan throttling detected. Scans are limited to 4 per 2 minutes. Waiting...`;
          messageType.value = 'error';
        } else {
          message.value = `Scan Error: ${err.message || err}`;
          messageType.value = 'error';
        }
      } finally {
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
      } else {
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
</script>

<style scoped>
.scanner {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 1.75rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #7f8c8d;
  font-size: 0.95rem;
}

.controls {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  min-height: 44px;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.message {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  text-align: center;
}

.message.info {
  background: #dbeafe;
  color: #1e40af;
}

.message.success {
  background: #d1fae5;
  color: #065f46;
}

.message.error {
  background: #fee2e2;
  color: #991b1b;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.25rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  text-align: center;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #7f8c8d;
}

.networks-list h2 {
  font-size: 1.25rem;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.network-card {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  margin-bottom: 0.75rem;
}

.network-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  gap: 1rem;
}

.network-ssid {
  font-size: 1.125rem;
  font-weight: 600;
  color: #2c3e50;
  word-break: break-word;
}

.network-signal {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
}

.signal-excellent {
  background: #d1fae5;
  color: #065f46;
}

.signal-good {
  background: #dbeafe;
  color: #1e40af;
}

.signal-fair {
  background: #fef3c7;
  color: #92400e;
}

.signal-poor {
  background: #fee2e2;
  color: #991b1b;
}

.network-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  gap: 1rem;
}

.detail-label {
  color: #7f8c8d;
  font-weight: 500;
}

.detail-value {
  color: #2c3e50;
  font-family: monospace;
  word-break: break-all;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #7f8c8d;
}

.empty-state p {
  margin-bottom: 0.5rem;
}

@media (max-width: 768px) {
  .scanner {
    padding: 0.75rem;
  }

  .header h1 {
    font-size: 1.5rem;
  }

  .controls {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
  }

  .stats {
    grid-template-columns: 1fr;
  }

  .network-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .network-signal {
    align-self: flex-start;
  }
}
</style>
