
<template>
  <div class="min-h-screen flex flex-col bg-gray-100">
      <main class="flex-1 p-8">
        <!-- Hero -->
        <section class="text-center mb-10">
          <h1 class="text-3xl font-bold mb-2">Welkom bij Deltion Rooster</h1>
          <p class="text-gray-600">Bekijk en beheer eenvoudig jouw rooster, lessen en meer.</p>
        </section>

        <!-- Content grid -->
        <section class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Groot blok -->
          <div class="bg-gray-300 rounded h-64 md:col-span-2 overflow-hidden flex items-center justify-center">
            <img :src="campusImg" alt="Deltion Campus" class="object-cover w-full h-full" />
          </div>

          <!-- Sidebar blokken -->
          <div class="flex flex-col gap-4">
            <div class="bg-gray-300 rounded h-32 overflow-hidden flex items-center justify-center">
              <img :src="jetImg" alt="Deltion Jet" class="object-cover w-full h-full" />
            </div>
            <div class="bg-gray-300 rounded h-24 overflow-hidden flex items-center justify-center">
              <img :src="helmetImg" alt="Deltion Helmet" class="object-cover w-full h-full" />
            </div>
            <div class="bg-gray-300 rounded h-32 overflow-hidden flex items-center justify-center">
              <img :src="kantineImg" alt="Deltion Kantine" class="object-cover w-full h-full" />
            </div>
          </div>
        </section>
      </main>
  </div>
</template>

<script setup>
import campusImg from '../assets/deltion-campus.jpg'
import jetImg from '../assets/deltion-jet.jpg'
import helmetImg from '../assets/deltion-helmet.jpg'
import kantineImg from '../assets/deltion-kantine.jpg'
// Je kunt later zoekfunctionaliteit en week-switching toevoegen
</script>
