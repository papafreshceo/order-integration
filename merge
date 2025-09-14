// app.js - 메인 애플리케이션

// 전역 상태
window.currentUserRole = 'staff';

// UI 초기화
function initializeUIByRole(role) {
    window.currentUserRole = role;
    
    // 탭 메뉴 생성
    if (typeof TabManager !== 'undefined') {
        TabManager.createMenu(role);
        TabManager.restoreLastTab();
    }
}

// 페이지 로드 시 초기화
window.addEventListener('DOMContentLoaded', () => {
    console.log('App.js loaded successfully');
    
    // 자동 새로고침 시작 (5분)
    if (typeof AutoRefreshModule !== 'undefined') {
        AutoRefreshModule.start(5);
    }
    
    // 브라우저 새로고침 시 현재 탭 유지
    window.addEventListener('beforeunload', () => {
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab) {
            sessionStorage.setItem('currentTab', activeTab.id);
        }
    });
    
    // F5 키 이벤트 처리 (이벤트 캡처링 사용)
    document.addEventListener('keydown', (e) => {
        // F5 키
        if (e.key === 'F5' || e.keyCode === 116) {
            e.preventDefault();
            e.stopPropagation();
            
            // 현재 탭 새로고침
            if (typeof TabManager !== 'undefined') {
                TabManager.refreshCurrent();
            }
            return false;
        }
        
        // Ctrl+R 또는 Cmd+R
        if ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R')) {
            e.preventDefault();
            e.stopPropagation();
            
            // 현재 탭 새로고침
            if (typeof TabManager !== 'undefined') {
                TabManager.refreshCurrent();
            }
            return false;
        }
    }, true); // true를 추가하여 캡처 단계에서 이벤트 처리
});

// 전역 새로고침 함수 (디버깅용)
window.refreshPage = function() {
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab) {
        console.log('Refreshing tab:', activeTab.id);
        if (typeof TabManager !== 'undefined') {
            TabManager.refreshCurrent();
        }
    }
};

// 탭 전환 헬퍼 함수
window.showTab = function(tabId) {
    if (typeof TabManager !== 'undefined') {
        TabManager.show(tabId);
    }
};

// 현재 탭 새로고침 헬퍼 함수
window.refreshCurrentTab = function(event) {
    if (typeof TabManager !== 'undefined') {
        TabManager.refreshCurrent(event);
    }
};
