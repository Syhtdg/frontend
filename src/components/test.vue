<template>
    <v-container fluid>
      <v-app-bar>
        <img src="@/assets/입체 로고.png" alt="Logo" class="logo" />
        <v-btn>계정 관리</v-btn>
        <v-btn @click="$router.push('/cctvManage')">CCTV 관리</v-btn>
        <v-btn @click="$router.push('/log')">로그 관리</v-btn>
      </v-app-bar>
  
      <div class="leftBoard" style="display: flex; flex-direction: column; gap: 24px;">
        <!-- 상단: 기상정보, 필터, 실시간 CCTV -->
        <div style="display: flex; flex-direction: row; gap: 24px;">
          <!-- 기상정보 -->
          <div>
            <h3>기상정보</h3>
            <div class="weather-info-card">
              <p class="letter">온도:<span class="wether-info">{{ temp }}°C</span></p>
              <p class="letter">습도:<span class="wether-info">{{ humidity }}%</span></p>
              <p class="letter">풍향:<span class="wether-info">{{ windDirection }}</span></p>
              <p class="letter">풍속:<span class="wether-info">{{ windSpeed }} m/s</span></p>
              <p class="letter">강수량:<span class="wether-info">{{ precipitation }} mm</span></p>
            </div>
          </div>
          <!-- 필터 -->
          <div>
            <h3>필터</h3>
            <div class="filter-section" style="background-color: white;">
              <v-select
                v-model="typeFilter"
                :items="['전체', '불', '연기']"
                label="종류 선택"
                dense
                outlined
                class="filter-item"
                color="gray"
              />
              <v-menu v-model="dateMenu" transition="scale-transition" offset-y min-width="auto">
                <template #activator="{ props }">
                  <v-text-field
                    v-model="formattedDate"
                    v-bind="props"
                    label="📅 날짜 선택"
                    dense
                    outlined
                    class="filter-item"
                    readonly
                    clearable
                    @click:clear="clearDate"
                  />
                </template>
                <v-date-picker v-model="selectedDate" @update:modelValue="onDateSelected" locale="ko" />
              </v-menu>
            </div>
          </div>
          <!-- 실시간 CCTV -->
      <div class="cctv-view">
        <h3>실시간 CCTV</h3>
        <div class="media-container">
          <span v-if="cctvLoading">로딩 중…</span>
          <span v-else-if="cctvError" class="error">{{ cctvError }}</span>
  
          <template v-else-if="cctv">
            <h4 style="color: black;">{{ cctv.cctvname }}</h4>
  
             <video
      v-if="cctv && cctv.cctvformat === 'HLS'"
      ref="videoRef"
      controls autoplay muted
      class="media"
    >
      <source
        :src="streamUrl"
        type="application/vnd.apple.mpegurl"
      />
      이 브라우저는 동영상을 지원하지 않습니다.
    </video>
  
    <video
      v-else-if="cctv && cctv.cctvformat !== 'HLS'"
      :src="streamUrl"
      controls autoplay muted
      class="media"
    >
      이 브라우저는 동영상을 지원하지 않습니다.
    </video>
          </template>
  
          <span v-else class="placeholder">위치를 선택해주세요.</span>
        </div>
      </div>
        </div>
  
        <!-- 하단: 로그 및 차트 -->
        <div style="display: flex; flex-direction: row; gap: 24px;">
          <div style="flex: 1;">
            <h3>화재 위험 지역 정보</h3>
            <div class="local-info-card-scroll">
              <v-card
                v-for="log in filteredLogs"
                :key="log._id"
                class="pa-4 mb-2"
                :class="log.type === '불' ? 'fire-card' : 'smoke-card'"
              >
                <strong>위치:</strong> {{ log.location }}<br />
                <strong>종류:</strong> {{ log.type }}<br />
                <strong>신뢰도:</strong> {{ log.confidence }}%<br />
                <small class="text-grey">{{ formatKoreanDate(log.timestamp) }}</small>
              </v-card>
            </div>
          </div>
          <div style="flex: 1;">
            <h3>화재 주요 원인</h3>
            <div class="cause-card">
              <img src="@/assets/Rectangle 12.png" alt="차트1" class="bar-img" />
              <img src="@/assets/Rectangle 14.png" alt="차트2" class="bar-img" />
              <img src="@/assets/Rectangle 15.png" alt="차트3" class="bar-img" />
            </div>
          </div>
        </div>
      </div>
  
      <!-- 지도 -->
      <keep-alive>
        <div>
          <h3>CCTV 지도</h3>
          <div id="map" class="map" style="width: 560px; height: 694px; border-radius: 13px;">
            <MapComponet @select-marker="onSelectMarker" />
          </div>
        </div>
      </keep-alive>
  
      <!-- 실시간 경고 다이얼로그 -->
      <v-dialog v-model="alertDialog" persistent max-width="500">
        <v-card class="alert-dialog-card pa-6 text-center">
          <v-card-title class="text-h5 font-weight-bold mb-2">{{ alertTitle }}</v-card-title>
          <v-card-text class="mt-3" style="white-space: pre-line; font-size: 18px; line-height: 1.6;">
            {{ alertMessage }}
          </v-card-text>
          <v-card-actions class="justify-center mt-6">
            <v-btn color="red" variant="flat" class="confirm-button" @click="closeAlert">확인</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, watch, nextTick } from 'vue'
  import axios from '@/plugins/axios'
  import io from 'socket.io-client'
  import { format } from 'date-fns'
  import { ko } from 'date-fns/locale'
  import { getWeather } from '@/services/weatherService'
  import MapComponet from './MapComponet.vue'
  import { fetchNearestCctv } from '@/services/cctv'
  import Hls from 'hls.js'
  
  // CCTV 상태
  const cctv = ref(null)
  const cctvLoading = ref(false)
  const cctvError = ref('')
  const videoRef = ref(null)
  const playerURL = (url) =>
    `/player.html?src=${encodeURIComponent(url)}`
  
  // 프록시를 타기 위한 “스트림 URL”
  const streamUrl = computed(() => {
    if (!cctv.value) return ''
    const u = new URL(cctv.value.cctvurl)
    // e.g. /cctv-stream + /2050.mp4?wsAuthSign=...
    return `/cctv-stream${u.pathname}${u.search}`
  })
  
  const isVideo = url => {
    if (!url) return false
    const lower = url.toLowerCase()
    return lower.includes('.m3u8') || lower.includes('.mp4')
  }
  
  // cctv 값이 바뀔 때마다 HLS 초기화
  watch(cctv, async newVal => {
    if (!newVal) return
    // HLS 스트림만 처리
    if (newVal.cctvformat === 'HLS') {
      await nextTick()
      const video = videoRef.value
      if (Hls.isSupported()) {
        const hls = new Hls()
        hls.loadSource(newVal.cctvurl)
        hls.attachMedia(video)
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}))
      } else {
        video.src = newVal.cctvurl
        video.play().catch(() => {})
      }
    }
  })
  
  // 필터 및 로그
  const logs = ref([])
  const typeFilter = ref('전체')
  const selectedDate = ref(null)
  const formattedDate = ref('')
  const dateMenu = ref(false)
  
  // 다이얼로그 상태
  const alertDialog = ref(false)
  const alertTitle = ref('')
  const alertMessage = ref('')
  const playingSounds = ref([])
  
  const temp = ref(null)
  const humidity = ref(null)
  const windSpeed = ref(null)
  const windDirection = ref(null)
  const precipitation = ref(null)
  
  const socket = io('http://localhost:10111')
  
  // 마커 클릭 시 호출
  async function onSelectMarker({ lat, lng }) {
    cctvLoading.value = true
    cctvError.value = ''
    cctv.value = null
    try {
      const result = await fetchNearestCctv(lat, lng)
      console.log('CCTV API 응답:', result)
      console.log('cctvurl:', result.cctvurl)
      cctv.value = result
    } catch (err) {
      console.error(err)
      cctvError.value = err.message || 'CCTV 호출 실패'
    } finally {
      cctvLoading.value = false
    }
  }
  
  // AJAX: AI 로그 가져오기
  async function fetchLogs() {
    try {
      const res = await axios.get('/ai/result/all')
      logs.value = res.data
    } catch (e) {
      console.error('AI 로그 불러오기 실패:', e)
    }
  }
  
  // 필터 이벤트
  function onDateSelected(date) {
    formattedDate.value = format(date, 'yyyy-MM-dd')
    dateMenu.value = false
  }
  function clearDate() {
    selectedDate.value = null
    formattedDate.value = ''
  }
  
  const filteredLogs = computed(() =>
    logs.value.filter(log => {
      const byType = typeFilter.value === '전체' || log.type === typeFilter.value
      const byDate = !selectedDate.value ||
        format(new Date(log.timestamp), 'yyyy-MM-dd') === format(selectedDate.value, 'yyyy-MM-dd')
      return byType && byDate
    })
  )
  
  function formatKoreanDate(date) {
    return format(new Date(date), 'yyyy년 M월 d일 (eee) HH:mm:ss', { locale: ko })
  }
  
  function closeAlert() {
    alertDialog.value = false
    playingSounds.value.forEach(sound => {
      sound.pause()
      sound.currentTime = 0
    })
    playingSounds.value = []
  }
  
  onMounted(async () => {
    fetchLogs()
    socket.on('aiResult', data => {
      logs.value.unshift(data)
      if (logs.value.length > 50) logs.value.pop()
      alertDialog.value = true
      const sound = new Audio(data.type === '불' ? '/sounds/fire.mp3' : '/sounds/smoke.mp3')
      alertTitle.value = data.type === '불' ? '🔥 화재 감지됨' : '💨 연기 감지됨'
      sound.volume = 1.0
      sound.play().catch(() => {})
      playingSounds.value.push(sound)
      alertMessage.value = `위치: ${data.location}\n신뢰도: ${data.confidence}%`
    })
  
    // 날씨
    try {
      const w = await getWeather(37.5326, 127.024612)
      temp.value = w.temp
      humidity.value = w.humidity
      windSpeed.value = w.windSpeed
      windDirection.value = getWindDirection(w.windDeg)
      precipitation.value = w.precipitation
    } catch (e) { console.error(e) }
  })
  
  function getWindDirection(deg) {
    if (deg < 45) return '북'
    if (deg < 90) return '북동'
    if (deg < 135) return '동'
    if (deg < 180) return '남동'
    if (deg < 225) return '남'
    if (deg < 270) return '남서'
    if (deg < 315) return '서'
    return '북서'
  }
  </script>
  
  <style scoped>
  html, body {
    margin: 0;
    padding: 0;
    height: 100vh;
  }
  
  .v-application {
    margin: 0 !important;
    padding: 0 !important;
  }
  .v-app-bar {
    background-color: #A30505 !important;
  }
  .logo {
    margin-left: 14px;
    width: auto;
    height: 35px;
  }
  .v-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: flex-start;
    min-height: 100vh;
    padding: 30px 40px;
    background-color: #FBFBFB;
    gap: 30px;
    overflow-y: auto;
  }
  .weather-info-card {
    width: 300px;
    padding: 20px;
    background-color: #FFFFFF;
    border-radius: 13px;
    box-shadow: 0px 4px 11px -3px rgba(0, 0, 0, 0.31);
  }
  .local-info-card-scroll {
    width: 700px;
    height: 400px;
    padding: 20px;
    background-color: #FFFFFF;
    border-radius: 13px;
    box-shadow: 0px 4px 11px -3px rgba(0, 0, 0, 0.31);
    overflow-y: auto;
  }
  .local-info-card-scroll::-webkit-scrollbar {
    width: 6px;
  }
  .local-info-card-scroll::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 6px;
  }
  .fire-card {
    background-color: #f33f3f !important;
    border-left: 6px solid rgb(0, 0, 0);
  }
  .smoke-card {
    background-color: #000000 !important;
    border-left: 6px solid black;
  }
  .map {
    box-shadow: 0px 4px 11px -3px rgba(0, 0, 0, 0.31);
  }
  h3 {
    color: black;
    margin-bottom: 8px;
  }
  .letter {
    color: black;
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 10px;
  }
  .wether-info {
    margin-left: 20px;
    color: cadetblue;
    font-size: 20px;
    font-weight: 300;
  }
  .filter-section {
    height:  238px;
    display: flex;
    gap: 16px;
    border-radius: 13px;
    box-shadow: 0px 4px 11px -3px rgba(0, 0, 0, 0.31);
    padding: 20px;
  }
  .filter-item {
    width: 200px;
    height: 100px;
    color: black;
  }
  .alert-dialog-card {
    background-color: #343a40;
    color: white;
    border: 2px solid rgba(255, 100, 100, 0.8);
    border-radius: 12px;
    box-shadow: 0 0 16px rgba(255, 100, 100, 0.4);
  }
  .cctv-view {
    width: 300px;
    height: 238px;
    background-color: #FFFFFF;
    border-radius: 13px;
    box-shadow: 0px 4px 11px -3px rgba(0, 0, 0, 0.31);
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .cause-card {
    width: 375px;
    height: 400px;
    background-color: #FFFFFF;
    border-radius: 13px;
    box-shadow: 0px 4px 11px -3px rgba(0, 0, 0, 0.31);
  }
  .bar-img {
    width: 100%;
    height: auto;
    padding-right: 65px;
    padding-left: 10PX;
    padding-top: 20px;
  }
  .cctv-name {
    color: black;
  }
  .placeholder {
    color: #000000;
  }
  .media {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  </style>