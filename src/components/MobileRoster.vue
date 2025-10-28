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
            {{console.log(lesson)}}
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
  st: number
  et: number
}

interface Lesson {
  id?: number
  v: string
  st: number
  et: number
  t: string
  r: string
  g: string
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

// merge lessons that have same v+r and overlap/are contiguous in time
function mergeSameLessons(lessons: Lesson[] = []) {
  if (!lessons.length) return []
  const sorted = [...lessons].sort((a, b) => a.st - b.st || a.et - b.et)
  const merged: Lesson[] = []

  for (const l of sorted) {
    const last = merged[merged.length - 1]
    if (last && last.v === l.v && last.r === l.r && l.st <= last.et) {
      // overlap or contiguous — extend end time
      last.et = Math.max(last.et, l.et)
      // optionally merge other fields (t/g) if needed
    } else {
      merged.push({ ...l })
    }
  }

  return merged
}

/*
 Build a grid model:
  - slots: the day's time slots (rows)
  - lessons: each with rowStart (1-based), rowSpan, colStart
  - columns: number of columns required to avoid overlaps
*/
function buildRosterGridForDay(day: Day) {
  const slots = (day.hours || []).map(s => ({
    ...s,
    stMin: new Date(s.st).getHours() * 60 + new Date(s.st).getMinutes(),
    etMin: new Date(s.et).getHours() * 60 + new Date(s.et).getMinutes(),
  }))

  if (!slots.length) return { slots: [], columns: 0, lessons: [] as any[] }

  const merged = mergeSameLessons(day.items || []);

  // compute start index & span for each lesson (based on which slots it overlaps)
  const withSlots = merged
    .map(ls => {
      const startIndex = slots.findIndex(
        s => ls.startMin < s.etMin && ls.endMin > s.stMin
      )
      const span = slots.filter(
        s => ls.startMin < s.etMin && ls.endMin > s.stMin
      ).length
      return { ...ls, startIndex, span }
    })
    .filter(x => x.startIndex !== -1)

  // If no mapped lessons, return minimal grid
  if (!withSlots.length) {
    return {
      slots,
      columns: 1,
      lessons: [],
    }
  }

  // --- Build per-slot concurrency counts ---
  const slotConcurrency = new Array(slots.length).fill(0)
  for (const L of withSlots) {
    for (let i = L.startIndex; i < L.startIndex + L.span; i++) {
      slotConcurrency[i]++
    }
  }

  // --- sort & column packing (existing algorithm) ---
  withSlots.sort((a, b) => a.startIndex - b.startIndex || b.span - a.span)

  const columnsEnd: number[] = [] // last occupied row-end index for each column
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
      stack: placedCol, // 0-based stack index (useful if you want to position within the column)
      _uid: `${L.v}-${L.r}-${L.st}-${L.et}-${Math.random().toString(36).slice(2,8)}`
    })
  }

  // --- NEW: compute per-lesson maximum concurrency across its covered slots ---
  for (const L of placed) {
    const start = L.startIndex
    const end = L.startIndex + L.span // exclusive
    const maxConcurrent = Math.max(...slotConcurrency.slice(start, end))
    L.rowConcurrentMax = maxConcurrent // e.g. 1, 2, 3...
  }

  // columns should reflect the maximum concurrency seen (defensive)
  const maxConcurrencyOverall = Math.max(...slotConcurrency, 0)
  const columns = Math.max(1, columnsEnd.length, maxConcurrencyOverall)

  return {
    slots,
    columns,
    lessons: placed
  }
}

/* ---------- computed mapping for all days ---------- */
const rosterPerDayGrid = computed(() =>
  props.orderedScheduleData.map((day) => buildRosterGridForDay(day))
)

/* ---------- CSS variables that control sizing (tweak as needed) ---------- */
// these are available in JS/TS if you want to compute styles dynamically.
// By default we rely on CSS variables set in the style section below.
</script>

<style>
:root {
  /* slot height matches your h-28 (7rem) */
  --slot-height: 7rem;
  /* column sizing: min / max width for a lesson column */
  --col-min: dvw;
  --col-max: 14rem;
  --col-width: var(--col-min);
}

/* hide scrollbar for horizontal scroller (your class already does that) */
.remove-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.remove-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>