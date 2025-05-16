<template>
<v-app>
    <v-container class="no-scroll">
        <v-app-bar>
              <img src="@/assets/입체 로고.png" alt="Logo" class="logo" @click="$router.push('/dashboard')"/>
              <v-btn>계정 관리</v-btn>
              <v-btn @click="$router.push('/cctvManage')">CCTV 관리</v-btn>
              <v-btn @click="$router.push('/log')">로그 관리</v-btn>
            </v-app-bar>
        <div class="CctvManage-container">
            <div class="cctv-list">
                <div class="list-container">
                    <div class="list-box">
                        <li class="letter">경기도 안양시 (북) 2024-06-19 14:13:16</li>
                    </div>
                    <div class="list-box">
                        <li class="letter">경기도 안양시 (남) 2024-06-19 17:03:17</li>
                    </div>
                    <div class="list-box">
                        <li class="letter">경기도 고양시 (북) 2023-12-10 13:50:36</li>
                    </div>
                   
                    
                </div>
            </div>
            <div id="map" class="map" style="width: 700px; height: 694px; border-radius: 13px;"><MapComponet/></div>
        </div>
    </v-container>
</v-app>

</template>

<script setup>
import { onMounted } from 'vue';
import MapComponet from '@/components/MapComponet.vue';

</script>

<style scoped>

html, body, #app, .v-application {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background-color: #FBFBFB !important;  /* 흰 배경 강제 적용 */
  overflow-x: hidden;
  overflow: hidden !important;
}  

.logo {
    cursor: pointer;
}

.v-app-bar {
  background-color: #A30505 !important;
}

.v-container {
  display: flex;
  width: 100%; 
  align-items: flex-start;
  margin-top: 120px;
  height: 100vh;
  max-height: 100%;
  padding: 30px 40px;
  background-color: #FBFBFB;
  gap: 30px;
  justify-content: center;
}

.no-scroll {
  overflow: hidden !important;
  height: 100% !important;
}

.CctvManage-container {
    display: flex;
    flex-direction: row;
    gap: 200px;
}

.letter {
    padding: 20px;
    font-size: 20px;
    font-weight: bold;
    color: #2c2c2c;
    list-style: none;
}

.list-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 600px;
    height: 100%;
    padding: 20px;
    text-align: center;
    background-color: #FFFFFF;
    border-radius: 13px;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
}

.list-box {
    display: flex;
    width: 100%;
    height: 60px;
    border-radius: 10px;
    border: 1px;
    background: #E9E9E9;
    align-items: center;
    box-sizing: border-box;
    align-items: center; 
    cursor: pointer;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
}
</style>