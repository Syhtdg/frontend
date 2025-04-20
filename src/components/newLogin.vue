<template>
  <v-container fluid class="login-container">
    <div class="login-box">
      <div class="left">
        <h1 class="title">Login</h1>

        <v-text-field label="ID" color="grey" class="input-box"></v-text-field>
        
        <v-text-field
          :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
          :type="visible ? 'text' : 'password'"
          label="PW"
          color="grey"
          class="input-box"
          @click:append-inner="togglePWvisibility"
        ></v-text-field>

        <v-btn @click.prevent="goDashBoard" class="login-btn">로그인</v-btn>
        
        <div class="link">
          <a href="#" class="link-txt">아이디 찾기</a> |
          <a href="#" class="link-txt">비밀번호 찾기</a> |
          <a href="#" @click.prevent="goSignUp" class="link-txt">회원가입</a>
        </div>

      </div>

      <div class="right">

          <img src="@/assets/Guardian_logo.png" class="logo" />
        <p class="comment-ko">AI를 활용한 시스템을 통해<br />누구보다 <span class="highlight">빠르게</span> 화재를 감지하세요</p>
        <p class="comment-en">
          Detect fire faster<br />
          than anyone else<br />
          with a system that uses AI
        </p>
        
      </div>
    </div>
  </v-container>
</template>

<script>
export default {
  methods: {
    togglePWvisibility() {
      this.visible = !this.visible;
    },
    goSignUp() {
      this.$router.push({ path: "/signup" });
    },
    goDashBoard() {
      this.$router.push({ path: "/dashboard" });
    },
  },
};
</script>

<style scoped>
.login-container {
  background: url('@/assets/firefighter_bg.jpeg') no-repeat center center;
  background-size: cover;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-box {
  width: 80%;
  max-width: 1000px;
  height: 500px;
  background-color: rgba(40, 40, 40, 0.7);
  display: flex;
  border-radius: 15px;
  padding: 30px;
  color: white;
}


.left,
.right {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.title {
  font-size: 32px;
  margin-bottom: 30px;
  font-weight: bold;
  color: white;
}

.input-box {
  margin-bottom: 20px;
}

.login-btn {
  width: 100%;
  height: 50px;
  background-color: #b00000;
  color: white;
  font-weight: bold;
  margin-top: 10px;
  margin-bottom: 15px;
}

.link {
  margin-top: 0px;
  font-size: 12px;
  text-align: center;
}

.link-txt {
  color: #fff;
  margin: 0 8px;
  text-decoration: none;
}

.right {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
}

.logo {
  width: 50%;
  height: 20%;
}

.comment-ko {
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 20px;
  margin-right: 18px;
}

.highlight {
  color: #ff3c3c;
}

.comment-en {
  font-size: 12px;
  color: #ccc;
  line-height: 1.5;
}
</style>
