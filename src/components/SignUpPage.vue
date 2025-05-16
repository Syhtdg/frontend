<template>
    <v-icon class="back" @click="$router.go(-1)">mdi-chevron-left</v-icon>
    <v-container fluid>
        <div class="signup-form">
            <h3 class="title">회원가입</h3>
            <v-form>
                <v-text-field label="ID" v-model="ID" color="grey" class="input-box" />

                <v-text-field 
                    label="PW" 
                    :append-inner-icon="visible ? 'mdi-eye' : 'mdi-eye-off'"
                    :type="visible ? 'text' : 'password'"
                    v-model="PASSWORD"
                    color="grey" 
                    class="input-box"
                    @click:append-inner="togglePasswordVisibility"
                ></v-text-field>

                <v-text-field label="E-MAIL" v-model="EMAIL" color="grey" class="input-box" />
                
                <v-text-field label="NAME" v-model="NAME" color="grey" class="input-box" />
                
                <v-btn class="signup-btn" @click="submitForm">
                    가입
                </v-btn>
            </v-form>
        </div>
    </v-container>
</template>

<style>
html, body {
    margin: 0 !important;
    padding: 0 !important;
    height: 100vh !important;
    overflow: hidden;
}

.v-application {
    margin: 0 !important;
    padding: 0 !important;
}

.v-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #2a2a2a;
}

.signup-form {
    padding: 20px;
    border-radius: 10px;
    max-width: 400px;
    width: 100%;
    text-align: center;
}

.title {
    color: #5cffd1;
    font-weight: bold;
    margin-bottom: 20px;
}

.input-box {
    height: 50px;
    background-color: #3a3a3a;
    color: white;
    margin-bottom: 30px;
}

.signup-btn {
    width: 400px;
    height: 50px !important;
    font-size: 14px;
    border-radius: 25px;
    color: black;
    font-weight: bold;
    background-color: #5cffd1;
}

.back {
    position: fixed;
    top: 50px;
    left: 80px;
    font-size: 24px;
}
</style>


<script>
import axios from '@/plugins/axios'; // axios 인스턴스 사용

export default {
  data() {
    return {
      visible: false,
      ID: '',
      PASSWORD: '',
      EMAIL: '',
      NAME: ''
    };
  },
  methods: {
    togglePasswordVisibility() {
      this.visible = !this.visible;
    },
    async submitForm() {
      console.log('가입 시도');
      try {
        const res = await axios.post('/register', {
          ID: this.ID,
          PASSWORD: this.PASSWORD,
          EMAIL: this.EMAIL,
          NAME: this.NAME
        });
        alert(res.data.message || '회원가입 성공!');
        this.$router.push('/');
      } catch (err) {
        alert(err.response?.data?.message || '회원가입 실패');
      }
    }
  }
};
</script>

