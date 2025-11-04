<template>
  <div
    @click="toggleDropdown"
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
import { onMounted } from 'vue'

export interface Day {
  date_f: string
  date_ts: number
  collapsed: boolean
}

const props = defineProps<{ day: Day }>()

function toggleDropdown() {
  props.day.collapsed = !props.day.collapsed
  console.log(`Toggled ${props.day.date_f}: collapsed = ${props.day.collapsed}`)
}

onMounted(() => {
  const today = new Date()
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const isToday = props.day.date_ts === todayMidnight

  if (props.day.collapsed === undefined) {
    console.warn(`DayDropdown: collapsed was undefined for ${props.day.date_f}, setting to false.`)
    props.day.collapsed = false
  }

  console.log(`Mounted DayDropdown for ${props.day.date_f} | isToday=${isToday} | collapsed=${props.day.collapsed}`)
  if (isToday) props.day.collapsed = true
})
</script>

<style scoped>
</style>
