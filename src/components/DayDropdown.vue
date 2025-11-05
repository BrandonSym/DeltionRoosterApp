<template>
  <div @click="day.collapsed = !day.collapsed"
    class="flex justify-between px-2 w-full hover:bg-deltionBlue-600 bg-deltionBlue-500 rounded-md border-2 border-deltionBlue-600 p-2 transition-color cursor-pointer duration-100"
    :class="day.collapsed ? 'rounded-b-none bg-deltionBlue-300' : ''">
    <h3 class="text-white/95 font-semibold text-md">
      {{ day.date_f }}
    </h3>
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <path fill="#fff"
        d="M12 17a1.72 1.72 0 0 1-1.33-.64l-4.21-5.1a2.1 2.1 0 0 1-.26-2.21A1.76 1.76 0 0 1 7.79 8h8.42a1.76 1.76 0 0 1 1.59 1.05a2.1 2.1 0 0 1-.26 2.21l-4.21 5.1A1.72 1.72 0 0 1 12 17" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { type Day } from './MobileRoster.vue'

const props = defineProps<{
  day: Day;
}>()

onMounted(() => {
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  if (props.day.date_ts === todayMidnight) {
    props.day.collapsed = true;
  } else {
    props.day.collapsed = false;
  }
});

</script>
