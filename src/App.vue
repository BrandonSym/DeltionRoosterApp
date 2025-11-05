<script setup>
import { ref, provide } from "vue";

const query = ref("");
query.value = "";
provide("query", query);
</script>

<template>
  <router-view />
</template>
