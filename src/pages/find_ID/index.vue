<template>
  <v-container class="find-container">
    <v-card class="find-card">
      <v-card-title class="title">아이디 찾기</v-card-title>
      <v-card-text>
        <v-text-field label="이름" v-model="NAME" class="input-box" />
        <v-text-field label="이메일" v-model="EMAIL" class="input-box" />
        <v-btn color="primary" class="find-btn" @click="findID">아이디 찾기</v-btn>
        <p v-if="foundID" class="result-text">👉 당신의 아이디는 <strong>{{ foundID }}</strong> 입니다.</p>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import axios from '@/plugins/axios';

export default {
  data() {
    return {
      NAME: '',
      EMAIL: '',
      foundID: ''
    };
  },
  methods: {
    async findID() {
      try {
        const res = await axios.post('/findID', {
          NAME: this.NAME,
          EMAIL: this.EMAIL
        });
        this.foundID = res.data.ID;
      } catch (err) {
        alert(err.response?.data?.message || '아이디 찾기 실패');
      }
    }
  }
};
</script>

<style scoped>
.find-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #2a2a2a;
}

.find-card {
  padding: 30px;
  max-width: 400px;
  width: 100%;
  background-color: #1e1e1e;
  color: white;
}

.title {
  font-size: 20px;
  color: #5cffd1;
  text-align: center;
  margin-bottom: 20px;
}

.input-box {
  margin-bottom: 15px;
}

.find-btn {
  width: 100%;
  background-color: #5cffd1;
  color: black;
  font-weight: bold;
}

.result-text {
  margin-top: 20px;
  font-size: 14px;
  color: #ffffffc0;
}
</style>
