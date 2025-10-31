<template>
  <div
    @click="day.collapsed = !day.collapsed"
    class="flex justify-between px-2 w-full hover:bg-deltionBlue-300 bg-deltionBlue-200 rounded-md border-2 border-deltionBlue-300 p-2 transition-color cursor-pointer duration-100"
    :class="day.collapsed ? 'rounded-b-none bg-deltionBlue-300' : ''"
  >
    <h3 class="text-deltionBlue-800 font-semibold text-md">
      {{ day.date_f }}
    </h3>
    <div class="text-deltionBlue-800">
      ▼
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

// Define the Day type with all used properties
export type Day = {
  date_f: string;       // formatted date string
  date_ts: number;      // timestamp at midnight
  collapsed: boolean;   // whether the dropdown is collapsed
};

const props = defineProps<{
  day: Day;
}>();

onMounted(() => {
  const today = new Date();
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();

  // Automatically collapse if it's today
  props.day.collapsed = props.day.date_ts === todayMidnight;
});
</script>

<style scoped>
/* optional, Tailwind already handles most styling */
</style>
