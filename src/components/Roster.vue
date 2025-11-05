<template>
  <div v-if="loading" class="min-h-screen bg-background p-6 flex items-center justify-center">
    <div class="text-lg text-muted-foreground">Rooster Laden...</div>
  </div>

  <div v-else class="bg-grayscale-50 p-1 xl:p-6 min-h-screen">
    <!-- Week Navigation -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <button @click="prevWeek"
          class="px-3 py-2 flex flex-row justify-between gap-2 bg-deltionBlue-500 text-white rounded-lg hover:bg-deltionBlue-600 transition">
          <div class="flex flex-col justify-center">←</div>
          <div>
            Vorige week
              </div>
        </button>
        <button @click="resetWeek"
          class="px-3 py-2 bg-deltionBlue-500 text-white rounded-lg hover:bg-deltionBlue-600 transition">
          Huidige week
        </button>
        <button @click="nextWeek"
          class="px-3 py-2 flex flex-row gap-2 justify-between bg-deltionBlue-500 text-white rounded-lg hover:bg-deltionBlue-600 transition">
          <div>
            Volgende week
          </div>
          <div class="flex flex-col justify-center">→</div>
        </button>

      </div>
    </div>
    <div class="block xl:hidden">
      <MobileRoster :timeSlots="timeSlots" :orderedScheduleData="orderedScheduleData"
        :getLessonsStartingInTimeSlot="getLessonsStartingInTimeSlot" />
    </div>

    <div class="bg-white rounded-lg hidden xl:block border border-b-0 border-grayscale-200 shadow-sm overflow-x-auto">
      <!-- Header row -->
      <div class="grid border-grayscale-200" :style="{ gridTemplateColumns: gridTemplateColumns }">
        <div
          class="p-4 bg-deltionBlue-500 font-medium text-white sticky left-0 z-10 flex flex-col justify-center items-start space-y-1">
          <span class="text-base font-bold leading-tight">Week {{ currentWeek }}</span>
          <span class="text-base text-white font-semibold">{{ currentGroup }}</span>
        </div>
        <div v-for="timeSlot in timeSlots" :key="`header-${timeSlot.nr}`"
          class="p-3 text-sm text-center bg-deltionBlue-500 text-white border-l border-deltionBlue-400 font-medium">
          <div class="font-bold text-grayscale-50">{{ timeSlot.nr }}</div>
          <div class="text-xs text-grayscale-200">{{ formatTime(timeSlot.st) }} - {{ formatTime(timeSlot.et) }}</div>
        </div>
      </div>

      <!-- Day rows -->
      <div v-for="day in orderedScheduleData" :key="day.date" class="grid border-grayscale-200"
        :style="{ gridTemplateColumns: gridTemplateColumns, minHeight: getDayRowHeight(day) }">
        <!-- Day label -->
        <div
          class="p-4 bg-deltionBlue-500 font-medium text-white border-r border-deltionBlue-400 flex flex-col justify-center sticky left-0 z-10">
          <div class="text-sm font-bold" :id="`${getDayName(day.date_f)}`">{{ getDayName(day.date_f) }}</div>
          <div class="text-xs text-grayscale-200">{{ getDateOnly(day.date_f) }}</div>
        </div>

        <!-- Time slots -->
        <div v-for="timeSlot in timeSlots" :key="`${day.date}-${timeSlot.nr}`"
          class="relative border-l border-b border-b-deltionBlue-200 border-l-deltionBlue-200/30 bg-deltionBlue-50/40 transition-colors"
          style="min-height: 60px">
          <div v-for="(lesson, index) in getLessonsStartingInTimeSlot(day, timeSlot)"
            :key="`${day.date}-${timeSlot.nr}-${index}`"
            class="absolute lessen-card bg-deltionOrange-400 border-2 border-deltionOrange-500 rounded-md p-2 cursor-pointer hover:bg-deltionOrange-300 transition-colors text-white"
            :style="getLessonStyle(lesson, timeSlot, day)" @click="selectClass(lesson)">
            <div class="text-xs font-medium text-white truncate">{{ lesson.v }}</div>
            <div class="text-xs text-white/90 truncate">{{ lesson.r }}</div>
            <div class="text-xs text-white/80 truncate">{{ lesson.t }}</div>
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
          <div class="font-semibold text-grayscale-500">{{ selectedClass.v }}</div>

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
import { useRoute } from 'vue-router';
import MobileRoster from './MobileRoster.vue'
import { useRouter } from "vue-router";

const router = useRouter();
const route = useRoute();

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

const query = inject('query')

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


  watch(
    () => ({ ...route.query }),
    (newQuery, oldQuery) => {
      if (
        newQuery.type !== oldQuery?.type ||
        newQuery.value !== oldQuery?.value ||
        newQuery.start !== oldQuery?.start ||
        newQuery.end !== oldQuery?.end
      ) {
        getRoster();
      }
    }
  );

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

      const diffInWeeks = Math.floor(
        (mondaySelected - mondayToday) / (7 * 24 * 60 * 60 * 1000)
      );

      weekOffset.value = diffInWeeks;
      if (routequery.value) getRoster();
    }
  });

  async function getRoster() {
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

      const res = await fetch(`${import.meta.env.VITE_FETCH_URL}/roster?${route.query.type}=${route.query.value}&start=${route.query.start || start}&end=${route.query.end || end}`)
      //console.log(`${env.fetch_url}/roster?${route.query.type}=${route.query.value}&start=${route.query.start}&end=${route.query.end}`);
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

  function updateWeekInQuery(offsetChange = 0) {
    weekOffset.value += offsetChange;

    const today = new Date();
    const day = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((day + 6) % 7) + weekOffset.value * 7);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 5);

    const formatDate = (d) =>
      d.getFullYear().toString() +
      String(d.getMonth() + 1).padStart(2, "0") +
      String(d.getDate()).padStart(2, "0");

    const start = formatDate(monday);
    const end = formatDate(friday);

    router.replace({
      query: {
        ...route.query,
        start,
        end,
      },
    });
  }

  function nextWeek() {
    updateWeekInQuery(1);
  }

  function prevWeek() {
    updateWeekInQuery(-1);
  }

  function resetWeek() {
    weekOffset.value = 0;
    updateWeekInQuery(0);
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

    const allHours = orderedScheduleData.value.flatMap(day => day.hours || [])
    const hoursMap = allHours.reduce((acc, h) => {
      const nr = Number(h.nr)
      acc[nr] = { ...h, nr }
      return acc
    }, {})

    for (let i = 1; i <= 11; i++) {
      if (!Object.prototype.hasOwnProperty.call(hoursMap, i)) {
        hoursMap[i] = { nr: i, st: null, et: null }
      }
    }

    const uniqueHours = Object.values(hoursMap).sort((a, b) => a.nr - b.nr)

    const slotToMinutes = (val) => {
      if (val == null) return null
      // already a number (ms)
      const ms = typeof val === 'number' ? val : (new Date(val)).getTime()
      if (isNaN(ms)) return null
      const d = new Date(ms)
      return d.getHours() * 60 + d.getMinutes()
    }

    const usedHourSet = new Set()
    for (const slot of uniqueHours) {
      const slotStartMin = slotToMinutes(slot.st)
      const slotEndMin = slotToMinutes(slot.et)
      if (slotStartMin == null || slotEndMin == null) continue

      for (const day of orderedScheduleData.value) {
        for (const lesson of day.items || []) {
          const lessonStartMin = typeof lesson.startMin === 'number' ? lesson.startMin : null
          const lessonEndMin = typeof lesson.endMin === 'number' ? lesson.endMin : null
          if (lessonStartMin == null || lessonEndMin == null) continue

          if (lessonEndMin > slotStartMin && lessonStartMin < slotEndMin) {
            usedHourSet.add(slot.nr)
            break
          }
        }
        if (usedHourSet.has(slot.nr)) break
      }
    }

    const usedHours = Array.from(usedHourSet)
    const hasAnyUsed = usedHours.length > 0
    const minUsed = hasAnyUsed ? Math.min(...usedHours) : null
    const maxUsed = hasAnyUsed ? Math.max(...usedHours) : null
    const hasAfternoonUsed = hasAnyUsed && usedHours.some(n => n >= 12)
    const visible = uniqueHours.filter(h => {
      const n = Number(h.nr)
      if (n >= 1 && n <= 11) return true
      if (n === 0) return usedHourSet.has(0)
      if (n >= 12 && n <= 17) {
        if (!hasAfternoonUsed) return false
        return n <= maxUsed
      }
      return false
    })


    return visible
  })



  const gridTemplateColumns = computed(() => `110px repeat(${timeSlots.value.length}, minmax(120px, 1fr))`)

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
      zIndex: 5 + (lesson.stack || 0),
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
    if ((route.query.value && route.query.type) || (route.query.start && route.query.end)) getRoster();
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
