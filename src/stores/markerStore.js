import { defineStore } from 'pinia'
import axios from 'axios'

export const useMarkerStore = defineStore('marker', {
  state: () => ({ markers: [] }),
  actions: {
    async fetchMarkers() {
      this.markers = (await axios.get('/api/locations')).data
    },
    async addMarker(marker) {
      this.markers.push(marker)
    },
    async removeMarker(idx) {
      // 서버에 삭제 요청
      const updated = (await axios.delete(`/api/locations/${idx}`)).data
      // 스토어에 덮어쓰기
      this.markers = updated
    }
  }
})
