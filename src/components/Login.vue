<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div
      class="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 space-y-6 border border-gray-200"
    >
      <!-- Header Logo -->
      <div class="text-left">
        <img
          :src="deltionLogo"
          alt="Deltion Logo"
          class="w-36 mb-2"
        />
        <p class="text-sm text-gray-500">
          Gebruik je schoolaccount om in te loggen
        </p>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            E-mailadres
          </label>
          <input
            v-model="email"
            type="email"
            placeholder="studentnummer@st.deltion.nl"
            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Wachtwoord
          </label>
          <input
            v-model="password"
            type="password"
            placeholder="Voer je wachtwoord in"
            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            required
          />
          <div class="text-right mt-1">
            <a href="#" class="text-sm text-blue-700 hover:underline">
              Wachtwoord vergeten?
            </a>
          </div>
        </div>

        <button
          type="submit"
          class="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg py-2 transition duration-200"
        >
          Sign in
        </button>

        <!-- Error message -->
        <p v-if="errorMessage" class="text-red-600 text-sm text-center mt-2">
          {{ errorMessage }}
        </p>
      </form>

      <!-- Help section -->
      <div class="pt-4 border-t border-gray-200 text-sm text-gray-600">
        <p class="mb-1">Need help?</p>
        <p>
          Neem contact op met de
          <span class="font-semibold">Servicedesk</span>:<br />
          <span class="block text-blue-700">+31 38 850 3333</span>
          <span class="block text-blue-700">asp@deltion.nl</span>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import deltionLogo from '../assets/deltionnew.png'

const router = useRouter()

// State
const email = ref('')
const password = ref('')
const errorMessage = ref('')

// Helper: validate Deltion email
function isValidDeltionEmail(value) {
  // must be only digits before @, then exactly @st.deltion.nl
  const pattern = /^[0-9]+@st\.deltion\.nl$/i
  return pattern.test(value)
}

// Login handler
async function handleLogin() {
  errorMessage.value = ''

  if (!email.value || !password.value) {
    errorMessage.value = 'Vul je e-mailadres en wachtwoord in.'
    return
  }

  if (!isValidDeltionEmail(email.value)) {
    errorMessage.value = 'Alleen Deltion e-mails zijn toegestaan (bijv. 97105257@st.deltion.nl).'
    return
  }

  // Simulate login
  console.log('Inloggen met:', email.value)
  await new Promise(resolve => setTimeout(resolve, 500))

  // Redirect to roster page
  router.push({ name: 'Rooster' })
}
</script>

<style scoped>
input::placeholder {
  color: #9ca3af;
  font-size: 0.95rem;
}
</style>
