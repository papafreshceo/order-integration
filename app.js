// app.js - 메인 애플리케이션 (축소 버전)

// 전역 상태
window.currentUserRole = 'staff';

// UI 초기화
function initializeUIByRole(role) {
    window.currentUserRole = role;
    
    // 탭 메뉴 생성
    TabManager.createMenu(role);
    
    // 마지막 탭 복원 또는 첫 번째 탭 활성화
    TabManager.restoreLastTab();
}

// 페이지 로드 시 초기화
window.addEventListener('DOMContentLoaded', () => {
    console.log('App.js loaded successfully');
    
    // 자동 새로고침 시작 (5분)
    AutoRefreshModule.start(5);
    
    // 브라우저 새로고침 시 현재 탭 유지
    window.addEventListener('beforeunload', () => {
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab) {
            sessionStorage.setItem('currentTab', activeTab.id);
        }
    });
    
    // F5 또는 Ctrl+R 키 이벤트 처리
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
            e.preventDefault();
            TabManager.refreshCurrent();
        }
    });
});