// js/config/stats-config.js - 통계 설정

window.STATS_CONFIG = {
    'admin': [
        { label: '오늘 주문', value: 42, change: '+12%', positive: true },
        { label: '처리 대기', value: 8, change: '-2', positive: false },
        { label: '배송 중', value: 27, change: '+5', positive: true },
        { label: '완료', value: 156, change: '+23%', positive: true }
    ],
    'staff': [
        { label: '오늘 주문', value: 42, change: '+12%', positive: true },
        { label: '처리 대기', value: 8, change: '-2', positive: false }
    ]
};