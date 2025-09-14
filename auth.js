// auth.js - 로딩 상태 & 에러 처리 개선 버전

// 사용자 역할 정보
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
        currentUser = user;
        LoadingManager.showFullLoading();
        try {
            const userRole = await getUserRole(user.email);
            showMainSystem(user, userRole);
            ToastManager.success(`환영합니다, ${user.email}님!`);
        } catch (error) {
            ToastManager.error('사용자 정보를 불러올 수 없습니다.');
        } finally {
            LoadingManager.hideFullLoading();
        }
    } else {
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

// Google 로그인 - 개선된 버전
async function signInWithGoogle() {
    const button = event.target;
    LoadingManager.startButtonLoading(button, 'Google 로그인 중...');
    
    try {
        const result = await auth.signInWithPopup(googleProvider);
        ToastManager.success('로그인 성공!');
    } catch (error) {
        console.error('Google login error:', error);
        const errorMsg = ErrorHandler.getFirebaseErrorMessage(error.code);
        showError(errorMsg);
        ToastManager.error(errorMsg);
    } finally {
        LoadingManager.stopButtonLoading(button);
    }
}

// 이메일 로그인 - 개선된 버전
async function signInWithEmail() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const button = event.target;
    
    // 유효성 검사
    if (!email || !password) {
        showError('이메일과 비밀번호를 입력하세요');
        ToastManager.warning('모든 필드를 입력해주세요');
        return;
    }
    
    if (!ErrorHandler.validateEmail(email)) {
        showError('올바른 이메일 형식이 아닙니다');
        return;
    }
    
    LoadingManager.startButtonLoading(button, '로그인 중...');
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        ToastManager.success('로그인 성공!');
    } catch (error) {
        console.error('Email login error:', error);
        const errorMsg = ErrorHandler.getFirebaseErrorMessage(error.code);
        showError(errorMsg);
        ToastManager.error(errorMsg);
    } finally {
        LoadingManager.stopButtonLoading(button);
    }
}

// 회원가입 - 개선된 버전
async function signUp() {
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const button = event.target;
    
    // 유효성 검사
    if (!name || !email || !password) {
        showSignupError('모든 필드를 입력하세요');
        ToastManager.warning('모든 필드를 입력해주세요');
        return;
    }
    
    if (!ErrorHandler.validateEmail(email)) {
        showSignupError('올바른 이메일 형식이 아닙니다');
        return;
    }
    
    if (!ErrorHandler.validatePassword(password)) {
        showSignupError('비밀번호는 6자 이상이어야 합니다');
        return;
    }
    
    LoadingManager.startButtonLoading(button, '계정 생성 중...');
    
    try {
        // Firebase 계정 생성
        const result = await auth.createUserWithEmailAndPassword(email, password);
        
        // 프로필 업데이트
        await result.user.updateProfile({
            displayName: name
        });
        
        // Google Sheets에 저장
        const saved = await saveUserToSheets(email, name, 'staff');
        
        if (saved) {
            showSignupError('회원가입 성공! 로그인 화면으로 이동합니다', 'success');
            ToastManager.success('회원가입이 완료되었습니다!');
            setTimeout(() => showLogin(), 2000);
        } else {
            ToastManager.warning('계정은 생성되었지만 추가 정보 저장에 실패했습니다.');
        }
        
    } catch (error) {
        console.error('Signup error:', error);
        const errorMsg = ErrorHandler.getFirebaseErrorMessage(error.code);
        showSignupError(errorMsg);
        ToastManager.error(errorMsg);
    } finally {
        LoadingManager.stopButtonLoading(button);
    }
}

// 로그아웃 - 개선된 버전
async function signOut() {
    const button = event.target;
    LoadingManager.startButtonLoading(button, '로그아웃 중...');
    
    try {
        await auth.signOut();
        ToastManager.info('안전하게 로그아웃되었습니다');
    } catch (error) {
        console.error('로그아웃 오류:', error);
        ToastManager.error('로그아웃 중 오류가 발생했습니다');
    } finally {
        LoadingManager.stopButtonLoading(button);
    }
}

// 사용자 역할 가져오기 - 개선된 버전
async function getUserRole(email) {
    try {
        const data = await apiCall('/api/auth', {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'getUserRole',
                email: email
            })
        });
        
        console.log('User role data:', data);
        return data.role || 'staff';
        
    } catch (error) {
        console.error('역할 조회 실패:', error);
        ToastManager.warning('사용자 권한을 확인할 수 없어 기본 권한으로 설정됩니다.');
        return USER_ROLES[email] || 'staff';
    }
}

// Google Sheets에 사용자 정보 저장 - 개선된 버전
async function saveUserToSheets(email, name, role) {
    try {
        const data = await apiCall('/api/auth', {
            method: 'POST',
            body: JSON.stringify({
                action: 'saveUser',
                email: email,
                name: name,
                role: role,
                createdAt: new Date().toISOString()
            })
        });
        
        return data.success;
        
    } catch (error) {
        console.error('사용자 저장 실패:', error);
        const errorMsg = ErrorHandler.handleApiError(error);
        ToastManager.error(errorMsg);
        return false;
    }
}

// 에러 메시지 표시 개선
function showError(message) {
    const errorElement = document.getElementById('errorMsg');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    errorElement.classList.add('shake');
    
    setTimeout(() => {
        errorElement.classList.remove('shake');
    }, 500);
}

function showSignupError(message, type = 'error') {
    const msgElement = document.getElementById('signupErrorMsg');
    msgElement.textContent = message;
    msgElement.style.display = 'block';
    
    if (type === 'success') {
        msgElement.style.background = 'rgba(16, 185, 129, 0.1)';
        msgElement.style.borderColor = 'rgba(16, 185, 129, 0.2)';
        msgElement.style.color = '#10b981';
    } else {
        msgElement.classList.add('shake');
        setTimeout(() => {
            msgElement.classList.remove('shake');
        }, 500);
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
    
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('userRole').textContent = role === 'admin' ? '관리자' : '직원';
    
    initializeUIByRole(role);
}
