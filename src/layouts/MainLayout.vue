<script setup>
import Header from '../components/Header.vue'
import Footer from '../components/Footer.vue'
import { provide, ref } from 'vue';

const query = ref('');
provide('query', query);

const type = ref('');
provide('type', type);

const selectedDate = ref('');
provide('selectedDate', selectedDate);
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <Header />
    <main class="flex-1">
      <router-view />
    </main>
    <Footer />
  </div>
</template>
