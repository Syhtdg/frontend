<script>

import { cctvLocations } from '@/assets/data/CctvLocation.js';

export default {
  name: 'MapComponent',
  mounted() {
    const script = document.createElement("script");
    script.src = "//dapi.kakao.com/v2/maps/sdk.js?appkey=7287e30fdbe7200a54db305e55034cce&autoload=false";
    script.onload = () => {
      window.kakao.maps.load(() => {
        const mapContainer = document.getElementById('map');
        const mapOption = {
          center: new kakao.maps.LatLng(37.532600, 	127.024612), // 지도의 중심좌표
          level: 12, // 지도의 확대 레벨
        };
        const map = new kakao.maps.Map(mapContainer, mapOption);

    cctvLocations.forEach((location) => {
    const markerPosition = new kakao.maps.LatLng(location.lat, location.lon);
    const marker = new kakao.maps.Marker({
    position: markerPosition
  });
  marker.setMap(map);
});
      });
    };
    document.head.appendChild(script);
  }
};
</script>
