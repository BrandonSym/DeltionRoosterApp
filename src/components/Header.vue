<template>
  <div class="flex flex-col bg-gray-100">
    <header class="flex items-center justify-between bg-deltionBlue-500 border-b px-6 py-3">
      <!-- Logo -->
      <div class="flex items-center gap-2">
        <img src="../assets/deltionnew.png" alt="Deltion Logo" class="h-13 w-auto" @click="goHome" />
      </div>



      <!-- zoekveld + calendar -->
      <div class="flex items-center gap-3 relative" id="calendar">
        <button @click.stop="toggleCalendar" class="text-white hover:text-deltionBlue-200 transition">
          📅
        </button>

        <!-- Calendar dropdown -->
        <div v-if="calendarOpen"
          class="absolute left-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50">
          <VueDatePicker v-model="tempDate" :enable-time-picker="false" auto-apply :format="formatDate" inline
            @update:model-value="applyDate" />
        </div>
      <!-- Zoek dropdown met input in dropdown -->
      <div class="flex items-center gap-2 relative w-48 search-dropdown">
        <input v-model="searchText" @focus="openDropdown" @click="onInput" @keydown.enter="onEnter" type="text"
          placeholder="Zoek groep of kamer..." class="px-3 py-1 border rounded bg-white w-full focus:outline-none" />
        <ul v-if="showDropdown && filteredOptions.length"
          class="absolute top-full left-0 w-full bg-white border rounded shadow z-10 max-h-64 overflow-auto">
          <li v-for="option in filteredOptions" :key="option.type + '-' + option.name" @mousedown="selectOption(option)"
            class="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between">
            <span>{{ option.name }}</span>
            <span class="text-xs text-gray-400">{{ option.type }}</span>
          </li>
        </ul>
        <div v-if="showDropdown && searchText.length < 2"
          class="absolute top-full left-0 w-full bg-white border rounded shadow z-10 px-4 py-2 text-gray-400">
          Typ minimaal 2 tekens...
        </div>
        <div v-if="showDropdown && searchText.length >= 2 && filteredOptions.length === 0"
          class="absolute top-full left-0 w-full bg-white border rounded shadow z-10 px-4 py-2 text-gray-400">
          Geen resultaten
          <img src="../assets/deltionnew.png" alt="Deltion Logo" class="h-13 w-auto" />
        </div>
      </div>

      </div>

      <!-- Settings knop + menu -->
      <div id="settings-menu" class="relative">
          <button @click.stop="toggleMenu" class="px-3 py-1 border text-white rounded hover:bg-gray-300">
            ⚙️
          </button>

          <!-- Dropdown menu -->
          <div v-if="menuOpen" class="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg">
            <ul class="py-1">
              <li><router-link to="/" class="block px-4 py-2 hover:bg-gray-100">Home</router-link></li>
              <li><router-link to="/profiel" class="block px-4 py-2 hover:bg-gray-100">Profiel</router-link></li>
              <li><router-link to="/instellingen" class="block px-4 py-2 hover:bg-gray-100">Instellingen</router-link></li>
              <li><router-link to="/login" class="block px-4 py-2 hover:bg-gray-100 text-red-500">Login</router-link></li>
              <li><router-link to="/mapmaker" class="block px-4 py-2 hover:bg-gray-100">MapMaker</router-link></li>
            </ul>
          </div>
      </div>
    </header>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, inject } from "vue"
import { useRouter } from "vue-router";
import VueDatePicker from "@vuepic/vue-datepicker"
import "@vuepic/vue-datepicker/dist/main.css"

const menuOpen = ref(false)
const router = useRouter();
const searchText = ref("");
const showDropdown = ref(false);
const options = ref([]);
const selectedType = ref("group");
const query = inject('query');
const type = inject('type');
const calendarOpen = ref(false)
const selectedDate = inject('selectedDate')
const tempDate = ref(selectedDate.value)

// API data ophalen
async function fetchOptions() {
  try {
    const [groupsRes, roomsRes] = await Promise.all([
      fetch("https://tradition-vault-save-transparent.trycloudflare.com/groups").then(r => r.json()), // this url will always change when a new cloudflare tunnel is made
      fetch("https://tradition-vault-save-transparent.trycloudflare.com/rooms").then(r => r.json()),
    ]);
    let groupsArr = Array.isArray(groupsRes.data) ? groupsRes.data : [];
    let roomsArr = Array.isArray(roomsRes.data) ? roomsRes.data : [];

    groupsArr = groupsArr[0];
    roomsArr = roomsArr[0];

    console.log("Opgehaalde groepen:", groupsArr);
    console.log("Opgehaalde kamers:", roomsArr);
    options.value = [
      ...groupsArr.data
        .filter(g => typeof g === "string")
        .map(g => ({ type: "group", name: g })),
      ...roomsArr.data
        .filter(r => typeof r === "string")
        .map(r => ({ type: "room", name: r })),
    ];
  } catch (err) {
    console.error("API ophalen mislukt:", err);
    options.value = [];
  }
}
onMounted(fetchOptions);

const filteredOptions = computed(() =>
  searchText.value.length >= 2
    ? options.value.filter(opt =>
      opt.name.toLowerCase().includes(searchText.value.toLowerCase())
    )
    : []
);

function onInput() {
  showDropdown.value = true;
}

function selectOption(option) {
  searchText.value = option.name;
  showDropdown.value = false;
  query.value = option.name;
  type.value = option.type;
  router.push("/rooster");
}

function openDropdown() {
  showDropdown.value = true;
}

function goHome() {
  router.push("/");
}

function onEnter(option) {
  if (filteredOptions.value.length > 0) {
    selectOption(filteredOptions.value[0]);
  }
}

function closeDropdown(e) {
  if (!e.target.closest(".search-dropdown")) {
    showDropdown.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", closeDropdown);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", closeDropdown);
});




function toggleMenu() {
  menuOpen.value = !menuOpen.value
}
function closeMenu(e) {
  if (!e.target.closest("#settings-menu")) menuOpen.value = false
}
document.addEventListener("click", closeMenu)

function toggleCalendar() {
  tempDate.value = selectedDate.value
  calendarOpen.value = !calendarOpen.value
}
function closeCalendar(e) {
  if (!e.target.closest("#calendar")) calendarOpen.value = false
}
document.addEventListener("click", closeCalendar)

// Commit selected date only after user picks one
function applyDate(date) {
  selectedDate.value = date
  calendarOpen.value = false
}

function formatDate(date) {
  return date?.toLocaleDateString("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  })
}
</script>
