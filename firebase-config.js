// firebase-config.js - Firebase 설정 및 초기화

// Firebase 설정 객체
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

// Auth 인스턴스 생성 및 전역 변수로 설정
window.auth = firebase.auth();

// Google Provider 설정
window.googleProvider = new firebase.auth.GoogleAuthProvider();

// 한국어 설정
window.auth.languageCode = 'ko';

console.log('Firebase initialized successfully');