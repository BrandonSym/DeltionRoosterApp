<template>
  <div id="app">
    <nav class="nav">
      <router-link to="/" class="nav-link">Scanner</router-link>
      <router-link to="/map-maker" class="nav-link">Map Maker</router-link>
    </nav>
    <router-view />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'App'
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: #f5f5f5;
  overflow-x: hidden;
}

#app {
  min-height: 100vh;
  width: 100%;
}

.nav {
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  padding: 1rem;
  display: flex;
  gap: 1rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-link {
  padding: 0.5rem 1rem;
  text-decoration: none;
  color: #2c3e50;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.2s;
}

.nav-link:hover {
  background: #f3f4f6;
}

.nav-link.router-link-active {
  background: #3b82f6;
  color: white;
}
</style>
