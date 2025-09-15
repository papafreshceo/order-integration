// auth.js - 주문통합 시스템 인증 모듈

let currentUser = null;

// Auth 상태 변화 감지
auth.onAuthStateChanged((user) => {
    const initialLoading = document.getElementById('initialLoading');
    const loginScreen = document.getElementById('loginScreen');
    const mainSystem = document.getElementById('mainSystem');
    
    // 로딩 화면 숨기기
    setTimeout(() => {
        if (initialLoading) {
            initialLoading.classList.add('hide');
        }
        
        if (user) {
            // 로그인 상태
            currentUser = user;
            loginScreen.style.display = 'none';
            mainSystem.style.display = 'block';
            
            // 사용자 이메일 표시
            const userEmailElement = document.getElementById('userEmail');
            if (userEmailElement) {
                userEmailElement.textContent = user.email;
            }
            
            // 주문통합 앱 초기화 (script.js의 initializeApp 함수 호출)
            if (typeof initializeApp === 'function') {
                initializeApp();
            }
        } else {
            // 비로그인 상태
            currentUser = null;
            loginScreen.style.display = 'flex';
            mainSystem.style.display = 'none';
        }
    }, 500);
});

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
        showSuccess('Google 로그인 성공!');
    } catch (error) {
        console.error('Google login error:', error);
        showError(getErrorMessage(error.code));
    }
}

// 이메일 로그인
async function signInWithEmail() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // 유효성 검사
    if (!email || !password) {
        showError('이메일과 비밀번호를 입력하세요');
        return;
    }
    
    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('올바른 이메일 형식이 아닙니다');
        return;
    }
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        showSuccess('로그인 성공!');
        
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
    
    // 유효성 검사
    if (!name || !email || !password) {
        showSignupError('모든 필드를 입력하세요');
        return;
    }
    
    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showSignupError('올바른 이메일 형식이 아닙니다');
        return;
    }
    
    // 비밀번호 길이 검사
    if (password.length < 6) {
        showSignupError('비밀번호는 6자 이상이어야 합니다');
        return;
    }
    
    try {
        // Firebase 계정 생성
        const result = await auth.createUserWithEmailAndPassword(email, password);
        
        // 프로필 업데이트
        await result.user.updateProfile({
            displayName: name
        });
        
        // 성공 메시지 표시 후 로그인 화면으로 이동
        showSignupSuccess('회원가입 성공! 자동으로 로그인됩니다...');
        
        // 입력 필드 초기화
        document.getElementById('signupName').value = '';
        document.getElementById('signupEmail').value = '';
        document.getElementById('signupPassword').value = '';
        
        // 2초 후 로그인 화면으로 이동
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
            showSuccess('안전하게 로그아웃되었습니다');
        } catch (error) {
            console.error('로그아웃 오류:', error);
            showError('로그아웃 중 오류가 발생했습니다');
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
        'auth/popup-closed-by-user': '로그인 창이 닫혔습니다.'
    };
    return messages[code] || '오류가 발생했습니다. 다시 시도해주세요.';
}

// UI 함수들
function showError(message) {
    const errorElement = document.getElementById('errorMsg');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        errorElement.classList.add('show');
        
        // 5초 후 자동으로 숨기기
        setTimeout(() => {
            errorElement.classList.remove('show');
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 300);
        }, 5000);
    }
}

function showSignupError(message) {
    const errorElement = document.getElementById('signupErrorMsg');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        errorElement.classList.add('show');
        
        // 5초 후 자동으로 숨기기
        setTimeout(() => {
            errorElement.classList.remove('show');
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 300);
        }, 5000);
    }
}

function showSignupSuccess(message) {
    const errorElement = document.getElementById('signupErrorMsg');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.background = '#d4edda';
        errorElement.style.color = '#155724';
        errorElement.style.borderColor = '#c3e6cb';
        errorElement.style.display = 'block';
        errorElement.classList.add('show');
    }
}

function showSuccess(message) {
    // script.js의 showSuccess 함수 사용 또는 직접 구현
    console.log('Success:', message);
}

// 화면 전환 함수
function showSignUp() {
    document.getElementById('loginCard').style.display = 'none';
    document.getElementById('signupCard').style.display = 'block';
    
    // 에러 메시지 초기화
    const errorMsg = document.getElementById('errorMsg');
    if (errorMsg) {
        errorMsg.style.display = 'none';
        errorMsg.textContent = '';
    }
}

function showLogin() {
    document.getElementById('loginCard').style.display = 'block';
    document.getElementById('signupCard').style.display = 'none';
    
    // 에러 메시지 초기화
    const signupErrorMsg = document.getElementById('signupErrorMsg');
    if (signupErrorMsg) {
        signupErrorMsg.style.display = 'none';
        signupErrorMsg.textContent = '';
        // 스타일 초기화
        signupErrorMsg.style.background = '';
        signupErrorMsg.style.color = '';
        signupErrorMsg.style.borderColor = '';
    }
}

// 페이지 로드 시 엔터키 이벤트 추가
document.addEventListener('DOMContentLoaded', function() {
    // 로그인 폼 엔터키 처리
    const loginInputs = ['email', 'password'];
    loginInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('keypress', handleEnter);
        }
    });
    
    // 회원가입 폼 엔터키 처리
    const signupInputs = ['signupName', 'signupEmail', 'signupPassword'];
    signupInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('keypress', handleEnter);
        }
    });
});