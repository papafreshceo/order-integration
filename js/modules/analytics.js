// js/modules/analytics.js - 통계 분석 모듈

window.AnalyticsModule = {
    // 통계 데이터 로드
    load() {
        // 통계 데이터 새로고침 로직
        const statsGrid = document.querySelector('#analytics .stats-grid');
        if (statsGrid) {
            const statCards = statsGrid.querySelectorAll('.stat-card');
            statCards.forEach(card => {
                const valueElement = card.querySelector('.stat-value');
                if (valueElement) {
                    // 애니메이션 효과
                    valueElement.style.opacity = '0.5';
                    setTimeout(() => {
                        valueElement.style.opacity = '1';
                    }, 300);
                }
            });
        }
    }
};