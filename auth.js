// ===========================
// 사용자 권한 관련 변수
// ===========================
let currentUser = {
    email: '',
    name: '',
    role: 'staff',  // 기본값 staff
    status: 'active'
};

window.currentUser = currentUser;  // 다른 모듈에서 접근 가능하도록

// ===========================
// 인증 관련 함수들
// ===========================

// 로그인 상태 확인
auth.onAuthStateChanged(async (user) => {
    // 초기 로딩 숨기기
    document.getElementById('initialLoading').style.display = 'none';
    
    if (user) {
        // 사용자 권한 확인
        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'checkUser',
                    email: user.email,
                    userData: {
                        name: user.displayName || user.email.split('@')[0]
                    }
                })
            });
            
            const result = await response.json();
            
            if (result.user) {
                currentUser = result.user;
                window.currentUser = currentUser;
                
                // 역할별 UI 조정
                adjustUIByRole();
            }
        } catch (error) {
            console.error('사용자 권한 확인 오류:', error);
            // 오류 시 기본값 staff
            currentUser.email = user.email;
            currentUser.name = user.displayName || user.email.split('@')[0];
            currentUser.role = 'staff';
            window.currentUser = currentUser;
        }
        
        // 로그인된 상태
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainSystem').style.display = 'block';
        document.getElementById('userEmail').textContent = user.email;
        
        // 역할 표시 추가
        const userInfo = document.querySelector('.user-info');
        if (userInfo && !document.getElementById('userRole')) {
            const roleSpan = document.createElement('span');
            roleSpan.id = 'userRole';
            roleSpan.style.cssText = 'padding: 4px 8px; background: ' + 
                (currentUser.role === 'admin' ? '#dc3545' : '#6c757d') + 
                '; color: white; border-radius: 4px; font-size: 12px;';
            roleSpan.textContent = currentUser.role === 'admin' ? '관리자' : '직원';
            userInfo.insertBefore(roleSpan, userInfo.firstChild);
        }
        
        // 메인 시스템 초기화는 script.js에서 처리
    } else {
        // 로그아웃 상태
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('mainSystem').style.display = 'none';
        currentUser = { email: '', name: '', role: 'staff', status: 'active' };
        window.currentUser = currentUser;
    }
});



// 이메일 로그인
function signInWithEmail() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showAuthError('이메일과 비밀번호를 입력해주세요.');
        return;
    }
    
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('로그인 성공:', userCredential.user.email);
            hideAuthError();
        })
        .catch((error) => {
            console.error('로그인 오류:', error);
            showAuthError(getErrorMessage(error.code));
        });
}

// Google 로그인
function signInWithGoogle() {
    auth.signInWithPopup(googleProvider)
        .then((result) => {
            console.log('Google 로그인 성공:', result.user.email);
            hideAuthError();
        })
        .catch((error) => {
            console.error('Google 로그인 오류:', error);
            showAuthError(getErrorMessage(error.code));
        });
}

// 회원가입
function signUp() {
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    if (!name || !email || !password) {
        showSignupError('모든 필드를 입력해주세요.');
        return;
    }
    
    if (password.length < 6) {
        showSignupError('비밀번호는 6자 이상이어야 합니다.');
        return;
    }
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // 사용자 프로필 업데이트
            return userCredential.user.updateProfile({
                displayName: name
            });
        })
        .then(() => {
            console.log('회원가입 성공');
            hideSignupError();
            showLogin();
        })
        .catch((error) => {
            console.error('회원가입 오류:', error);
            showSignupError(getErrorMessage(error.code));
        });
}

// 로그아웃
function signOut() {
    auth.signOut()
        .then(() => {
            console.log('로그아웃 성공');
        })
        .catch((error) => {
            console.error('로그아웃 오류:', error);
        });
}

// 엔터키 처리
function handleEnter(event) {
    if (event.key === 'Enter') {
        signInWithEmail();
    }
}

// 로그인/회원가입 전환
function showLogin() {
    document.getElementById('loginCard').style.display = 'block';
    document.getElementById('signupCard').style.display = 'none';
    hideAuthError();
    hideSignupError();
}

function showSignUp() {
    document.getElementById('loginCard').style.display = 'none';
    document.getElementById('signupCard').style.display = 'block';
    hideAuthError();
    hideSignupError();
}

// 에러 메시지 표시
function showAuthError(message) {
    const errorElement = document.getElementById('errorMsg');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function hideAuthError() {
    document.getElementById('errorMsg').style.display = 'none';
}

function showSignupError(message) {
    const errorElement = document.getElementById('signupErrorMsg');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function hideSignupError() {
    document.getElementById('signupErrorMsg').style.display = 'none';
}

// Firebase 에러 메시지 변환
function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/invalid-email': '유효하지 않은 이메일 형식입니다.',
        'auth/user-disabled': '비활성화된 계정입니다.',
        'auth/user-not-found': '존재하지 않는 계정입니다.',
        'auth/wrong-password': '잘못된 비밀번호입니다.',
        'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
        'auth/weak-password': '비밀번호가 너무 약합니다.',
        'auth/operation-not-allowed': '이 작업은 허용되지 않습니다.',
        'auth/popup-closed-by-user': '로그인 창이 닫혔습니다.',
        'auth/network-request-failed': '네트워크 오류가 발생했습니다.',
        'auth/too-many-requests': '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
        'auth/invalid-credential': '이메일 또는 비밀번호가 잘못되었습니다.',
        'auth/account-exists-with-different-credential': '다른 로그인 방법으로 이미 가입된 이메일입니다.'
    };
    
    return errorMessages[errorCode] || '로그인 중 오류가 발생했습니다.';
}

