// js/core/auto-refresh.js - 자동 새로고침 모듈

window.AutoRefreshModule = {
    interval: null,

    // 자동 새로고침 시작
    start(minutes = 5) {
        if (this.interval) {
            clearInterval(this.interval);
        }
        
        this.interval = setInterval(() => {
            const activeTab = document.querySelector('.tab-content.active');
            if (activeTab && activeTab.id === 'realtime') {
                RealtimeModule.refresh();
            }
        }, minutes * 60 * 1000);
        
        console.log(`자동 새로고침 시작: ${minutes}분 간격`);
    },

    // 자동 새로고침 중지
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            console.log('자동 새로고침 중지');
        }
    }
};

// 전역 함수로 등록
window.startAutoRefresh = function(minutes) {
    AutoRefreshModule.start(minutes);
};

window.stopAutoRefresh = function() {
    AutoRefreshModule.stop();
};