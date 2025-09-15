// firebase-config.js

const firebaseConfig = {
    apiKey: "AIzaSyCTpN0YHRZ0NrhQoLMAHNEglEhzwlBFoDA",
    authDomain: "order-integration-4c379.firebaseapp.com",
    projectId: "order-integration-4c379",
    storageBucket: "order-integration-4c379.firebasestorage.app",
    messagingSenderId: "695731576846",
    appId: "1:695731576846:web:624c6b9844ea6d33559c5f",
    measurementId: "G-ECH5ZRJF27"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// Auth 인스턴스 생성
const auth = firebase.auth();

// Google Provider 설정
const googleProvider = new firebase.auth.GoogleAuthProvider();

// 한국어 설정
auth.languageCode = 'ko';