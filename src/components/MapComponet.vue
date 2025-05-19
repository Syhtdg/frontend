<template>
  <div id="map" class="map"></div>
</template>

<script>
import { cctvLocations } from '@/assets/data/CctvLocation.js';

export default {
  name: 'MapComponent',
  emits: ['select-marker'],
  mounted() {
    // Kakao Maps SDK 로드
    const script = document.createElement('script');
    script.src = '//dapi.kakao.com/v2/maps/sdk.js?appkey=7287e30fdbe7200a54db305e55034cce&autoload=false';
    script.onload = () => {
      window.kakao.maps.load(() => {
        const mapContainer = document.getElementById('map');
        const mapOption = {
          center: new kakao.maps.LatLng(35.82208889, 128.7434639),
          level: 8,
        };
        const map = new kakao.maps.Map(mapContainer, mapOption);

        cctvLocations.forEach(location => {
          const { lat, lon } = location;
          const position = new kakao.maps.LatLng(lat, lon);
          const marker = new kakao.maps.Marker({ position });
          marker.setMap(map);
          // 클릭 이벤트를 걸어 부모로 위경도 전달
          kakao.maps.event.addListener(marker, 'click', () => {
            console.log('marker clicked', lat, lon);
            this.$emit('select-marker', { lat, lng: lon });
          });
        });
      });
    };
    document.head.appendChild(script);
  }
};
</script>

<style scoped>
.map {
  width: 100%;
  height: 100%;
}
</style>
