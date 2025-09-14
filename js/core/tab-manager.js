// js/core/tab-manager.js - 탭 관리 모듈

window.TabManager = {
    // 탭 메뉴 생성
    createMenu(role) {
        const tabMenu = document.getElementById('tabMenu');
        if (!tabMenu) return;
        
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
                if (typeof DashboardModule !== 'undefined') {
                    DashboardModule.load();
                }
                break;
            case 'realtime':
                if (typeof RealtimeModule !== 'undefined') {
                    RealtimeModule.load();
                }
                break;
            case 'search':
                // 검색 탭은 초기 로드 없음
                break;
            case 'merge':
                // 주문통합 탭 초기화 확인
                if (typeof MergeModule !== 'undefined') {
                    if (!MergeModule.isInitialized()) {
                        MergeModule.initialize();
                    }
                    // 파일 목록이 있으면 재표시
                    if (MergeModule.uploadedFiles && MergeModule.uploadedFiles.length > 0) {
                        MergeModule.updateFileList();
                    }
                }
                break;
            case 'invoice':
                // 송장등록 탭은 초기 로드 없음
                break;
            case 'analytics':
                if (typeof AnalyticsModule !== 'undefined') {
                    AnalyticsModule.load();
                }
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
        if (firstTab) {
            this.show(firstTab.id);
        }
    },

    // 현재 탭 새로고침
    refreshCurrent(event) {
        const activeTab = document.querySelector('.tab-content.active');
        if (!activeTab) {
            console.log('No active tab to refresh');
            return;
        }
        
        const tabId = activeTab.id;
        console.log('Refreshing tab:', tabId);
        
        // 이벤트가 버튼 클릭인 경우
        if (event && event.target && event.target.tagName === 'BUTTON') {
            const button = event.target;
            button.disabled = true;
            const originalText = button.textContent;
            button.textContent = '새로고침 중...';
            
            this.executeRefresh(tabId).finally(() => {
                button.disabled = false;
                button.textContent = originalText;
            });
        } else {
            // F5 키 등으로 호출된 경우
            this.executeRefresh(tabId);
        }
    },

    // 탭별 새로고침 실행
    async executeRefresh(tabId) {
        console.log(`Executing refresh for tab: ${tabId}`);
        
        try {
            switch(tabId) {
                case 'dashboard':
                    if (typeof DashboardModule !== 'undefined') {
                        await DashboardModule.load();
                    }
                    if (typeof ToastManager !== 'undefined') {
                        ToastManager.success('대시보드가 새로고침되었습니다');
                    }
                    break;
                    
                case 'realtime':
                    if (typeof RealtimeModule !== 'undefined') {
                        RealtimeModule.updateLastUpdateTime();
                        await RealtimeModule.load();
                    }
                    if (typeof ToastManager !== 'undefined') {
                        ToastManager.success('실시간 주문현황이 새로고침되었습니다');
                    }
                    break;
                    
                case 'search':
                    const startDate = document.getElementById('startDate');
                    const endDate = document.getElementById('endDate');
                    
                    if (startDate && endDate && startDate.value && endDate.value) {
                        if (typeof SearchModule !== 'undefined') {
                            SearchModule.search();
                        }
                        if (typeof ToastManager !== 'undefined') {
                            ToastManager.success('검색 결과가 새로고침되었습니다');
                        }
                    } else {
                        // 날짜가 선택되지 않은 경우
                        const today = new Date().toISOString().split('T')[0];
                        if (startDate) startDate.value = today;
                        if (endDate) endDate.value = today;
                        
                        if (typeof SearchModule !== 'undefined') {
                            SearchModule.search();
                        }
                        if (typeof ToastManager !== 'undefined') {
                            ToastManager.info('오늘 날짜로 조회했습니다');
                        }
                    }
                    break;
                    
                case 'merge':
                    // 주문통합 탭 새로고침 - refresh 메서드 호출
                    if (typeof MergeModule !== 'undefined') {
                        await MergeModule.refresh();
                        
                        if (typeof ToastManager !== 'undefined') {
                            ToastManager.success('주문통합 화면이 새로고침되었습니다');
                        }
                    }
                    break;
                    
                case 'invoice':
                    // 송장등록 탭 새로고침 - 입력 필드 초기화
                    const orderNo = document.getElementById('orderNo');
                    const invoiceNo = document.getElementById('invoiceNo');
                    const invoiceResult = document.getElementById('invoiceResult');
                    
                    if (orderNo) orderNo.value = '';
                    if (invoiceNo) invoiceNo.value = '';
                    if (invoiceResult) invoiceResult.innerHTML = '';
                    
                    if (typeof ToastManager !== 'undefined') {
                        ToastManager.success('송장등록 화면이 초기화되었습니다');
                    }
                    break;
                    
                case 'analytics':
                    if (typeof AnalyticsModule !== 'undefined') {
                        AnalyticsModule.load();
                    }
                    if (typeof ToastManager !== 'undefined') {
                        ToastManager.success('통계 분석이 새로고침되었습니다');
                    }
                    break;
                    
                default:
                    // 알 수 없는 탭인 경우 페이지 자체를 새로고침
                    console.log(`Unknown tab: ${tabId}, reloading the tab content`);
                    this.loadTabData(tabId);
                    
                    if (typeof ToastManager !== 'undefined') {
                        ToastManager.info('화면이 새로고침되었습니다');
                    }
            }
        } catch (error) {
            console.error('Refresh error:', error);
            if (typeof ToastManager !== 'undefined') {
                ToastManager.error('새로고침 중 오류가 발생했습니다');
            }
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
