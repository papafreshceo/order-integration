// auth.js - 주문통합 시스템 인증 모듈

// 전역 변수
let currentUser = null;
let authInitialized = false;  // 인증 상태 확인 플래그

// Firebase Auth 상태 감지
if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged((user) => {
        console.log('Auth state changed:', user ? 'logged in' : 'logged out');
        
        if (!authInitialized) {
            authInitialized = true;
            
            // 로딩 화면 숨기기
            const initialLoading = document.getElementById('initialLoading');
            if (initialLoading) {
                initialLoading.style.display = 'none';
            }
            
            if (user) {
                // 로그인 상태
                currentUser = user;
                document.getElementById('loginScreen').style.display = 'none';
                document.getElementById('mainSystem').style.display = 'block';
                
                const userEmailElement = document.getElementById('userEmail');
                if (userEmailElement) {
                    userEmailElement.textContent = user.email;
                }
                
                // 주문통합 앱 초기화
                if (typeof initializeApp === 'function') {
                    initializeApp();
                }
            } else {
                // 비로그인 상태 - 로그인 화면 표시
                currentUser = null;
                document.getElementById('loginScreen').style.display = 'flex';
                document.getElementById('mainSystem').style.display = 'none';
            }
        }
    });
}

// 2초 후 강제로 로그인 화면 표시 (Firebase 응답 없을 경우)
setTimeout(() => {
    if (!authInitialized) {
        console.warn('Firebase timeout - forcing login screen');
        authInitialized = true;
        document.getElementById('initialLoading').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';
    }
}, 2000);

// 엔터키 처리
function handleEnter(event) {
    if (event.key === 'Enter') {
        const activeCard = document.getElementById('loginCard').style.display !== 'none' ? 'login' : 'signup';
        if (activeCard === 'login') {
            signInWithEmail();
        } else {
            signUp();
        }
    }
}

// Google 로그인
async function signInWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        await auth.signInWithPopup(provider);
        console.log('Google login successful');
    } catch (error) {
        console.error('Google login error:', error);
        showError(getErrorMessage(error.code));
    }
}

// 이메일 로그인
async function signInWithEmail() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showError('이메일과 비밀번호를 입력하세요');
        return;
    }
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        console.log('Email login successful');
        // 입력 필드 초기화
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
    } catch (error) {
        console.error('Email login error:', error);
        showError(getErrorMessage(error.code));
    }
}

// 회원가입
async function signUp() {
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    if (!name || !email || !password) {
        showSignupError('모든 필드를 입력하세요');
        return;
    }
    
    if (password.length < 6) {
        showSignupError('비밀번호는 6자 이상이어야 합니다');
        return;
    }
    
    try {
        const result = await auth.createUserWithEmailAndPassword(email, password);
        await result.user.updateProfile({
            displayName: name
        });
        
        console.log('Signup successful');
        showSignupSuccess('회원가입 성공! 자동으로 로그인됩니다...');
        
        // 입력 필드 초기화
        document.getElementById('signupName').value = '';
        document.getElementById('signupEmail').value = '';
        document.getElementById('signupPassword').value = '';
        
        setTimeout(() => {
            showLogin();
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
            await auth.signOut();
            console.log('Signed out successfully');
        } catch (error) {
            console.error('Sign out error:', error);
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
        'auth/too-many-requests': '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.'
    };
    return messages[code] || '오류가 발생했습니다. 다시 시도해주세요.';
}

// UI 함수들
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

function showSignupError(message) {
    const errorElement = document.getElementById('signupErrorMsg');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        errorElement.style.background = '#fee';
        errorElement.style.color = '#c33';
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
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

// 화면 전환
function showSignUp() {
    document.getElementById('loginCard').style.display = 'none';
    document.getElementById('signupCard').style.display = 'block';
    document.getElementById('errorMsg').style.display = 'none';
}

function showLogin() {
    document.getElementById('loginCard').style.display = 'block';
    document.getElementById('signupCard').style.display = 'none';
    document.getElementById('signupErrorMsg').style.display = 'none';
}