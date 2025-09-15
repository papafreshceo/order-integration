// auth.js - 주문통합 시스템 인증 모듈

// 전역 변수
let currentUser = null;
let authInitialized = false;

// DOM이 로드되었는지 확인
function waitForDOM() {
    return new Promise((resolve) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', resolve);
        } else {
            resolve();
        }
    });
}

// 초기화 함수
async function initAuth() {
    await waitForDOM();
    
    // Firebase Auth가 로드되었는지 확인
    if (typeof window.auth === 'undefined') {
        console.error('Firebase Auth not initialized');
        showLoginScreenForced();
        return;
    }
    
    // Auth 상태 리스너 설정
    window.auth.onAuthStateChanged((user) => {
        console.log('Auth state changed:', user ? 'logged in' : 'logged out');
        
        if (!authInitialized) {
            authInitialized = true;
            handleInitialAuth(user);
        } else {
            handleAuthStateChange(user);
        }
    });
    
    // 3초 후 강제로 로그인 화면 표시 (Firebase 응답 없을 경우)
    setTimeout(() => {
        if (!authInitialized) {
            console.warn('Firebase timeout - forcing login screen');
            authInitialized = true;
            showLoginScreenForced();
        }
    }, 3000);
}

// 초기 인증 처리
function handleInitialAuth(user) {
    const initialLoading = document.getElementById('initialLoading');
    const loginScreen = document.getElementById('loginScreen');
    const mainSystem = document.getElementById('mainSystem');
    
    // 로딩 화면 숨기기
    if (initialLoading) {
        initialLoading.style.display = 'none';
    }
    
    if (user) {
        // 로그인 상태
        currentUser = user;
        if (loginScreen) loginScreen.style.display = 'none';
        if (mainSystem) mainSystem.style.display = 'block';
        
        updateUserInfo(user);
        
        // 메인 앱 초기화
        if (typeof initializeApp === 'function') {
            try {
                initializeApp();
            } catch (error) {
                console.error('App initialization error:', error);
            }
        }
    } else {
        // 비로그인 상태
        currentUser = null;
        if (loginScreen) loginScreen.style.display = 'flex';
        if (mainSystem) mainSystem.style.display = 'none';
    }
}

// 인증 상태 변경 처리
function handleAuthStateChange(user) {
    const loginScreen = document.getElementById('loginScreen');
    const mainSystem = document.getElementById('mainSystem');
    
    if (user) {
        // 로그인 상태
        currentUser = user;
        if (loginScreen) loginScreen.style.display = 'none';
        if (mainSystem) mainSystem.style.display = 'block';
        
        updateUserInfo(user);
        
        // 메인 앱 초기화
        if (typeof initializeApp === 'function') {
            try {
                initializeApp();
            } catch (error) {
                console.error('App initialization error:', error);
            }
        }
    } else {
        // 로그아웃 상태
        currentUser = null;
        if (loginScreen) loginScreen.style.display = 'flex';
        if (mainSystem) mainSystem.style.display = 'none';
    }
}

// 강제로 로그인 화면 표시
function showLoginScreenForced() {
    const initialLoading = document.getElementById('initialLoading');
    const loginScreen = document.getElementById('loginScreen');
    const mainSystem = document.getElementById('mainSystem');
    
    if (initialLoading) initialLoading.style.display = 'none';
    if (loginScreen) loginScreen.style.display = 'flex';
    if (mainSystem) mainSystem.style.display = 'none';
}

// 사용자 정보 업데이트
function updateUserInfo(user) {
    const userEmailElement = document.getElementById('userEmail');
    if (userEmailElement) {
        userEmailElement.textContent = user.email || user.displayName || '사용자';
    }
}

// 엔터키 처리
function handleEnter(event) {
    if (event.key === 'Enter') {
        const loginCard = document.getElementById('loginCard');
        const signupCard = document.getElementById('signupCard');
        
        if (loginCard && loginCard.style.display !== 'none') {
            signInWithEmail();
        } else if (signupCard && signupCard.style.display !== 'none') {
            signUp();
        }
    }
}

// Google 로그인
async function signInWithGoogle() {
    try {
        if (!window.googleProvider) {
            window.googleProvider = new firebase.auth.GoogleAuthProvider();
        }
        
        const result = await window.auth.signInWithPopup(window.googleProvider);
        console.log('Google login successful:', result.user.email);
        
        // 에러 메시지 숨기기
        hideError();
        
    } catch (error) {
        console.error('Google login error:', error);
        showError(getErrorMessage(error.code));
    }
}

// 이메일 로그인
async function signInWithEmail() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (!emailInput || !passwordInput) {
        console.error('Login inputs not found');
        return;
    }
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        showError('이메일과 비밀번호를 입력하세요');
        return;
    }
    
    try {
        const result = await window.auth.signInWithEmailAndPassword(email, password);
        console.log('Email login successful:', result.user.email);
        
        // 입력 필드 초기화
        emailInput.value = '';
        passwordInput.value = '';
        
        // 에러 메시지 숨기기
        hideError();
        
    } catch (error) {
        console.error('Email login error:', error);
        showError(getErrorMessage(error.code));
    }
}

// 회원가입
async function signUp() {
    const nameInput = document.getElementById('signupName');
    const emailInput = document.getElementById('signupEmail');
    const passwordInput = document.getElementById('signupPassword');
    
    if (!nameInput || !emailInput || !passwordInput) {
        console.error('Signup inputs not found');
        return;
    }
    
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!name || !email || !password) {
        showSignupError('모든 필드를 입력하세요');
        return;
    }
    
    if (password.length < 6) {
        showSignupError('비밀번호는 6자 이상이어야 합니다');
        return;
    }
    
    try {
        const result = await window.auth.createUserWithEmailAndPassword(email, password);
        
        // 프로필 업데이트
        await result.user.updateProfile({
            displayName: name
        });
        
        console.log('Signup successful:', result.user.email);
        showSignupSuccess('회원가입 성공! 자동으로 로그인됩니다...');
        
        // 입력 필드 초기화
        nameInput.value = '';
        emailInput.value = '';
        passwordInput.value = '';
        
        // 2초 후 로그인 화면으로 전환
        setTimeout(() => {
            showLogin();
            hideSignupError();
        }, 2000);
        
    } catch (error) {
        console.error('Signup error:', error);
        showSignupError(getErrorMessage(error.code));
    }
}

// 로그아웃
async function signOut() {
    if (confirm('로그아웃 하시겠습니까?')) {
        try {
            await window.auth.signOut();
            console.log('Signed out successfully');
            
            // 페이지 새로고침으로 상태 초기화
            window.location.reload();
            
        } catch (error) {
            console.error('Sign out error:', error);
            alert('로그아웃 중 오류가 발생했습니다.');
        }
    }
}

// 에러 메시지 변환
function getErrorMessage(code) {
    const messages = {
        'auth/user-not-found': '등록되지 않은 이메일입니다.',
        'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
        'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
        'auth/weak-password': '비밀번호는 6자 이상이어야 합니다.',
        'auth/invalid-email': '유효하지 않은 이메일 형식입니다.',
        'auth/network-request-failed': '네트워크 연결을 확인해주세요.',
        'auth/too-many-requests': '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.',
        'auth/popup-closed-by-user': '로그인 창이 닫혔습니다.',
        'auth/cancelled-popup-request': '이미 로그인 창이 열려 있습니다.',
        'auth/operation-not-allowed': '이 로그인 방법은 비활성화되어 있습니다.',
        'auth/invalid-credential': '잘못된 인증 정보입니다.'
    };
    return messages[code] || '오류가 발생했습니다. 다시 시도해주세요.';
}

// UI 헬퍼 함수들
function showError(message) {
    const errorElement = document.getElementById('errorMsg');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }
}

function hideError() {
    const errorElement = document.getElementById('errorMsg');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

function showSignupError(message) {
    const errorElement = document.getElementById('signupErrorMsg');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        errorElement.style.background = '#fee2e2';
        errorElement.style.color = '#dc3545';
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }
}

function hideSignupError() {
    const errorElement = document.getElementById('signupErrorMsg');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

function showSignupSuccess(message) {
    const errorElement = document.getElementById('signupErrorMsg');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.background = '#d4edda';
        errorElement.style.color = '#155724';
        errorElement.style.display = 'block';
    }
}

// 화면 전환 함수들
function showSignUp() {
    const loginCard = document.getElementById('loginCard');
    const signupCard = document.getElementById('signupCard');
    const errorMsg = document.getElementById('errorMsg');
    
    if (loginCard) loginCard.style.display = 'none';
    if (signupCard) signupCard.style.display = 'block';
    if (errorMsg) errorMsg.style.display = 'none';
}

function showLogin() {
    const loginCard = document.getElementById('loginCard');
    const signupCard = document.getElementById('signupCard');
    const signupErrorMsg = document.getElementById('signupErrorMsg');
    
    if (loginCard) loginCard.style.display = 'block';
    if (signupCard) signupCard.style.display = 'none';
    if (signupErrorMsg) signupErrorMsg.style.display = 'none';
}

// 인증 초기화 시작
initAuth();