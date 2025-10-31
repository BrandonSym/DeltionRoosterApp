<template>
  <div v-if="loading" class="min-h-screen bg-background p-6 flex items-center justify-center">
    <div class="text-lg text-muted-foreground">Rooster Laden...</div>
  </div>

  <div v-else class="bg-grayscale-50 min-h-screen p-1 xl:p-6 ">
        <!-- Week Navigation -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <button @click="prevWeek"
          class="px-3 py-2 bg-deltionBlue-100 text-deltionBlue-700 rounded-lg hover:bg-deltionBlue-200 transition">
          ← Vorige week
        </button>
                <button @click="resetWeek"
          class="px-3 py-2 bg-deltionBlue-100 text-deltionBlue-700 rounded-lg hover:bg-deltionBlue-200 transition">
          Huidige week
        </button>
        <button @click="nextWeek"
          class="px-3 py-2 bg-deltionBlue-100 text-deltionBlue-700 rounded-lg hover:bg-deltionBlue-200 transition">
          Volgende week →
        </button>

      </div>
    </div>
    <div class="block xl:hidden">
      <MobileRoster 
        :timeSlots="timeSlots" 
        :orderedScheduleData="orderedScheduleData"
        :getLessonsStartingInTimeSlot="getLessonsStartingInTimeSlot" />
    </div>



    <div class="bg-white rounded-lg hidden xl:block border border-grayscale-200 shadow-sm overflow-hidden">
      <!-- Header row -->
      <div class="grid border-b border-grayscale-200" :style="{ gridTemplateColumns: gridTemplateColumns }">
        <div
          class="p-4 bg-deltionBlue-100 font-medium text-deltionBlue-700 sticky left-0 z-10 flex flex-col justify-center items-start space-y-1">
          <span class="text-base font-bold leading-tight">Week {{ currentWeek }}</span>
          <span class="text-base text-deltionBlue-600 font-semibold">{{ currentGroup }}</span>
        </div>
        <div v-for="timeSlot in timeSlots" :key="`header-${timeSlot.nr}`"
          class="p-3 text-sm text-center bg-deltionBlue-100 text-grayscale-600 border-l border-grayscale-200 font-medium">
          <div class="font-bold text-deltionBlue-700">{{ timeSlot.nr }}</div>
          <div class="text-xs">{{ formatTime(timeSlot.st) }} - {{ formatTime(timeSlot.et) }}</div>
        </div>
      </div>

      <!-- Day rows -->
      <div v-for="day in orderedScheduleData" :key="day.date" class="grid border-b border-grayscale-200 last:border-b-0"
        :style="{ gridTemplateColumns: gridTemplateColumns, minHeight: getDayRowHeight(day) }">
        <!-- Day label -->
        <div
          class="p-4 bg-deltionBlue-100 font-medium text-deltionBlue-700 border-r border-grayscale-200 flex flex-col justify-center sticky left-0 z-10">
          <div class="text-sm font-bold" :id="`${getDayName(day.date_f)}`">{{ getDayName(day.date_f) }}</div>
          <div class="text-xs text-grayscale-500">{{ getDateOnly(day.date_f) }}</div>
        </div>

        <!-- Time slots -->
        <div v-for="timeSlot in timeSlots" :key="`${day.date}-${timeSlot.nr}`"
          class="relative border-l border-deltionBlue-200 bg-deltionBlue-50/40 transition-colors"
          style="min-height: 60px">
          <div v-for="(lesson, index) in getLessonsStartingInTimeSlot(day, timeSlot)"
            :key="`${day.date}-${timeSlot.nr}-${index}`"
            class="absolute bg-deltionOrange-100 border border-deltionOrange-400 rounded-md p-2 cursor-pointer hover:bg-deltionOrange-200 transition-colors"
            :style="getLessonStyle(lesson, timeSlot, day)" @click="selectClass(lesson)">
            <div class="text-xs font-medium text-deltionBlue-700 truncate">{{ lesson.v }}</div>
            <div class="text-xs text-grayscale-600 truncate">{{ lesson.r }}</div>
            <div class="text-xs text-grayscale-500 truncate">{{ lesson.t }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal -->
  <div v-if="selectedClass" class="fixed inset-0 z-50 flex items-center justify-center">

    <!-- Overlay (blurred background) -->
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click.self="selectedClass = null"></div>

    <!-- Modal content -->
    <div class="relative bg-white/90 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
      <!-- Header -->
      <div class="bg-deltionBlue-600 text-white px-6 py-3 flex items-center justify-between">
        <h2 class="text-lg font-semibold flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-deltionOrange-200" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M12 6v6l3 3m6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Lesinformatie
        </h2>
        <button class="text-white/80 hover:text-white transition-colors" @click="selectedClass = null">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-4 text-sm text-grayscale-700">
        <div class="grid grid-cols-2 gap-3">
          <div class="font-medium text-grayscale-500">Vak</div>
          <div class="font-semibold text-deltionBlue-700">{{ selectedClass.v }}</div>

          <div class="font-medium text-grayscale-500">Tijd</div>
          <div>{{ selectedClass.t }}</div>

          <div v-if="selectedClass.r" class="font-medium text-grayscale-500">Lokaal</div>
          <div v-if="selectedClass.r" class="font-semibold">{{ selectedClass.r }}</div>

          <div v-if="selectedClass.g" class="font-medium text-grayscale-500">Groep</div>
          <div v-if="selectedClass.g" class="font-semibold">{{ selectedClass.g }}</div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 bg-grayscale-50 flex justify-end">
        <button @click="selectedClass = null"
          class="bg-deltionBlue-600 hover:bg-deltionBlue-700 text-white font-medium px-4 py-2 rounded-lg transition">
          Sluiten
        </button>
      </div>
    </div>
  </div>

</template>

<script setup>
import { ref, computed, onMounted, inject, watch } from 'vue'
import MobileRoster from './MobileRoster.vue'

const parseTime = (s) => {
  if (s == null) return 0
  if (typeof s === 'number') return s
  if (typeof s !== 'string') return 0
  const parts = s.split(':')
  if (parts.length < 2) return 0
  const hh = Number(parts[0])
  const mm = Number(parts[1])
  if (Number.isNaN(hh) || Number.isNaN(mm)) return 0
  return hh * 60 + mm
}

const minutesToTime = (m) => {
  const hh = Math.floor(m / 60)
  const mm = m % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

const uniqueConcat = (a = [], b = []) => Array.from(new Set([...(a || []), ...(b || [])])).filter(Boolean)

const query = inject('query', 'type')

const {
  json,
  loading,
  orderedScheduleData,
  timeSlots,
  gridTemplateColumns,
  currentWeek,
  currentGroup,
  formatTime,
  getDayName,
  getDateOnly,
  getLessonsStartingInTimeSlot,
  getLessonStyle,
  getDayRowHeight,
  selectedClass,
  selectClass,
  nextWeek,
  prevWeek,
  resetWeek,
} = useRoster(query)

function useRoster(query) {
  const json = ref(null)
  const processed = ref([])
  const loading = ref(true)
  const selectedClass = ref(null)

  const currentWeek = ref('')
  const currentGroup = ref('')
  const weekOffset = ref(0)
  const selectedDate = inject('selectedDate')

watch(selectedDate, (newDate) => {
  if (newDate) {
    const date = new Date(newDate);

    const getMonday = (d) => {
      const day = d.getDay();
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((day + 6) % 7));
      monday.setHours(0, 0, 0, 0);
      return monday;
    };

    const mondayToday = getMonday(new Date());
    const mondaySelected = getMonday(date);

    const diffInWeeks = Math.round(
      (mondaySelected - mondayToday) / (7 * 24 * 60 * 60 * 1000)
    );

    weekOffset.value = diffInWeeks;
    if (query.value) getRoster(query.value);
  }
});
  
  async function getRoster(headerData) {
    loading.value = true
    try {
      const today = new Date()
      const day = today.getDay()

      const monday = new Date(today)
      monday.setDate(today.getDate() - ((day + 6) % 7) + weekOffset.value * 7)
      const friday = new Date(monday)
      friday.setDate(monday.getDate() + 5)

      const formatDate = (d) =>
        d.getFullYear().toString() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0')
      const start = formatDate(monday)
      const end = formatDate(friday)
      
      const res = await fetch(`https://canal-standard-exam-influenced.trycloudflare.com/roster?group=${encodeURIComponent(headerData)}&start=${start}&end=${end}`)
      const data = await res.json()
      json.value = data
      processed.value = processRawToMergedDays(data)
      const localWeekNum = getISOWeekNumber(monday)
      currentWeek.value = (data?.data?.[0]?.weeknum ?? localWeekNum) || ''
      currentGroup.value = data?.data?.[0]?.group || ''
    } catch (err) {
      console.error(err)
      processed.value = []
    } finally {
      loading.value = false
    }
  }

  function nextWeek() {
    weekOffset.value++
    if (query.value) getRoster(query.value)
  }

  function prevWeek() {
    weekOffset.value--
    if (query.value) getRoster(query.value)
  }

  function resetWeek() {
    weekOffset.value = 0
    if (query.value) getRoster(query.value)
  }

  function processRawToMergedDays(raw) {
    if (!raw?.data?.[0]?.data) return []
    const rawDays = raw.data[0].data

    return rawDays.map((day) => {
      const rawItems = (day.items || [])
        .map((l) => {
          const m = (l.t || '').match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/)
          if (!m) return null
          const start = m[1], end = m[2]
          const startMin = parseTime(start)
          const endMin = parseTime(end)
          return {
            v: (l.v || '').trim(),
            start,
            end,
            startMin,
            endMin,
            r: l.r ? [l.r] : [],
            g: l.g ? [l.g] : [],
            t: `${start} - ${end}`,
            raw: l
          }
        })
        .filter(Boolean)

      rawItems.sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin || a.v.localeCompare(b.v))

      const mergedLessons = []

      for (const item of rawItems) {
        let mergedIntoExisting = false

        for (const existing of mergedLessons) {
          const sameSubject = existing.v.toLowerCase() === item.v.toLowerCase()
          const overlapOrTouch = item.startMin <= existing.endMin && item.endMin >= existing.startMin

          if (sameSubject && overlapOrTouch) {
            existing.startMin = Math.min(existing.startMin, item.startMin)
            existing.endMin = Math.max(existing.endMin, item.endMin)
            existing.start = minutesToTime(existing.startMin)
            existing.end = minutesToTime(existing.endMin)
            existing.t = `${existing.start} - ${existing.end}`
            existing.r = uniqueConcat(existing.r, item.r)
            existing.g = uniqueConcat(existing.g, item.g)
            mergedIntoExisting = true
            break
          }
        }

        if (!mergedIntoExisting) {
          mergedLessons.push({ ...item })
        }
      }

      const stacks = []
      for (const m of mergedLessons) {
        let placed = false
        for (let i = 0; i < stacks.length; i++) {
          if (stacks[i] <= m.startMin) {
            m.stack = i
            stacks[i] = m.endMin
            placed = true
            break
          }
        }
        if (!placed) {
          m.stack = stacks.length
          stacks.push(m.endMin)
        }
      }

      const finalItems = mergedLessons.map((m) => ({
        v: m.v,
        start: m.start,
        end: m.end,
        startMin: m.startMin,
        endMin: m.endMin,
        t: `${m.start} - ${m.end}`,
        r: (m.r || []).join(', '),
        g: (m.g || []).join(', '),
        duration: m.endMin - m.startMin,
        stack: m.stack ?? 0,
      }))

      return {
        ...day,
        items: finalItems,
      }
    })
  }

  const formatTime = (t) => {
    if (!t) return ''
    if (String(t).includes(':') && !String(t).includes('T')) {
      const [h, m] = String(t).split(':')
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }
    const dt = new Date(t)
    if (isNaN(dt.getTime())) return String(t)
    return `${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}`
  }

  const getISOWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
  return weekNo
}

  const getDayName = (dateStr) => (dateStr ? dateStr.split(' ')[0] : '')
  const getDateOnly = (dateStr) => (dateStr ? dateStr.split(' ').slice(1).join(' ') : '')

  const orderedScheduleData = computed(() => {
    if (!processed.value?.length) return []
    return processed.value.sort((a, b) => new Date(a.date) - new Date(b.date))
  })

  const timeSlots = computed(() => {
    if (!orderedScheduleData.value.length) return []

    const allHours = orderedScheduleData.value.flatMap((day) => day.hours || [])
    const uniqueHours = Object.values(allHours.reduce((acc, h) => ((acc[h.nr] = h), acc), {})).sort((a, b) => a.nr - b.nr)

    const hasLessonInSlotAcrossDays = (slot) => {
      if (!slot) return false
      const slotStart = parseTime(slot.st)
      const slotEnd = parseTime(slot.et)
      if (slotStart === 0 && slotEnd === 0) return false
      for (const day of orderedScheduleData.value) {
        if (!day?.items?.length) continue
        for (const lesson of day.items) {
          if (lesson.endMin > slotStart && lesson.startMin < slotEnd) return true
        }
      }
      return false
    }

    const slot0 = uniqueHours.find(h => Number(h.nr) === 0)
    const removeHour0 = !!slot0 && !hasLessonInSlotAcrossDays(slot0)

    const lateRange = uniqueHours.filter(h => {
      const n = Number(h.nr)
      return n >= 12 && n <= 17
    })
    const removeLateRange = lateRange.length > 0 && lateRange.every(h => !hasLessonInSlotAcrossDays(h))

    return uniqueHours.filter(h => {
      const n = Number(h.nr)
      if (removeHour0 && n === 0) return false
      if (removeLateRange && n >= 12 && n <= 17) return false
      return true
    })
  })

  const gridTemplateColumns = computed(() => `100px repeat(${timeSlots.value.length}, minmax(120px, 1fr))`)

  const parseSlotTime = (slotTime) => {
    if (typeof slotTime === 'string' && slotTime.includes(':')) return parseTime(slotTime)
    const dt = new Date(slotTime)
    if (!isNaN(dt.getTime())) return dt.getHours() * 60 + dt.getMinutes()
    return 0
  }

  function getLessonsStartingInTimeSlot(day, slot) {
    if (!day?.items?.length) return []
    const slotStart = formatTime(slot.st)
    return (day.items || []).filter((lesson) => lesson.start === slotStart)
  }

  function getLessonStyle(lesson) {
    const startSlotIndex = timeSlots.value.findIndex((slot) => formatTime(slot.st) === lesson.start)
    let spanCount = 1

    if (startSlotIndex !== -1) {
      for (let i = startSlotIndex; i < timeSlots.value.length; i++) {
        const slotStart = parseSlotTime(timeSlots.value[i].st)
        const slotEnd = parseSlotTime(timeSlots.value[i].et)

        if (lesson.endMin > slotStart) {
          spanCount = i - startSlotIndex + 1
          if (lesson.endMin <= slotEnd) break
        } else {
          break
        }
      }
    }

    const width = `calc(${spanCount * 100}% + ${(spanCount - 1)}px - 8px)`
    const topOffset = (lesson.stack || 0) * 94 + 4

    return {
      top: `${topOffset}px`,
      left: '4px',
      width: width,
      height: '86px',
      zIndex: 10 + (lesson.stack || 0),
    }
  }

  function getDayRowHeight(day) {
    if (!day?.items?.length) return '120px'
    const maxStack = Math.max(...(day.items.map(i => (i.stack ?? 0)))) + 1
    return `${maxStack * 94}px`
  }

  function selectClass(lesson) {
    selectedClass.value = lesson
  }

  onMounted(() => {
    if (query?.value) getRoster(query.value)
  })
  watch(query, (newRoom) => {
    if (newRoom) getRoster(newRoom)
  })

  return {
    json,
    loading,
    orderedScheduleData,
    timeSlots,
    gridTemplateColumns,
    currentWeek,
    currentGroup,
    formatTime,
    getDayName,
    getDateOnly,
    getLessonsStartingInTimeSlot,
    getLessonStyle,
    getDayRowHeight,
    selectedClass,
    selectClass,
    nextWeek,
    prevWeek,
    resetWeek,
  }
}
</script>

<style scoped>
.bg-background {
  background-color: #ffffff;
}

.text-muted-foreground {
  color: #6b7280;
}

.border-border {
  border-color: #e5e7eb;
}
</style>