<template>
  <v-container fluid class="dashboard-container">
    <!-- 상단 앱바 -->
    <v-app-bar>
      <img src="@/assets/입체 로고.png" alt="Logo" class="logo" />
      <v-btn>계정 관리</v-btn>
      <v-btn @click="$router.push('/cctvManage')">CCTV 관리</v-btn>
      <v-btn @click="$router.push('/log')">로그 관리</v-btn>
      <v-spacer />
      <v-btn @click="$router.push('/login')">로그아웃</v-btn>
    </v-app-bar>

    <div class="dashboard-content">
      <!-- 왼쪽 열: 기상 정보 + 화재 위험 로그 -->
      <div class="left-column">
        <!-- 기상 정보 카드 -->
        <div>
          <h3>기상 정보</h3>
          <div class="weather-info-card">
            <p class="letter">온도: <span class="weather-info">{{ temp }}°C</span></p>
            <p class="letter">습도: <span class="weather-info">{{ humidity }}%</span></p>
            <p class="letter">풍향: <span class="weather-info">{{ windDirection }}</span></p>
            <p class="letter">풍속: <span class="weather-info">{{ windSpeed }} m/s</span></p>
            <p class="letter">강수량: <span class="weather-info">{{ precipitation }} mm</span></p>
          </div>
        </div>

        <!-- 화재 위험 지역 정보 리스트 -->
        <div>
          <h3>화재 위험 지역 정보</h3>
            <div class="local-info-card-scroll"></div>
        </div>
      </div>

      <!-- 가운데 열: CCTV + 지도 -->
      <div class="center-column">
        <!-- CCTV 뷰어 -->
        <div>
          <h3>CCTV</h3>
          <div class="cctv-view">
            <div class="media-container">
              <span v-if="cctvLoading">로딩 중…</span>
              <span v-else-if="cctvError" class="error">{{ cctvError }}</span>

              <template v-else-if="cctv">
                <h4 style="color: black;">{{ cctv.cctvname }}</h4>

                <!-- HLS 형식일 때 -->
                <video
                  v-if="cctv.cctvformat === 'HLS'"
                  ref="videoRef"
                  controls
                  autoplay
                  muted
                  class="media"
                >
                  <source :src="cctv.cctvurl" type="application/vnd.apple.mpegurl" />
                  이 브라우저는 동영상을 지원하지 않습니다.
                </video>

                <!-- HLS가 아닐 때 (예: MP4) -->
                <video
                  v-else
                  :src="cctv.cctvurl"
                  controls
                  autoplay
                  muted
                  class="media"
                >
                  이 브라우저는 동영상을 지원하지 않습니다.
                </video>
              </template>

              <span v-else class="placeholder">위치를 선택해주세요.</span>
            </div>
          </div>
        </div>

        <!-- 지도: MapComponent 컴포넌트 사용 -->
        <div>
          <h3>지도</h3>
          <!-- MapComponent 내부에서 Kakao Map을 초기화하고, 마커를 표시하며,
              @select-marker 이벤트를 발생시키면 onSelectMarker가 호출됩니다. -->
          <MapComponent @select-marker="onSelectMarker" />
        </div>
      </div>

      <!-- 오른쪽 열: 필터 (필요 시 확장) -->
      <div class="right-column">
        <h3>이벤트 내역</h3>
        <div class="event-section">
          <div class="event-item">
            <v-card
              class="pa-4 mb-2"
              v-for="log in filteredLogs"
              :key="log.timestamp"
              :class="log.type === '불' ? 'fire-card' : 'smoke-card'"
            >
              <strong>위치:</strong> {{ log.location }}<br />
              <strong>종류:</strong> {{ log.type }}<br />
              <strong>신뢰도:</strong> {{ log.confidence }}%<br />
              <small style="color: #333;">{{ formatKoreanDate(log.timestamp) }}</small>
            </v-card>
          </div>
        </div>
      </div>
    </div>

    <!-- 알림 팝업 다이얼로그 -->
      <v-dialog v-model="alertDialog" persistent max-width="500">
      <v-card class="alert-dialog-card pa-6 text-center">
        <!-- 1) 제목 -->
        <v-card-title class="text-h5 font-weight-bold mb-2">
          {{ alertTitle }}
        </v-card-title>

        <!-- 2) (추가) 화재 영상 재생 영역: alertVideo에 값이 있을 때만 보여줍니다 -->
        <div v-if="alertVideo" class="alert-video-container">
          <video
            :src="alertVideo"
            controls
            autoplay
            muted
            class="alert-video"
          >
          브라우저가 video 태그를 지원하지 않습니다.
          </video>
        </div>

        <!-- 3) 원래 메시지(위치/신뢰도) -->
        <v-card-text
          class="mt-3"
          style="white-space: pre-line; font-size: 18px; line-height: 1.6;"
        >
          {{ alertMessage }}
        </v-card-text>

        <!-- 4) 확인 버튼 -->
        <v-card-actions class="justify-center mt-6">
          <v-btn
            color="red"
            variant="flat"
            class="confirm-button"
            @click="closeAlert"
          >
            확인
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import axios from '@/plugins/axios'
import { io } from 'socket.io-client'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { getWeather } from '@/services/weatherService'
import MapComponent from './MapComponent.vue'        // ✔ MapComponent 다시 사용
import { fetchNearestCctv } from '@/services/cctv'
import Hls from 'hls.js'

// ------------------------------
// 1. AI 로그 & 알림 관련 상태
// ------------------------------
const logs = ref([])
const typeFilter = ref('전체')
const selectedDate = ref(null)
const formattedDate = ref('')
const dateMenu = ref(false)

const alertDialog = ref(false)
const alertTitle = ref('')
const alertMessage = ref('')
const playingSounds = ref([])

// ------------------------------
// 2. CCTV 관련 상태
// ------------------------------
const cctv = ref(null)
const cctvLoading = ref(false)
const cctvError = ref('')
const videoRef = ref(null)

// ------------------------------
// 3. 기상 정보 관련 상태
// ------------------------------
const temp = ref(null)
const humidity = ref(null)
const windSpeed = ref(null)
const windDirection = ref(null)
const precipitation = ref(null)

// ------------------------------
// 4. Socket.IO 연결
// ------------------------------
const socket = io('http://localhost:10111')

// ------------------------------
// 5. 과거 AI 로그 목록 불러오기
// ------------------------------
async function fetchLogs() {
  try {
    const res = await axios.get('/ai/result/all')
    logs.value = res.data
  } catch (e) {
    console.error('AI 로그 불러오기 실패:', e)
  }
}

// ------------------------------
// 6. 로그 필터링 (타입, 날짜)
// ------------------------------
const filteredLogs = computed(() =>
  logs.value.filter((log) => {
    const matchesType = typeFilter.value === '전체' || log.type === typeFilter.value
    const matchesDate =
      !selectedDate.value ||
      format(new Date(log.timestamp), 'yyyy-MM-dd') === format(selectedDate.value, 'yyyy-MM-dd')
    return matchesType && matchesDate
  })
)

// ------------------------------
// 7. 한국어 날짜 포매팅 함수
// ------------------------------
function formatKoreanDate(date) {
  return format(new Date(date), 'yyyy년 M월 d일 (eee) HH:mm:ss', { locale: ko })
}

// ------------------------------
// 8. 알림 닫기 & 사운드 정리
// ------------------------------
function closeAlert() {
  alertDialog.value = false
  playingSounds.value.forEach((sound) => {
    sound.pause()
    sound.currentTime = 0
  })
  playingSounds.value = []
}

// ------------------------------
// 9. 사운드 재생 함수
// ------------------------------
function playSound(type) {
  // public/sounds 폴더 안에 파일이 있어야 함
  const src = type === '불' ? '/sounds/fire.mp3' : '/sounds/smoke.mp3'
  const audio = new Audio(src)
  audio.volume = 1.0
  audio
    .play()
    .then(() => {
      console.log('✅ 사운드 재생 성공:', src)
    })
    .catch((err) => {
      console.warn('❌ 사운드 재생 실패:', err)
    })
  playingSounds.value.push(audio)
}

// ------------------------------
// 10. 소켓 이벤트 핸들링 & 초기화
// ------------------------------
onMounted(() => {
  // 10-1. 과거 로그 가져오기
  fetchLogs()

  // 10-2. Socket.IO 이벤트 리스너
  socket.on('connect', () => {
    console.log('✅ 소켓 연결 완료:', socket.id)
  })

  socket.on('connect_error', (err) => {
    console.error('❌ 소켓 연결 오류:', err)
  })

  // 서버가 emit('aiResult', data) 또는 emit('log', data) 중 하나를 사용했다면
  socket.on('aiResult', (data) => {
    handleIncomingLog(data)
  })
  socket.on('log', (data) => {
    handleIncomingLog(data)
  })
})

// ------------------------------
// 11. 서버로부터 받은 로그 처리 함수
// ------------------------------
function handleIncomingLog(data) {
  console.log('📥 서버로부터 받은 데이터:', data)

  // 11-1. 화면 로그 리스트 업데이트
  logs.value.unshift(data)
  if (logs.value.length > 50) logs.value.pop()

  // 11-2. 팝업 열기
  alertDialog.value = true

  // 11-3. 팝업 제목 & 메시지 세팅
  if (data.type === '불') {
    alertTitle.value = '🔥 화재 감지됨'
  } else {
    alertTitle.value = '💨 연기 감지됨'
  }
  alertMessage.value = `위치: ${data.location}\n신뢰도: ${data.confidence}%`

  // 11-4. 사운드 재생
  playSound(data.type)
}

// ------------------------------
// 12. CCTV 호출 핸들러
// ------------------------------
async function onSelectMarker({ lat, lng }) {
  cctvLoading.value = true
  cctvError.value = ''
  cctv.value = null
  try {
    const result = await fetchNearestCctv(lat, lng)
    console.log('CCTV API 응답:', result)
    cctv.value = result
  } catch (err) {
    console.error(err)
    cctvError.value = err.message || 'CCTV 호출 실패'
  } finally {
    cctvLoading.value = false
  }
}

// ------------------------------
// 13. CCTV 스트림(HLS) 초기화
// ------------------------------
watch(cctv, async (newVal) => {
  if (!newVal) return
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

// ------------------------------
// 14. 기상 정보 조회
// ------------------------------
onMounted(async () => {
  try {
    const data = await getWeather(37.5326, 127.024612)
    temp.value = data.temp
    humidity.value = data.humidity
    windSpeed.value = data.windSpeed
    windDirection.value = getWindDirection(data.windDeg)
    precipitation.value = data.precipitation
  } catch (err) {
    console.error(err)
  }
})

// ------------------------------
// 15. 풍향 계산 함수
// ------------------------------
function getWindDirection(deg) {
  if (deg >= 0 && deg < 45) return '북'
  if (deg < 90) return '북동'
  if (deg < 135) return '동'
  if (deg < 180) return '남동'
  if (deg < 225) return '남'
  if (deg < 270) return '남서'
  if (deg < 315) return '서'
  return '북서'
}

// ------------------------------
// 16. 날짜 선택, 초기화 함수
// ------------------------------
function onDateSelected(date) {
  formattedDate.value = format(date, 'yyyy-MM-dd')
  dateMenu.value = false
}

function clearDate() {
  selectedDate.value = null
  formattedDate.value = ''
}
</script>

<style scoped>
html,
body {
  margin: 0;
  padding: 0;
  height: 100vh;
}

h3 {
  color: white;
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

.dashboard-container {
  display: flex;
  flex-direction: column;
  padding: 30px 40px;
  height: 100%;
  background-color: #181818;
}

.dashboard-content {
  display: flex;
  flex-direction: row;
  gap: 24px;
  margin-top: 24px;
  width: 100%;
  justify-content: center;
}

.left-column,
.center-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.left-column {
  flex: 1;
  min-width: 300px;
  align-items: center;
  margin-left: 50px;
  margin-top: 40px;
}

.center-column {
  flex: 1;
  min-width: 375px;
  align-items: center;
  margin-right: 100px;
  margin-top: 45px;
}

.right-column {
  flex: 1;
  min-width: 300px;
  margin-right: 170px;
}

.weather-info-card {
  width: 300px;
  height: 300px;
  padding: 20px;
  background-color: #242424;
  border-radius: 7px;
  border: 1px solid #fff;
  box-shadow: 0px 4px 11px -3px rgba(0, 0, 0, 0.31);
  line-height: 2.2;
}

.local-info-card-scroll {
  width: 300px;
  height: 300px;
  padding: 20px;
  background-color: #242424;
  border-radius: 7px;
  border: 1px solid #fff;
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
  border-left: 6px solid #000;
  width: 550px;
  height: 120px;
}

.smoke-card {
  background-color: #000 !important;
  border-left: 6px solid #000;
}

.cctv-view {
  width: 570px;
  height: 300px;
  background-color: #242424;
  border-radius: 7px;
  border: 1px solid #fff;
  box-shadow: 0px 4px 11px -3px rgba(0, 0, 0, 0.31);
  display: flex;
  justify-content: center;
  align-items: center;
}

.map {
  width: 570px;
  height: 300px;
  border-radius: 7px;
  border: 1px solid #fff;
  box-shadow: 0px 4px 11px -3px rgba(0, 0, 0, 0.31);
}

.event-section {
  display: flex;
  gap: 24px;
  width: 600px;
  height: 700px;
  flex-direction: row;
  border-radius: 7px;
  border: 1px solid #fff;
  box-shadow: 0px 4px 11px -3px rgba(0, 0, 0, 0.31);
  padding: 20px;
  background-color: #242424;
  overflow-y: auto;
}

.event-item {
  width: 100px;
  height: 40px;
  color: black;
}

.alert-dialog-card {
  background-color: #343a40;
  color: white;
  border: 2px solid rgba(255, 100, 100, 0.8);
  border-radius: 12px;
  box-shadow: 0 0 16px rgba(255, 100, 100, 0.4);
}

.letter {
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
}

.weather-info {
  margin-left: 20px;
  color: #8498ca;
  font-size: 20px;
  font-weight: 400;
}

.bar-img {
  width: 100%;
  height: auto;
  padding-right: 65px;
  padding-left: 10px;
  padding-top: 20px;
}

.cctv-name {
  color: black;
}

.placeholder {
  color: #fff;
}

.media {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
