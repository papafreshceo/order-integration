// auth.js

// 사용자 역할 정보 (실제로는 Google Sheets에서 가져와야 함)
const USER_ROLES = {
    'admin@company.com': 'admin',
    'manager@company.com': 'admin',
    'staff1@company.com': 'staff',
    'staff2@company.com': 'staff'
};

// 현재 사용자 정보
let currentUser = null;

// Auth 상태 변화 감지
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // 로그인 상태
        currentUser = user;
        const userRole = await getUserRole(user.email);
        showMainSystem(user, userRole);
    } else {
        // 로그아웃 상태
        currentUser = null;
        showLoginScreen();
    }
});

// 엔터키 처리
function handleEnter(event) {
    if (event.key === 'Enter') {
        signInWithEmail();
    }
}

// Google 로그인
async function signInWithGoogle() {
    try {
        const result = await auth.signInWithPopup(googleProvider);
        // 로그인 성공 - onAuthStateChanged에서 처리
    } catch (error) {
        showError('Google 로그인 실패: ' + error.message);
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
        // 로그인 성공 - onAuthStateChanged에서 처리
    } catch (error) {
        let errorMsg = '로그인 실패: ';
        switch(error.code) {
            case 'auth/user-not-found':
                errorMsg += '등록되지 않은 이메일입니다';
                break;
            case 'auth/wrong-password':
                errorMsg += '비밀번호가 올바르지 않습니다';
                break;
            case 'auth/invalid-email':
                errorMsg += '유효하지 않은 이메일 형식입니다';
                break;
            default:
                errorMsg += error.message;
        }
        showError(errorMsg);
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
        
        // 사용자 프로필 업데이트
        await result.user.updateProfile({
            displayName: name
        });
        
        // Google Sheets에 사용자 정보 저장 (API 호출)
        await saveUserToSheets(email, name, 'staff');
        
        showSignupError('회원가입 성공! 로그인 화면으로 이동합니다', 'success');
        setTimeout(() => showLogin(), 2000);
        
    } catch (error) {
        let errorMsg = '회원가입 실패: ';
        switch(error.code) {
            case 'auth/email-already-in-use':
                errorMsg += '이미 사용 중인 이메일입니다';
                break;
            case 'auth/invalid-email':
                errorMsg += '유효하지 않은 이메일 형식입니다';
                break;
            case 'auth/weak-password':
                errorMsg += '비밀번호가 너무 약합니다';
                break;
            default:
                errorMsg += error.message;
        }
        showSignupError(errorMsg);
    }
}

// 로그아웃
async function signOut() {
    try {
        await auth.signOut();
        // 로그아웃 성공 - onAuthStateChanged에서 처리
    } catch (error) {
        console.error('로그아웃 오류:', error);
    }
}

// 사용자 역할 가져오기
async function getUserRole(email) {
    // 실제로는 API를 통해 Google Sheets에서 가져와야 함
    try {
        const response = await fetch('/api/getUserRole', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.role;
        }
    } catch (error) {
        console.error('역할 조회 실패:', error);
    }
    
    // 임시로 하드코딩된 역할 반환
    return USER_ROLES[email] || 'staff';
}

// Google Sheets에 사용자 정보 저장
async function saveUserToSheets(email, name, role) {
    try {
        const response = await fetch('/api/saveUser', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                name,
                role,
                createdAt: new Date().toISOString()
            })
        });
        
        return response.ok;
    } catch (error) {
        console.error('사용자 저장 실패:', error);
        return false;
    }
}

// 에러 메시지 표시
function showError(message) {
    document.getElementById('errorMsg').textContent = message;
}

function showSignupError(message, type = 'error') {
    const msgElement = document.getElementById('signupErrorMsg');
    msgElement.textContent = message;
    if (type === 'success') {
        msgElement.style.background = 'rgba(16, 185, 129, 0.1)';
        msgElement.style.borderColor = 'rgba(16, 185, 129, 0.2)';
        msgElement.style.color = '#10b981';
    }
}

// 회원가입 화면 표시
function showSignUp() {
    document.querySelector('.login-card').style.display = 'none';
    document.getElementById('signupCard').style.display = 'block';
    document.getElementById('signupErrorMsg').textContent = '';
}

// 로그인 화면 표시
function showLogin() {
    document.querySelector('.login-card').style.display = 'block';
    document.getElementById('signupCard').style.display = 'none';
    document.getElementById('errorMsg').textContent = '';
}

// 로그인 화면 표시
function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainSystem').style.display = 'none';
}

// 메인 시스템 표시
function showMainSystem(user, role) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainSystem').style.display = 'block';
    
    // 사용자 정보 표시
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('userRole').textContent = role === 'admin' ? '관리자' : '직원';
    
    // 역할에 따른 UI 초기화
    initializeUIByRole(role);
}