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
        // 미사용 시간 기반 자동 로그아웃 설정
        initIdleLogout();
        
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
console.log('API 응답 result:', result);  // 추가
console.log('API 응답 user:', result.user);  // 추가

if (result.user) {
    currentUser = result.user;
    window.currentUser = currentUser;
    
    // localStorage에 사용자 이메일 저장
    localStorage.setItem('userEmail', currentUser.email);
    sessionStorage.setItem('userEmail', currentUser.email);
    
    console.log('설정된 currentUser:', currentUser);
    console.log('역할:', currentUser.role);
    console.log('localStorage에 저장된 이메일:', localStorage.getItem('userEmail'));
                
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
        
        // 역할 표시 추가/업데이트
const userInfo = document.querySelector('.user-info');
if (userInfo) {
    let roleSpan = document.getElementById('userRole');
    if (!roleSpan) {
        roleSpan = document.createElement('span');
        roleSpan.id = 'userRole';
        userInfo.insertBefore(roleSpan, userInfo.firstChild);
    }
    roleSpan.style.cssText = 'padding: 4px 8px; background: ' + 
        (currentUser.role === 'admin' ? '#dc3545' : '#6c757d') + 
        '; color: white; border-radius: 4px; font-size: 12px;';
    roleSpan.textContent = currentUser.role === 'admin' ? '관리자' : '스탭';
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

function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/invalid-email': '유효하지 않은 이메일 형식입니다.',
        // ... 생략 ...
    };
    
    return errorMessages[errorCode] || '로그인 중 오류가 발생했습니다.';
}

// 역할별 UI 조정 함수
function adjustUIByRole() {
    if (currentUser.role !== 'admin') {
        // 직원인 경우 탭 숨기기
        const settingsTab = document.querySelector('[data-tab="settings"]');
        const dashboardTab = document.querySelector('[data-tab="dashboard"]');
        const expenseTab = document.querySelector('[data-tab="expense"]');
        
        if (settingsTab) settingsTab.style.display = 'none';
        if (dashboardTab) dashboardTab.style.display = 'none';
        if (expenseTab) expenseTab.style.display = 'none';
        
        // 구글 시트 저장 버튼은 유지 (직원도 저장 가능)
    }
}


// ========== 미사용 시간 기반 자동 로그아웃 ==========
let lastActivityTime = Date.now();
const IDLE_TIMEOUT = 60 * 60 * 1000; // 1시간
const WARNING_TIME = 5 * 60 * 1000; // 5분 전 경고
let idleTimer = null;
let warningTimer = null;
let warningShown = false;
let countdownInterval = null;

// 활동 감지 이벤트
const activityEvents = [
    'mousedown',
    'mousemove',
    'keypress',
    'keydown',
    'scroll',
    'touchstart',
    'click',
    'input',
    'focus'
];

// 활동 감지 및 타이머 리셋
function resetIdleTimer() {
    lastActivityTime = Date.now();
    warningShown = false;
    
    // 경고 메시지 제거
    const warningEl = document.getElementById('idleWarning');
    if (warningEl) {
        warningEl.remove();
    }
    
    // 카운트다운 인터벌 정리
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    
    // 기존 타이머 정리
    if (idleTimer) clearTimeout(idleTimer);
    if (warningTimer) clearTimeout(warningTimer);
    
    // 경고 타이머 설정 (55분 후)
    warningTimer = setTimeout(() => {
        showIdleWarning();
    }, IDLE_TIMEOUT - WARNING_TIME);
    
    // 로그아웃 타이머 설정 (60분 후)
    idleTimer = setTimeout(() => {
        performIdleLogout();
    }, IDLE_TIMEOUT);
}

// 경고 메시지 표시
function showIdleWarning() {
    if (warningShown || !auth.currentUser) return;
    warningShown = true;
    
    const warningDiv = document.createElement('div');
    warningDiv.id = 'idleWarning';
    warningDiv.style.cssText = `
        position: fixed;
        top: 70px;
        right: 20px;
        background: #fff3cd;
        border: 1px solid #ffc107;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 350px;
        animation: slideIn 0.3s ease-out;
    `;
    
    warningDiv.innerHTML = `
        <style>
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        </style>
        <div style="display: flex; align-items: start; gap: 12px;">
            <div style="flex-shrink: 0; margin-top: 2px;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#f59e0b">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
            </div>
            <div style="flex: 1;">
                <div style="font-weight: 500; color: #856404; margin-bottom: 8px; font-size: 15px;">
                    자동 로그아웃 경고
                </div>
                <div style="font-size: 14px; color: #856404; margin-bottom: 12px; line-height: 1.4;">
                    장시간 미사용으로 5분 후 자동 로그아웃됩니다.<br>
                    계속 작업하시려면 아래 버튼을 클릭하세요.
                </div>
                <div id="countdown" style="font-size: 12px; color: #856404; margin-bottom: 12px;">
                    남은 시간: <span id="countdownTimer">5:00</span>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button onclick="resetIdleTimer()" style="
                        padding: 6px 16px;
                        background: #2563eb;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-size: 14px;
                        cursor: pointer;
                        font-weight: 400;
                    ">계속 작업</button>
                    <button onclick="performIdleLogout()" style="
                        padding: 6px 16px;
                        background: white;
                        color: #495057;
                        border: 1px solid #dee2e6;
                        border-radius: 6px;
                        font-size: 14px;
                        cursor: pointer;
                        font-weight: 300;
                    ">지금 로그아웃</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(warningDiv);
    
    // 카운트다운 표시
    let remainingSeconds = 300; // 5분
    countdownInterval = setInterval(() => {
        remainingSeconds--;
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        const timerEl = document.getElementById('countdownTimer');
        if (timerEl) {
            timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        if (remainingSeconds <= 0) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
    }, 1000);
}

// 자동 로그아웃 수행
function performIdleLogout() {
    // 타이머 정리
    if (idleTimer) clearTimeout(idleTimer);
    if (warningTimer) clearTimeout(warningTimer);
    if (countdownInterval) clearInterval(countdownInterval);
    
    // 이벤트 리스너 제거
    removeActivityListeners();
    
    // 로그아웃 수행
    auth.signOut().then(() => {
        alert('장시간 미사용으로 자동 로그아웃되었습니다. 다시 로그인해주세요.');
        location.reload();
    }).catch((error) => {
        console.error('자동 로그아웃 오류:', error);
        location.reload();
    });
}

// iframe 내부 활동도 감지
function attachIframeListeners() {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
        try {
            // iframe이 로드된 후 리스너 추가
            if (iframe.contentWindow && iframe.contentWindow.document) {
                activityEvents.forEach(event => {
                    iframe.contentWindow.document.addEventListener(event, resetIdleTimer, true);
                });
            }
            
            // iframe 로드 이벤트에도 리스너 추가
            iframe.addEventListener('load', function() {
                try {
                    activityEvents.forEach(event => {
                        iframe.contentWindow.document.addEventListener(event, resetIdleTimer, true);
                    });
                } catch(e) {
                    console.log('Cross-origin iframe detected, skipping activity listeners');
                }
            });
        } catch(e) {
            console.log('Cross-origin iframe detected, skipping activity listeners');
        }
    });
}

// 활동 리스너 추가
function addActivityListeners() {
    activityEvents.forEach(event => {
        document.addEventListener(event, resetIdleTimer, true);
    });
    
    // iframe 리스너도 추가
    setTimeout(attachIframeListeners, 1000);
    
    // 새로운 iframe이 추가될 때마다 리스너 재설정
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.tagName === 'IFRAME') {
                        setTimeout(attachIframeListeners, 500);
                    }
                });
            }
        });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
}

// 활동 리스너 제거
function removeActivityListeners() {
    activityEvents.forEach(event => {
        document.removeEventListener(event, resetIdleTimer);
    });
    
    // iframe 리스너도 제거
    document.querySelectorAll('iframe').forEach(iframe => {
        try {
            activityEvents.forEach(event => {
                iframe.contentWindow.document.removeEventListener(event, resetIdleTimer);
            });
        } catch(e) {
            // 크로스 오리진 iframe은 무시
        }
    });
}

// 탭 가시성 변경 감지
function handleVisibilityChange() {
    if (!document.hidden) {
        // 탭이 활성화됨
        const elapsed = Date.now() - lastActivityTime;
        if (elapsed >= IDLE_TIMEOUT) {
            // 시간이 초과되었으면 즉시 로그아웃
            performIdleLogout();
        } else if (elapsed >= IDLE_TIMEOUT - WARNING_TIME && !warningShown) {
            // 경고 시간대에 있으면 경고 표시
            showIdleWarning();
        } else {
            // 아직 시간이 남았으면 타이머 리셋
            resetIdleTimer();
        }
    }
}

// 자동 로그아웃 초기화
function initIdleLogout() {
    // 이전 리스너 정리
    removeActivityListeners();
    
    // 활동 리스너 추가
    addActivityListeners();
    
    // 탭 가시성 변경 감지
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 타이머 초기화
    resetIdleTimer();
    
    console.log('미사용 시간 기반 자동 로그아웃 활성화 (1시간)');
}

// 자동 로그아웃 중지 (로그아웃 시)
function stopIdleLogout() {
    if (idleTimer) clearTimeout(idleTimer);
    if (warningTimer) clearTimeout(warningTimer);
    if (countdownInterval) clearInterval(countdownInterval);
    removeActivityListeners();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
}

// auth 상태 변경 시 자동 로그아웃 관리
auth.onAuthStateChanged((user) => {
    if (!user) {
        stopIdleLogout();
    }
});

// 디버깅용 전역 객체
window.idleDebug = {
    getLastActivity: () => {
        const date = new Date(lastActivityTime);
        return date.toLocaleTimeString('ko-KR');
    },
    getRemainingTime: () => {
        const elapsed = Date.now() - lastActivityTime;
        const remaining = IDLE_TIMEOUT - elapsed;
        if (remaining <= 0) return '시간 초과';
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        return `${minutes}분 ${seconds}초`;
    },
    forceWarning: showIdleWarning,
    forceLogout: performIdleLogout,
    reset: resetIdleTimer,
    isActive: () => !!idleTimer
};

