// js/core/auto-refresh.js - 자동 새로고침 모듈

window.AutoRefreshModule = {
    interval: null,
    isEnabled: false,

    // 자동 새로고침 시작
    start(minutes = 5) {
        if (this.interval) {
            clearInterval(this.interval);
        }
        
        this.isEnabled = true;
        this.interval = setInterval(() => {
            if (this.isEnabled) {
                const activeTab = document.querySelector('.tab-content.active');
                if (activeTab && activeTab.id === 'realtime') {
                    if (typeof RealtimeModule !== 'undefined') {
                        console.log('Auto-refreshing realtime data...');
                        RealtimeModule.refresh();
                    }
                }
            }
        }, minutes * 60 * 1000);
        
        console.log(`자동 새로고침 시작: ${minutes}분 간격`);
    },

    // 자동 새로고침 중지
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            this.isEnabled = false;
            console.log('자동 새로고침 중지');
        }
    },

    // 자동 새로고침 토글
    toggle() {
        if (this.isEnabled) {
            this.stop();
        } else {
            this.start();
        }
        return this.isEnabled;
    },

    // 간격 변경
    changeInterval(minutes) {
        if (this.isEnabled) {
            this.stop();
            this.start(minutes);
        }
    },

    // 상태 확인
    getStatus() {
        return {
            enabled: this.isEnabled,
            interval: this.interval
        };
    }
};

// 전역 함수로 등록
window.startAutoRefresh = function(minutes) {
    AutoRefreshModule.start(minutes);
};

window.stopAutoRefresh = function() {
    AutoRefreshModule.stop();
};

window.toggleAutoRefresh = function() {
    return AutoRefreshModule.toggle();
};
