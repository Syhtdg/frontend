<template>
  <v-container class="pa-6">
    <h2>로그 통합 관리</h2>

    <v-tabs v-model="tab" class="mb-4" background-color="white">
      <v-tab>사용자 로그</v-tab>
      <v-tab>AI 감지 로그</v-tab>
      <v-tab>AI 에러 로그</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item :value="0">
        <UserLogTable />
      </v-window-item>
      <v-window-item :value="1">
        <AiResultTable />
      </v-window-item>
      <v-window-item :value="2">
        <AiErrorTable />
      </v-window-item>
    </v-window>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import UserLogTable from '@/components/UserLogTable.vue'
import AiResultTable from '@/components/AiResultTable.vue'
import AiErrorTable from '@/components/AiErrorTable.vue'

const tab = ref(0)
</script>
