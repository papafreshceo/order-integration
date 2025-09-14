// utils.js - 로딩 상태 & 에러 처리 유틸리티

// 로딩 상태 관리
const LoadingManager = {
    // 버튼 로딩 시작
    startButtonLoading(button, loadingText = '처리 중...') {
        if (!button) return;
        
        button.disabled = true;
        button.classList.add('btn-loading');
        button.dataset.originalText = button.textContent;
        button.textContent = loadingText;
    },
    
    // 버튼 로딩 종료
    stopButtonLoading(button) {
        if (!button) return;
        
        button.disabled = false;
        button.classList.remove('btn-loading');
        if (button.dataset.originalText) {
            button.textContent = button.dataset.originalText;
            delete button.dataset.originalText;
        }
    },
    
    // 전체 화면 로딩 표시
    showFullLoading() {
        let overlay = document.getElementById('loadingOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = '<div class="loading-spinner"></div>';
            document.body.appendChild(overlay);
        }
        overlay.style.display = 'flex';
    },
    
    // 전체 화면 로딩 숨김
    hideFullLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
};

// 토스트 메시지 관리
const ToastManager = {
    show(message, type = 'info', duration = 3000) {
        // 기존 토스트 제거
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        // 새 토스트 생성
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // 자동 제거
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },
    
    success(message) {
        this.show(message, 'success');
    },
    
    error(message) {
        this.show(message, 'error');
    },
    
    warning(message) {
        this.show(message, 'warning');
    },
    
    info(message) {
        this.show(message, 'info');
    }
};

// 에러 처리 헬퍼
const ErrorHandler = {
    // Firebase 에러 메시지 한글화
    getFirebaseErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': '등록되지 않은 이메일입니다.',
            'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
            'auth/invalid-email': '유효하지 않은 이메일 형식입니다.',
            'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
            'auth/weak-password': '비밀번호는 6자 이상이어야 합니다.',
            'auth/network-request-failed': '네트워크 연결을 확인해주세요.',
            'auth/too-many-requests': '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.',
            'auth/user-disabled': '비활성화된 계정입니다.',
            'auth/operation-not-allowed': '이 작업은 허용되지 않습니다.',
            'auth/popup-closed-by-user': '로그인 창이 닫혔습니다.',
            'auth/unauthorized-domain': '승인되지 않은 도메인입니다.'
        };
        
        return errorMessages[errorCode] || '오류가 발생했습니다. 다시 시도해주세요.';
    },
    
    // API 에러 처리
    handleApiError(error) {
        console.error('API Error:', error);
        
        if (error.message === 'Failed to fetch') {
            return '서버와 연결할 수 없습니다. 네트워크를 확인해주세요.';
        }
        
        if (error.status === 404) {
            return '요청한 정보를 찾을 수 없습니다.';
        }
        
        if (error.status === 500) {
            return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        }
        
        return error.message || '알 수 없는 오류가 발생했습니다.';
    },
    
    // 입력 유효성 검사
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    validatePassword(password) {
        return password && password.length >= 6;
    }
};

// API 호출 래퍼 (재시도 로직 포함)
async function apiCall(url, options = {}, retries = 3) {
    let lastError;
    
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            lastError = error;
            
            // 재시도 전 대기
            if (i < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }
    
    throw lastError;
}

// 디바운스 함수 (연속 호출 방지)
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
