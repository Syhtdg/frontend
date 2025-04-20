<template>
  <v-container class="pa-6">
    <h2>AI 에러 로그 이력</h2>
    <v-data-table
      :headers="headers"
      :items="logs"
      class="elevation-1"
    >
      <template #item.timestamp="{ item }">
        {{ new Date(item.timestamp).toLocaleString() }}
      </template>
    </v-data-table>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/plugins/axios'

const logs = ref([])

const headers = [
  { title: '에러 종류', value: 'errorType' },
  { title: '에러 메시지', value: 'message' },
  { title: '센서 위치', value: 'location' },
  { title: '기록 시각', value: 'timestamp' }
]

const fetchLogs = async () => {
  const res = await axios.get('/ai/error/all')
  logs.value = res.data
}

onMounted(() => {
  fetchLogs()
})
</script>
