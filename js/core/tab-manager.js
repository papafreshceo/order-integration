// js/core/tab-manager.js - 탭 관리 모듈

window.TabManager = {
    // 탭 메뉴 생성
    createMenu(role) {
        const tabMenu = document.getElementById('tabMenu');
        const menus = MENU_CONFIG[role];
        
        tabMenu.innerHTML = '';
        menus.forEach((menu, index) => {
            const button = document.createElement('button');
            button.className = 'tab-btn';
            button.textContent = menu.name;
            button.onclick = () => this.show(menu.id);
            
            if (index === 0) {
                button.classList.add('active');
            }
            
            tabMenu.appendChild(button);
        });
    },

    // 탭 전환
    show(tabId) {
        // 모든 탭 콘텐츠 숨기기
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // 모든 탭 버튼 비활성화
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 선택한 탭 표시
        const tabContent = document.getElementById(tabId);
        if (tabContent) {
            tabContent.classList.add('active');
            sessionStorage.setItem('currentTab', tabId);
        }
        
        // 선택한 버튼 활성화
        const buttons = document.querySelectorAll('.tab-btn');
        const menus = MENU_CONFIG[window.currentUserRole];
        const menuIndex = menus.findIndex(m => m.id === tabId);
        if (menuIndex !== -1 && buttons[menuIndex]) {
            buttons[menuIndex].classList.add('active');
        }
        
        // 탭별 데이터 로드
        this.loadTabData(tabId);
    },

    // 탭별 데이터 로드
    loadTabData(tabId) {
        switch(tabId) {
            case 'dashboard':
                DashboardModule.load();
                break;
            case 'realtime':
                RealtimeModule.load();
                break;
            case 'analytics':
                AnalyticsModule.load();
                break;
        }
    },

    // 마지막 탭 복원
    restoreLastTab() {
        const lastTab = sessionStorage.getItem('currentTab');
        if (lastTab) {
            const menus = MENU_CONFIG[window.currentUserRole];
            const hasAccess = menus.some(menu => menu.id === lastTab);
            if (hasAccess) {
                this.show(lastTab);
                return;
            }
        }
        // 기본값: 첫 번째 탭
        const firstTab = MENU_CONFIG[window.currentUserRole][0];
        this.show(firstTab.id);
    },

    // 현재 탭 새로고침
    refreshCurrent(event) {
        const activeTab = document.querySelector('.tab-content.active');
        if (!activeTab) return;
        
        const tabId = activeTab.id;
        const button = event?.target;
        
        if (button) {
            button.disabled = true;
            const originalText = button.textContent;
            button.textContent = '새로고침 중...';
            
            const restoreButton = () => {
                button.disabled = false;
                button.textContent = originalText;
            };
            
            this.executeRefresh(tabId).finally(restoreButton);
        } else {
            this.executeRefresh(tabId);
        }
    },

    // 탭별 새로고침 실행
    async executeRefresh(tabId) {
        console.log(`Refreshing tab: ${tabId}`);
        
        switch(tabId) {
            case 'dashboard':
                await DashboardModule.load();
                if (typeof ToastManager !== 'undefined') {
                    ToastManager.success('대시보드가 새로고침되었습니다');
                }
                break;
                
            case 'realtime':
                RealtimeModule.updateLastUpdateTime();
                await RealtimeModule.load();
                if (typeof ToastManager !== 'undefined') {
                    ToastManager.success('실시간 주문현황이 새로고침되었습니다');
                }
                break;
                
            case 'search':
                const startDate = document.getElementById('startDate').value;
                const endDate = document.getElementById('endDate').value;
                if (startDate && endDate) {
                    SearchModule.search();
                    if (typeof ToastManager !== 'undefined') {
                        ToastManager.success('검색 결과가 새로고침되었습니다');
                    }
                }
                break;
                
            case 'analytics':
                AnalyticsModule.load();
                if (typeof ToastManager !== 'undefined') {
                    ToastManager.success('통계 분석이 새로고침되었습니다');
                }
                break;
        }
    }
};

// 전역 함수로 등록
window.showTab = function(tabId) {
    TabManager.show(tabId);
};

window.createTabMenu = function(role) {
    TabManager.createMenu(role);
};

window.refreshCurrentTab = function(event) {
    TabManager.refreshCurrent(event);
};