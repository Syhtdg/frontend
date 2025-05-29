<template>
  <v-app>
    <v-container class="no-scroll">
      <v-app-bar>
        <img
          src="@/assets/입체 로고.png"
          alt="Logo"
          class="logo"
          @click="$router.push('/dashboard')"
        />
        <v-btn>계정 관리</v-btn>
        <v-btn @click="$router.push('/cctvManage')">CCTV 관리</v-btn>
        <v-btn @click="$router.push('/log')">로그 관리</v-btn>
      </v-app-bar>

      <div class="CctvManage-container">
        <!-- 왼쪽 리스트: 사용자가 선택한 마커만 표시 -->
        <div class="cctv-list">
          <v-btn class="add-Btn" @click="addDialog = true">추가하기</v-btn>

          <!-- 추가하기 다이얼로그 -->
          <v-dialog v-model="addDialog" max-width="400">
            <v-card class="popup">
              <v-card-title style="color: black; text-align: center; margin: 10px; border-radius: 10px;">CCTV 추가</v-card-title>
              <v-card-text>
                <v-text-field style="background-color: #C2C2C2; height: 50px; margin-bottom: 30px; border-radius: 10px;"
                  v-model.number="newLat"
                  label="위도 (lat)"
                  type="number"
                  :rules="[v => v !== null || '위도를 입력하세요']"
                  color="black"
                />
                <v-text-field style="background-color: #C2C2C2; height: 50px; border-radius: 10px"
                  v-model.number="newLon"
                  label="경도 (lon)"
                  type="number"
                  :rules="[v => v !== null || '경도를 입력하세요']"
                  color="black"
                />
              </v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn text @click="addDialog = false" style="background-color: black; border-radius: 30px;">취소</v-btn>
                <v-btn @click="addNewMarker" style="background-color: crimson; color: white; border-radius: 30px; margin-right: 13px;">확인</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>

          <div
            v-for="(item, idx) in selectedList"
            :key="idx"
            class="list-box"
          >
            <span class="letter">
              위도: {{ item.lat.toFixed(6) }}, 경도: {{ item.lng.toFixed(6) }}
            </span>
            <v-btn small color="error" @click="deleteItem(idx)">
              삭제
            </v-btn>
          </div>
          <div v-if="selectedList.length === 0" class="placeholder">
            선택된 CCTV가 없습니다.
          </div>
        </div>

        <!-- 오른쪽 지도: 백엔드에서 불러온 전체 마커 -->
        <div class="map">
          <MapComponent
            ref="mapCpt"
            :initialMarkers="markers"
            @select-marker="onMarkerClicked"
          />
        </div>
      </div>
    </v-container>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import MapComponent from '@/components/MapComponent.vue'

// 지도에 찍을 전체 마커 (읽기 전용)
const markers = ref([])
// 사용자가 클릭해 선택한 마커 리스트
const selectedList = ref([])

// 추가 다이얼로그 상태, 신규 위도·경도
const addDialog = ref(false)
const newLat = ref(null)
const newLon = ref(null)

// 페이지 로드 시 백엔드에서 전체 위치 데이터 가져오기
onMounted(async () => {
  try {
    const { data } = await axios.get('/api/locations')
    markers.value = data
  } catch (err) {
    console.error('CCTV 위치 목록 로드 실패:', err)
  }
})

// 지도에서 마커가 클릭되면 selectedList에 추가
function onMarkerClicked(payload) {
  if (!selectedList.value.some(x => x.idx === payload.idx)) {
    selectedList.value.push(payload)
  }
}

// 리스트에서 삭제 클릭 시
async function deleteItem(listIndex) {
  const item = selectedList.value[listIndex]
  try {
    const { data: updated } = await axios.delete(`/api/locations/${item.idx}`)
    markers.value = updated
    selectedList.value.splice(listIndex, 1)
  } catch (err) {
    console.error('마커 삭제 실패:', err)
  }
}

// 신규 마커 추가
async function addNewMarker() {
  if (newLat.value === null || newLon.value === null) return
  try {
    const { data: updated } = await axios.post('/api/locations', {
      lat: newLat.value,
      lon: newLon.value
    })
    markers.value = updated
    // 초기화 및 다이얼로그 닫기
    newLat.value = null
    newLon.value = null
    addDialog.value = false
  } catch (err) {
    console.error('추가 실패:', err)
  }
}
</script>

<style scoped>
html, body, #app, .v-application {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background-color: #FBFBFB !important;
  overflow-x: hidden;
  overflow: hidden !important;
}
.logo { cursor: pointer; }
.v-app-bar { background-color: #A30505 !important; }
.v-container {
  display: flex;
  width: 100%;
  align-items: flex-start;
  margin-top: 120px;
  height: 100vh;
  padding: 30px 40px;
  gap: 30px;
  justify-content: center;
}
.no-scroll { overflow: hidden !important; height: 100% !important; }
.CctvManage-container { display: flex; flex-direction: row; gap: 200px; }
.letter {
  padding: 20px;
  font-size: 20px;
  font-weight: bold;
  color: #2c2c2c;
}
.cctv-list { display: flex; flex-direction: column; }
.add-Btn {
  width: 100px;
  height: 60px;
  background-color: #C2C2C2;
  color: white;
  font-size: 15px;
  font-weight: bold;
  border-radius: 7px;
  margin-bottom: 20px;
}
.list-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 60px;
  background: #E9E9E9;
  border-radius: 10px;
  padding: 0 16px;
  margin-bottom: 20px;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
}
.placeholder {
  color: #777;
  font-size: 16px;
  text-align: center;
  margin-top: 40px;
}
.map { width: 700px; height: 694px; border-radius: 13px; }

.popup {
  background-color: #FBFBFB;
}
</style>
