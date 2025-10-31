<template>
  <div class="mx-0 my-4 flex flex-col rounded-lg">
    <div
      v-for="(day, dIndex) in props.orderedScheduleData"
      :key="day.date"
      class="p-1"
    >
      <DayDropdown :day="day" />

      <div
        class="flex overflow-hidden transition-all duration-200"
        :class="day.collapsed ? 'max-h-[2100px] ease-in' : 'max-h-0 ease-out'"
      >
        <!-- left time-slot column -->
        <div class="flex flex-col w-8 shrink-0">
          <div
            v-for="(slot, sIndex) in day.hours"
            :key="sIndex"
            :class="[
              'flex items-center justify-center font-bold text-xl text-white',
              sIndex === (props.timeSlots?.length ?? 0) - 1 ? 'rounded-bl-lg' : '',
              sIndex % 2 === 0 ? 'bg-deltionOrange-400' : 'bg-deltionOrange-500',
            ]"
            :style="{ height: 'var(--slot-height)' }"
          >
            {{ sIndex }}
          </div>
        </div>

        <!-- right: horizontally-scrollable grid -->
        <div class="flex-1 overflow-x-auto overflow-y-visible">
          <div
            v-if="rosterPerDayGrid[dIndex]"
            class="relative w-full"
            :style="{
              minWidth: `calc(${rosterPerDayGrid[dIndex].columns} * var(--col-width))`,
              display: 'grid',
              gridTemplateRows: `repeat(${rosterPerDayGrid[dIndex].slots.length}, var(--slot-height))`,
              gridTemplateColumns: `repeat(${rosterPerDayGrid[dIndex].columns}, minmax(var(--col-min), var(--col-max)))`
            }"
          >
            <!-- background stripes per row (span all columns) -->
            <template v-for="(slot, i) in rosterPerDayGrid[dIndex].slots" :key="'bg-'+i">
              <div
                :style="{ gridRow: `${i+1} / span 1`, gridColumn: `1 / span 2` }"
                :class="i % 2 === 0 ? 'bg-deltionBlue-50' : 'bg-deltionBlue-100'"
              />
            </template>

            <!-- lesson cards placed by grid row/col -->
            <div
              v-for="(lesson, lIndex) in rosterPerDayGrid[dIndex].lessons"
              :key="lesson._uid ?? lesson.id ?? `${lesson.v}-${lesson.st}-${lesson.et}`"
              class="m-1 p-2 rounded-lg bg-deltionBlue-200 border border-deltionBlue-500 flex flex-col"
              :style="{
                gridRow: `${lesson.rowStart} / span ${lesson.rowSpan}`,
                gridColumn: `${lesson.colStart} / span ${lesson.rowConcurrentMax >= 2 ? 1 : 2}`,
                alignSelf: 'stretch',
                justifySelf: 'stretch',
                minWidth: '0'
              }"
            >
              <div class="text-deltionBlue-900 font-semibold text-base">
                {{ lesson.v }}
              </div>
              <div class="text-deltionBlue-800 text-sm">
                {{ lesson.r }}
              </div>
              <div class="text-deltionBlue-800 text-sm">
                {{ lesson.t }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DayDropdown from './DayDropdown.vue'

/* ---------- types ---------- */
interface TimeSlot {
  id: number
  nr: number
  st: number // timestamp or minutes
  et: number
  stMin?: number // computed minutes from midnight
  etMin?: number
}

interface Lesson {
  id?: number
  v: string
  st: number
  et: number
  t: string
  r: string
  g: string
  startMin?: number // computed
  endMin?: number   // computed
}

interface Day {
  date: string
  date_f: string
  date_ts: number
  items: Lesson[]
  hours: TimeSlot[]
  collapsed: boolean
}

/* ---------- props ---------- */
const props = defineProps<{
  timeSlots: TimeSlot[]
  orderedScheduleData: Day[]
}>()

/* ---------- helpers ---------- */
function mergeSameLessons(lessons: Lesson[] = []) {
  if (!lessons.length) return []
  const sorted = [...lessons].sort((a, b) => a.st - b.st || a.et - b.et)
  const merged: Lesson[] = []

  for (const l of sorted) {
    const last = merged[merged.length - 1]
    if (last && last.v === l.v && last.r === l.r && l.st <= last.et) {
      last.et = Math.max(last.et, l.et)
    } else {
      merged.push({ ...l })
    }
  }

  return merged
}

function buildRosterGridForDay(day: Day) {
  const slots = (day.hours || []).map(s => ({
    ...s,
    stMin: s.st, // assume st/et are already minutes since midnight; adjust if timestamps
    etMin: s.et,
  }))

  if (!slots.length) return { slots: [], columns: 0, lessons: [] as Lesson[] }

  const merged = mergeSameLessons(day.items || []).map(ls => ({
    ...ls,
    startMin: ls.st,
    endMin: ls.et
  }))

  const withSlots = merged
    .map(ls => {
      const startIndex = slots.findIndex(
        s => ls.startMin! < s.etMin! && ls.endMin! > s.stMin!
      )
      const span = slots.filter(
        s => ls.startMin! < s.etMin! && ls.endMin! > s.stMin!
      ).length
      return { ...ls, startIndex, span }
    })
    .filter(x => x.startIndex !== -1)

  if (!withSlots.length) {
    return { slots, columns: 1, lessons: [] }
  }

  const slotConcurrency = new Array(slots.length).fill(0)
  for (const L of withSlots) {
    for (let i = L.startIndex; i < L.startIndex + L.span; i++) {
      slotConcurrency[i]++
    }
  }

  withSlots.sort((a, b) => a.startIndex - b.startIndex || b.span - a.span)

  const columnsEnd: number[] = []
  const placed: any[] = []

  for (const L of withSlots) {
    const start = L.startIndex
    const end = L.startIndex + L.span - 1

    let placedCol = -1
    for (let c = 0; c < columnsEnd.length; c++) {
      if (columnsEnd[c] < start) {
        placedCol = c
        columnsEnd[c] = end
        break
      }
    }

    if (placedCol === -1) {
      columnsEnd.push(end)
      placedCol = columnsEnd.length - 1
    }

    placed.push({
      ...L,
      rowStart: L.startIndex + 1,
      rowSpan: L.span,
      colStart: placedCol + 1,
      stack: placedCol,
      _uid: `${L.v}-${L.r}-${L.st}-${L.et}-${Math.random().toString(36).slice(2,8)}`
    })
  }

  for (const L of placed) {
    const start = L.startIndex
    const end = L.startIndex + L.span
    const maxConcurrent = Math.max(...slotConcurrency.slice(start, end))
    L.rowConcurrentMax = maxConcurrent
  }

  const maxConcurrencyOverall = Math.max(...slotConcurrency, 0)
  const columns = Math.max(1, columnsEnd.length, maxConcurrencyOverall)

  return {
    slots,
    columns,
    lessons: placed
  }
}

const rosterPerDayGrid = computed(() =>
  props.orderedScheduleData.map((day) => buildRosterGridForDay(day))
)
</script>

<style>
:root {
  --slot-height: 7rem;
  --col-min: dvw;
  --col-max: 14rem;
  --col-width: var(--col-min);
}

.remove-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.remove-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
