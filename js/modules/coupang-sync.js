// js/modules/coupang-sync.js - 쿠팡 동기화 모듈

window.CoupangSyncModule = {
    syncInterval: null,

    // 쿠팡 주문 가져오기
    async fetchOrders(event) {
        const button = event?.target;
        
        if (typeof LoadingManager !== 'undefined' && button) {
            LoadingManager.startButtonLoading(button, '쿠팡 주문 가져오는 중...');
        }
        
        try {
            const response = await fetch('/api/coupang', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'fetch',
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date().toISOString().split('T')[0]
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                if (typeof ToastManager !== 'undefined') {
                    ToastManager.success(data.message);
                }
                
                // 현재 활성 탭 새로고침
                const activeTab = document.querySelector('.tab-content.active');
                if (activeTab) {
                    const tabId = activeTab.id;
                    if (tabId === 'dashboard') {
                        DashboardModule.load();
                    } else if (tabId === 'realtime') {
                        RealtimeModule.load();
                    }
                }
            } else {
                if (typeof ToastManager !== 'undefined') {
                    ToastManager.error('쿠팡 주문 동기화 실패');
                }
            }
        } catch (error) {
            console.error('쿠팡 동기화 오류:', error);
            if (typeof ToastManager !== 'undefined') {
                ToastManager.error('네트워크 오류가 발생했습니다');
            }
        } finally {
            if (typeof LoadingManager !== 'undefined' && button) {
                LoadingManager.stopButtonLoading(button);
            }
        }
    },

    // 즉시 동기화
    async syncNow(event) {
        const button = event?.target;
        const statusElement = document.getElementById('coupangSyncStatus');
        
        if (button) {
            button.disabled = true;
            button.textContent = '동기화 중...';
        }
        if (statusElement) {
            statusElement.textContent = '동기화 중';
            statusElement.style.color = '#f59e0b';
        }
        
        try {
            const response = await fetch('/api/coupang', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'fetch',
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date().toISOString().split('T')[0]
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                if (statusElement) {
                    statusElement.textContent = '동기화 완료';
                    statusElement.style.color = '#10b981';
                }
                
                if (typeof ToastManager !== 'undefined') {
                    ToastManager.success(`쿠팡 주문 ${data.orders ? data.orders.length : 0}건 동기화 완료`);
                }
                
                await RealtimeModule.load();
                
            } else {
                if (statusElement) {
                    statusElement.textContent = '동기화 실패';
                    statusElement.style.color = '#ef4444';
                }
                
                if (typeof ToastManager !== 'undefined') {
                    ToastManager.error('쿠팡 동기화 실패');
                }
            }
        } catch (error) {
            console.error('쿠팡 동기화 오류:', error);
            if (statusElement) {
                statusElement.textContent = '오류 발생';
                statusElement.style.color = '#ef4444';
            }
            
            if (typeof ToastManager !== 'undefined') {
                ToastManager.error('네트워크 오류가 발생했습니다');
            }
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = '쿠팡 동기화';
            }
            
            setTimeout(() => {
                if (statusElement) {
                    statusElement.textContent = '대기';
                    statusElement.style.color = '#6c757d';
                }
            }, 3000);
        }
    },

    // 자동 동기화 시작
    startAutoSync() {
        this.syncInterval = setInterval(() => {
            this.fetchOrders();
        }, 5 * 60 * 1000);
        
        this.fetchOrders();
    },

    // 자동 동기화 중지
    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    },

    // 자동 동기화 토글
    toggleAutoSync(checkbox) {
        if (checkbox.checked) {
            this.startAutoSync();
            if (typeof ToastManager !== 'undefined') {
                ToastManager.info('쿠팡 자동 동기화가 시작되었습니다 (5분 간격)');
            }
        } else {
            this.stopAutoSync();
            if (typeof ToastManager !== 'undefined') {
                ToastManager.info('쿠팡 자동 동기화가 중지되었습니다');
            }
        }
    }
};

// 전역 함수로 등록
window.fetchCoupangOrders = function(event) {
    CoupangSyncModule.fetchOrders(event);
};

window.syncCoupangNow = function(event) {
    CoupangSyncModule.syncNow(event);
};

window.toggleCoupangAutoSync = function(checkbox) {
    CoupangSyncModule.toggleAutoSync(checkbox);
};