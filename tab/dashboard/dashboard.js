// tab/dashboard/dashboard.js
const DashboardModule = (function() {
    'use strict';
    
    // 상태 관리
    const state = {
        initialized: false,
        currentDate: new Date(),
        selectedDate: null,
        deliveryData: {},
        statisticsData: {},
        chartData: {}
    };
    
    // 초기화 함수
    function init() {
        if (state.initialized) return;
        
        renderDashboard();
        attachEventListeners();
        loadDashboardData();
        state.initialized = true;
    }
    
    // 대시보드 전체 렌더링
    function renderDashboard() {
        const dashboardTab = document.getElementById('dashboard-tab');
        if (!dashboardTab) return;
        
        dashboardTab.innerHTML = `
            <!-- 상단 통계 카드 섹션 -->
            <div class="dashboard-stats-container">
                <div class="stats-card">
                    <div class="stats-icon" style="background: var(--blue-100); color: var(--brand-primary);">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                    </div>
                    <div class="stats-content">
                        <div class="stats-label">오늘 주문</div>
                        <div class="stats-value" id="todayOrders">0</div>
                        <div class="stats-change positive">+12% 전일 대비</div>
                    </div>
                </div>
                
                <div class="stats-card">
                    <div class="stats-icon" style="background: var(--success-bg); color: var(--success);">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="16 12 12 8 8 12"></polyline>
                            <line x1="12" y1="16" x2="12" y2="8"></line>
                        </svg>
                    </div>
                    <div class="stats-content">
                        <div class="stats-label">발송 완료</div>
                        <div class="stats-value" id="completedShipping">0</div>
                        <div class="stats-change positive">+8% 전주 대비</div>
                    </div>
                </div>
                
                <div class="stats-card">
                    <div class="stats-icon" style="background: var(--yellow-100); color: var(--warning);">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                        </svg>
                    </div>
                    <div class="stats-content">
                        <div class="stats-label">처리 대기</div>
                        <div class="stats-value" id="pendingOrders">0</div>
                        <div class="stats-change negative">-5% 감소</div>
                    </div>
                </div>
                
                <div class="stats-card">
                    <div class="stats-icon" style="background: var(--purple-100); color: var(--brand-primary);">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    </div>
                    <div class="stats-content">
                        <div class="stats-label">이번 달 총 주문</div>
                        <div class="stats-value" id="monthlyOrders">0</div>
                        <div class="stats-change positive">+15% 성장</div>
                    </div>
                </div>
            </div>
            
            <!-- 중단 섹션: 배송 현황과 캘린더 -->
            <div class="dashboard-middle-container">
                <!-- 배송 현황 카드 -->
                <div class="delivery-status-card">
                    <div class="card-header">
                        <h3 class="card-title">배송 현황</h3>
                        <button class="btn-refresh" onclick="DashboardModule.refreshDeliveryStatus()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="23 4 23 10 17 10"></polyline>
                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="delivery-status-content">
                        <div class="delivery-item">
                            <div class="delivery-label">
                                <span class="delivery-dot" style="background: var(--brand-primary);"></span>
                                접수
                            </div>
                            <div class="delivery-count" id="deliveryReceived">0</div>
                        </div>
                        <div class="delivery-progress">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dee2e6" stroke-width="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </div>
                        
                        <div class="delivery-item">
                            <div class="delivery-label">
                                <span class="delivery-dot" style="background: var(--warning);"></span>
                                처리중
                            </div>
                            <div class="delivery-count" id="deliveryProcessing">0</div>
                        </div>
                        <div class="delivery-progress">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dee2e6" stroke-width="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </div>
                        
                        <div class="delivery-item">
                            <div class="delivery-label">
                                <span class="delivery-dot" style="background: var(--info);"></span>
                                배송중
                            </div>
                            <div class="delivery-count" id="deliveryShipping">0</div>
                        </div>
                        <div class="delivery-progress">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dee2e6" stroke-width="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </div>
                        
                        <div class="delivery-item">
                            <div class="delivery-label">
                                <span class="delivery-dot" style="background: var(--success);"></span>
                                완료
                            </div>
                            <div class="delivery-count" id="deliveryCompleted">0</div>
                        </div>
                    </div>
                    
                    <div class="delivery-summary">
                        <div class="summary-row">
                            <span class="summary-label">전체 진행률</span>
                            <span class="summary-value">78%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 78%;"></div>
                        </div>
                    </div>
                </div>
                
                <!-- 캘린더 위젯 -->
                <div class="calendar-widget-card">
                    <div class="card-header">
                        <h3 class="card-title">배송 캘린더</h3>
                        <div class="calendar-navigation">
                            <button class="btn-nav" onclick="DashboardModule.previousMonth()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </button>
                            <span class="calendar-month" id="currentMonth">2025년 1월</span>
                            <button class="btn-nav" onclick="DashboardModule.nextMonth()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="calendar-content">
                        <div class="calendar-weekdays">
                            <div class="weekday" style="color: var(--text-sunday);">일</div>
                            <div class="weekday">월</div>
                            <div class="weekday">화</div>
                            <div class="weekday">수</div>
                            <div class="weekday">목</div>
                            <div class="weekday">금</div>
                            <div class="weekday" style="color: var(--text-saturday);">토</div>
                        </div>
                        <div class="calendar-grid" id="calendarGrid">
                            <!-- 캘린더 날짜들이 여기에 동적으로 생성됨 -->
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 하단 차트 섹션 -->
            <div class="dashboard-charts-container">
                <div class="chart-card">
                    <div class="card-header">
                        <h3 class="card-title">주간 주문 추이</h3>
                        <select class="chart-filter">
                            <option>최근 7일</option>
                            <option>최근 30일</option>
                            <option>최근 3개월</option>
                        </select>
                    </div>
                    <div class="chart-content" id="weeklyChart">
                        <canvas id="weeklyOrderChart"></canvas>
                    </div>
                </div>
                
                <div class="chart-card">
                    <div class="card-header">
                        <h3 class="card-title">마켓별 주문 비율</h3>
                        <button class="btn-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="1"></circle>
                                <circle cx="12" cy="5" r="1"></circle>
                                <circle cx="12" cy="19" r="1"></circle>
                            </svg>
                        </button>
                    </div>
                    <div class="chart-content" id="marketChart">
                        <canvas id="marketShareChart"></canvas>
                    </div>
                </div>
            </div>
        `;
        
        // 캘린더 초기 렌더링
        renderCalendar();
    }
    
    // 캘린더 렌더링
    function renderCalendar() {
        const year = state.currentDate.getFullYear();
        const month = state.currentDate.getMonth();
        
        // 월 표시 업데이트
        const monthElement = document.getElementById('currentMonth');
        if (monthElement) {
            monthElement.textContent = `${year}년 ${month + 1}월`;
        }
        
        const firstDay = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        
        const calendarGrid = document.getElementById('calendarGrid');
        if (!calendarGrid) return;
        
        calendarGrid.innerHTML = '';
        
        // 빈 칸 채우기
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarGrid.appendChild(emptyDay);
        }
        
        // 날짜 채우기
        for (let date = 1; date <= lastDate; date++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            const currentDay = new Date(year, month, date);
            const dayOfWeek = currentDay.getDay();
            
            // 오늘 날짜 표시
            if (year === today.getFullYear() && 
                month === today.getMonth() && 
                date === today.getDate()) {
                dayElement.classList.add('today');
            }
            
            // 주말 색상
            if (dayOfWeek === 0) {
                dayElement.classList.add('sunday');
            } else if (dayOfWeek === 6) {
                dayElement.classList.add('saturday');
            }
            
            // 배송 정보 표시 (예시 데이터)
            const hasDelivery = Math.random() > 0.6;
            const deliveryCount = hasDelivery ? Math.floor(Math.random() * 50) + 1 : 0;
            
            dayElement.innerHTML = `
                <div class="calendar-date">${date}</div>
                ${hasDelivery ? `<div class="calendar-delivery-count">${deliveryCount}건</div>` : ''}
            `;
            
            dayElement.onclick = () => selectDate(year, month, date);
            calendarGrid.appendChild(dayElement);
        }
    }
    
    // 날짜 선택
    function selectDate(year, month, date) {
        state.selectedDate = new Date(year, month, date);
        
        // 선택된 날짜 스타일 업데이트
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.classList.remove('selected');
        });
        
        event.target.closest('.calendar-day').classList.add('selected');
        
        // 선택된 날짜의 상세 정보 로드
        loadDateDetails(state.selectedDate);
    }
    
    // 이전 달로 이동
    function previousMonth() {
        state.currentDate.setMonth(state.currentDate.getMonth() - 1);
        renderCalendar();
    }
    
    // 다음 달로 이동
    function nextMonth() {
        state.currentDate.setMonth(state.currentDate.getMonth() + 1);
        renderCalendar();
    }
    
    // 배송 현황 새로고침
    function refreshDeliveryStatus() {
        // 로딩 애니메이션
        const refreshBtn = event.target.closest('.btn-refresh');
        if (refreshBtn) {
            refreshBtn.style.animation = 'spin 1s linear';
            setTimeout(() => {
                refreshBtn.style.animation = '';
            }, 1000);
        }
        
        // 데이터 다시 로드
        loadDeliveryData();
    }
    
    // 대시보드 데이터 로드
    function loadDashboardData() {
        // 통계 데이터 로드
        loadStatisticsData();
        
        // 배송 데이터 로드
        loadDeliveryData();
        
        // 차트 데이터 로드
        loadChartData();
    }
    
    // 통계 데이터 로드
    function loadStatisticsData() {
        // API 호출 또는 로컬 데이터 로드
        // 예시 데이터
        const stats = {
            todayOrders: 156,
            completedShipping: 89,
            pendingOrders: 67,
            monthlyOrders: 3421
        };
        
        // UI 업데이트
        Object.keys(stats).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                animateNumber(element, 0, stats[key], 1000);
            }
        });
    }
    
    // 배송 데이터 로드
    function loadDeliveryData() {
        // 예시 데이터
        const deliveryData = {
            received: 45,
            processing: 32,
            shipping: 28,
            completed: 89
        };
        
        document.getElementById('deliveryReceived').textContent = deliveryData.received;
        document.getElementById('deliveryProcessing').textContent = deliveryData.processing;
        document.getElementById('deliveryShipping').textContent = deliveryData.shipping;
        document.getElementById('deliveryCompleted').textContent = deliveryData.completed;
        
        // 진행률 계산
        const total = Object.values(deliveryData).reduce((a, b) => a + b, 0);
        const completedPercent = Math.round((deliveryData.completed / total) * 100);
        
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = `${completedPercent}%`;
        }
        
        const summaryValue = document.querySelector('.delivery-summary .summary-value');
        if (summaryValue) {
            summaryValue.textContent = `${completedPercent}%`;
        }
    }
    
    // 차트 데이터 로드
    function loadChartData() {
        // 주간 차트와 마켓 차트 렌더링
        renderWeeklyChart();
        renderMarketChart();
    }
    
    // 주간 주문 차트 렌더링
    function renderWeeklyChart() {
        const canvas = document.getElementById('weeklyOrderChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // 간단한 막대 차트 그리기
        const data = [45, 52, 38, 65, 48, 72, 58];
        const labels = ['월', '화', '수', '목', '금', '토', '일'];
        const maxValue = Math.max(...data);
        
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = 200;
        
        const barWidth = canvas.width / (data.length * 2);
        const barSpacing = barWidth;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        data.forEach((value, index) => {
            const barHeight = (value / maxValue) * (canvas.height - 40);
            const x = (index * (barWidth + barSpacing)) + barSpacing;
            const y = canvas.height - barHeight - 20;
            
            // 막대 그리기
            ctx.fillStyle = '#2563eb';
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // 라벨
            ctx.fillStyle = '#6c757d';
            ctx.font = '12px Noto Sans KR';
            ctx.textAlign = 'center';
            ctx.fillText(labels[index], x + barWidth / 2, canvas.height - 5);
            
            // 값
            ctx.fillText(value, x + barWidth / 2, y - 5);
        });
    }
    
    // 마켓별 차트 렌더링
    function renderMarketChart() {
        const canvas = document.getElementById('marketShareChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // 도넛 차트 데이터
        const data = [
            { name: '쿠팡', value: 35, color: '#2563eb' },
            { name: '네이버', value: 28, color: '#10b981' },
            { name: '지마켓', value: 20, color: '#f59e0b' },
            { name: '11번가', value: 12, color: '#ef4444' },
            { name: '기타', value: 5, color: '#6c757d' }
        ];
        
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = 200;
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 60;
        const innerRadius = 35;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let currentAngle = -Math.PI / 2;
        
        data.forEach((segment, index) => {
            const angle = (segment.value / 100) * Math.PI * 2;
            
            // 도넛 그리기
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + angle);
            ctx.arc(centerX, centerY, innerRadius, currentAngle + angle, currentAngle, true);
            ctx.closePath();
            ctx.fillStyle = segment.color;
            ctx.fill();
            
            currentAngle += angle;
        });
        
        // 범례
        let legendY = 20;
        data.forEach((segment, index) => {
            ctx.fillStyle = segment.color;
            ctx.fillRect(10, legendY - 8, 12, 12);
            
            ctx.fillStyle = '#495057';
            ctx.font = '12px Noto Sans KR';
            ctx.fillText(`${segment.name} ${segment.value}%`, 30, legendY);
            
            legendY += 20;
        });
    }
    
    // 날짜별 상세 정보 로드
    function loadDateDetails(date) {
        console.log('Loading details for:', date);
        // 선택된 날짜의 배송 정보 로드
    }
    
    // 숫자 애니메이션
    function animateNumber(element, start, end, duration) {
        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
                current = end;
                clearInterval(timer);
            }
            element.textContent = Math.round(current).toLocaleString('ko-KR');
        }, 16);
    }
    
    // 이벤트 리스너 등록
    function attachEventListeners() {
        // 차트 필터 변경
        const chartFilter = document.querySelector('.chart-filter');
        if (chartFilter) {
            chartFilter.addEventListener('change', (e) => {
                console.log('Filter changed:', e.target.value);
                loadChartData();
            });
        }
    }
    
    // Public API
    return {
        init: init,
        previousMonth: previousMonth,
        nextMonth: nextMonth,
        refreshDeliveryStatus: refreshDeliveryStatus
    };
})();
