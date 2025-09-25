<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>업무계획</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #f5f6fa;
            padding: 20px;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
        }

        /* 탭 스타일 */
        .tabs {
            display: flex;
            gap: 8px;
            background: #ffffff;
            padding: 4px;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            margin-bottom: 20px;
        }

        .tab-btn {
            padding: 10px 20px;
            background: transparent;
            border: none;
            border-radius: 6px;
            color: #495057;
            font-size: 14px;
            font-weight: 400;
            cursor: pointer;
            transition: all 0.2s;
        }

        .tab-btn:hover {
            background: #f8f9fa;
        }

        .tab-btn.active {
            background: #2563eb;
            color: white;
        }

        /* 헤더 */
        .header-section {
            background: #ffffff;
            border: 1px solid #dee2e6;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .page-title {
            font-size: 24px;
            font-weight: 600;
            color: #212529;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        /* 날짜 네비게이션 */
        .date-navigation {
            display: flex;
            align-items: center;
            gap: 12px;
            background: #ffffff;
            padding: 12px 20px;
            border: 1px solid #dee2e6;
            border-radius: 12px;
            margin-bottom: 20px;
        }

        .date-nav-btn {
            padding: 6px 12px;
            background: #ffffff;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .date-nav-btn:hover {
            background: #f8f9fa;
        }

        .current-date {
            font-size: 18px;
            font-weight: 500;
            color: #212529;
            min-width: 200px;
            text-align: center;
        }

        /* 뷰 전환 버튼 */
        .view-toggle {
            display: flex;
            gap: 8px;
        }

        .view-btn {
            padding: 8px 16px;
            background: #ffffff;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
        }

        .view-btn.active {
            background: #2563eb;
            color: white;
            border-color: #2563eb;
        }

        /* 캘린더 뷰 */
        .calendar-view {
            background: #ffffff;
            border: 1px solid #dee2e6;
            border-radius: 12px;
            overflow: hidden;
        }

        .calendar-header {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            background: #f8f9fa;
            border-bottom: 2px solid #dee2e6;
        }

        .calendar-header-cell {
            padding: 12px;
            text-align: center;
            font-size: 14px;
            font-weight: 500;
            color: #495057;
        }

        .calendar-header-cell:first-child {
            color: #dc3545;
        }

        .calendar-header-cell:last-child {
            color: #0066cc;
        }

        .calendar-body {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
        }

        .calendar-cell {
            min-height: 120px;
            border-right: 1px solid #f1f3f5;
            border-bottom: 1px solid #f1f3f5;
            padding: 8px;
            position: relative;
            cursor: pointer;
            transition: background 0.2s;
        }

        .calendar-cell:hover {
            background: #f8f9fa;
        }

        .calendar-cell:nth-child(7n) {
            border-right: none;
        }

        .calendar-date {
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 4px;
        }

        .calendar-cell.other-month .calendar-date {
            color: #adb5bd;
        }

        .calendar-cell.today {
            background: #e7f3ff;
        }

        .task-item {
            font-size: 11px;
            padding: 2px 4px;
            margin: 2px 0;
            border-radius: 3px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            cursor: pointer;
        }

        /* 업무 유형별 색상 */
        .task-urgent {
            background: #dc3545;
            color: white;
        }

        .task-high {
            background: #fee2e2;
            color: #991b1b;
        }

        .task-medium {
            background: #fef3c7;
            color: #92400e;
        }

        .task-low {
            background: #dbeafe;
            color: #1e40af;
        }

        .task-short {
            background: #d4f4e7;
            color: #166534;
            border-left: 2px solid #16a34a;
        }

        .task-long {
            background: #f3e8ff;
            color: #6b21a8;
            border-left: 2px solid #9333ea;
        }

        /* 리스트 뷰 */
        .list-view {
            background: #ffffff;
            border: 1px solid #dee2e6;
            border-radius: 12px;
            overflow: hidden;
            display: none;
        }

        .list-view.active {
            display: block;
        }

        .calendar-view.active {
            display: block;
        }

        .task-list {
            padding: 20px;
        }

        .task-group {
            margin-bottom: 24px;
        }

        .task-group-title {
            font-size: 16px;
            font-weight: 500;
            color: #212529;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 2px solid #dee2e6;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .task-count {
            background: #2563eb;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
        }

        .task-list-item {
            display: flex;
            align-items: center;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 8px;
            margin-bottom: 8px;
            cursor: pointer;
            transition: all 0.2s;
            border-left: 3px solid transparent;
        }

        .task-list-item:hover {
            background: #e9ecef;
            transform: translateX(4px);
        }

        .task-list-item.urgent {
            border-left-color: #dc3545;
        }

        .task-list-item.short-term {
            border-left-color: #16a34a;
        }

        .task-list-item.long-term {
            border-left-color: #9333ea;
        }

        .task-checkbox {
            width: 20px;
            height: 20px;
            margin-right: 12px;
        }

        .task-content {
            flex: 1;
        }

        .task-title {
            font-size: 14px;
            font-weight: 500;
            color: #212529;
            margin-bottom: 4px;
        }

        .task-meta {
            font-size: 12px;
            color: #6c757d;
        }

        .task-priority {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            margin-left: 8px;
        }

        /* 태스크 추가 버튼 */
        .add-task-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 56px;
            height: 56px;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 50%;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
            transition: all 0.2s;
            z-index: 100;
        }

        .add-task-btn:hover {
            background: #1d4ed8;
            transform: scale(1.1);
        }

        /* 모달 */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }

        .modal.show {
            display: flex;
        }

        .modal-content {
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
        }

        .modal-header {
            padding: 20px;
            border-bottom: 1px solid #dee2e6;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .modal-title {
            font-size: 18px;
            font-weight: 500;
            color: #212529;
        }

        .modal-close {
            background: none;
            border: none;
            font-size: 24px;
            color: #6c757d;
            cursor: pointer;
        }

        .modal-body {
            padding: 20px;
        }

        .form-group {
            margin-bottom: 16px;
        }

        .form-label {
            display: block;
            margin-bottom: 4px;
            font-size: 14px;
            font-weight: 500;
            color: #495057;
        }

        .form-control {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            font-size: 14px;
        }

        .form-control:focus {
            outline: none;
            border-color: #2563eb;
        }

        textarea.form-control {
            min-height: 100px;
            resize: vertical;
        }

        .modal-footer {
            padding: 20px;
            border-top: 1px solid #dee2e6;
            display: flex;
            justify-content: flex-end;
            gap: 8px;
        }

        .btn {
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
        }

        .btn-primary {
            background: #2563eb;
            color: white;
        }

        .btn-primary:hover {
            background: #1d4ed8;
        }

        .btn-secondary {
            background: #ffffff;
            border: 1px solid #dee2e6;
            color: #495057;
        }

        .btn-secondary:hover {
            background: #f8f9fa;
        }

        /* 로딩 */
        .loading {
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 2000;
        }

        .loading.show {
            display: block;
        }

        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #2563eb;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* 범례 */
        .legend {
            display: flex;
            gap: 16px;
            padding: 8px 12px;
            background: #f8f9fa;
            border-radius: 8px;
            margin-bottom: 12px;
            font-size: 12px;
        }

        .legend-item {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .legend-color {
            width: 16px;
            height: 16px;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- 탭 -->
        <div class="tabs">
            <button class="tab-btn active" onclick="switchTab('all')">전체</button>
            <button class="tab-btn" onclick="switchTab('today')">오늘 챙겨야 할 일</button>
            <button class="tab-btn" onclick="switchTab('short')">단기계획</button>
            <button class="tab-btn" onclick="switchTab('long')">장기계획</button>
        </div>

        <!-- 헤더 -->
        <div class="header-section">
            <h1 class="page-title">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="8" y1="3" x2="8" y2="9"></line>
                    <line x1="16" y1="3" x2="16" y2="9"></line>
                </svg>
                업무 계획
            </h1>
            <div class="view-toggle">
                <button class="view-btn active" onclick="toggleView('calendar')">캘린더</button>
                <button class="view-btn" onclick="toggleView('list')">리스트</button>
            </div>
        </div>

        <!-- 날짜 네비게이션 -->
        <div class="date-navigation">
            <button class="date-nav-btn" onclick="changeMonth(-1)">◀</button>
            <div class="current-date" id="currentDate">2025년 1월</div>
            <button class="date-nav-btn" onclick="changeMonth(1)">▶</button>
            <button class="date-nav-btn" onclick="goToToday()">오늘</button>
        </div>

        <!-- 범례 -->
        <div class="legend">
            <div class="legend-item">
                <div class="legend-color" style="background: #fee2e2;"></div>
                <span>업무지시</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background: #d4f4e7;"></div>
                <span>단기계획</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background: #f3e8ff;"></div>
                <span>장기계획</span>
            </div>
        </div>

        <!-- 캘린더 뷰 -->
        <div class="calendar-view active" id="calendarView">
            <div class="calendar-header">
                <div class="calendar-header-cell">일</div>
                <div class="calendar-header-cell">월</div>
                <div class="calendar-header-cell">화</div>
                <div class="calendar-header-cell">수</div>
                <div class="calendar-header-cell">목</div>
                <div class="calendar-header-cell">금</div>
                <div class="calendar-header-cell">토</div>
            </div>
            <div class="calendar-body" id="calendarBody"></div>
        </div>

        <!-- 리스트 뷰 -->
        <div class="list-view" id="listView">
            <div class="task-list" id="taskListContent"></div>
        </div>

        <!-- 태스크 추가 버튼 -->
        <button class="add-task-btn" onclick="openTaskModal()">+</button>
    </div>

    <!-- 태스크 추가/수정 모달 -->
    <div class="modal" id="taskModal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">새 업무 추가</h3>
                <button class="modal-close" onclick="closeTaskModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">업무 구분</label>
                    <select class="form-control" id="taskType" onchange="updateModalFields()">
                        <option value="task">업무지시</option>
                        <option value="short">단기계획</option>
                        <option value="long">장기계획</option>
                    </select>
                </div>
                
                <div id="taskFields">
                    <!-- 동적으로 생성됨 -->
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeTaskModal()">취소</button>
                <button class="btn btn-primary" onclick="saveTask()">저장</button>
            </div>
        </div>
    </div>

    <!-- 로딩 -->
    <div class="loading" id="loading">
        <div class="spinner"></div>
    </div>

    <script>
        let currentDate = new Date();
        let currentView = 'calendar';
        let currentTab = 'all';
        let tasksData = [];
        let shortTermData = [];
        let longTermData = [];

        // 페이지 로드시 초기화
        document.addEventListener('DOMContentLoaded', function() {
            loadData();
            updateModalFields();
        });

        async function loadData() {
            showLoading();
            try {
                // 업무지시 데이터
                const tasksRes = await fetch('/api/planning', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'getData',
                        range: '업무지시!A:K'
                    })
                });
                
                // 단기계획 데이터
                const shortRes = await fetch('/api/planning', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'getData',
                        range: '단기계획!A:L'
                    })
                });
                
                // 장기계획 데이터
                const longRes = await fetch('/api/planning', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'getData',
                        range: '장기계획!A:M'
                    })
                });
                
                const tasksResult = await tasksRes.json();
                const shortResult = await shortRes.json();
                const longResult = await longRes.json();
                
                if (tasksResult.success) {
                    tasksData = parseSheetData(tasksResult.data);
                }
                if (shortResult.success) {
                    shortTermData = parseSheetData(shortResult.data);
                }
                if (longResult.success) {
                    longTermData = parseSheetData(longResult.data);
                }
                
                generateCalendar();
            } catch (error) {
                console.error('데이터 로드 실패:', error);
                // 에러 시에도 빈 캘린더 표시
                generateCalendar();
            } finally {
                hideLoading();
            }
        }

        function parseSheetData(data) {
            if (!data || data.length < 2) return [];
            const headers = data[0];
            return data.slice(1).filter(row => row.some(cell => cell)).map(row => {
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = row[index] || '';
                });
                return obj;
            });
        }

        function switchTab(tab) {
            currentTab = tab;
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            
            if (currentView === 'calendar') {
                generateCalendar();
            } else {
                updateListView();
            }
        }

        function generateCalendar() {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const prevLastDay = new Date(year, month, 0);
            
            const firstDayOfWeek = firstDay.getDay();
            const daysInMonth = lastDay.getDate();
            const daysInPrevMonth = prevLastDay.getDate();
            
            const calendarBody = document.getElementById('calendarBody');
            calendarBody.innerHTML = '';
            
            // 이전 달 날짜
            for (let i = firstDayOfWeek - 1; i >= 0; i--) {
                const cell = createCalendarCell(daysInPrevMonth - i, true, null);
                calendarBody.appendChild(cell);
            }
            
            // 현재 달 날짜
            const today = new Date();
            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayTasks = getTasksForDate(dateStr);
                const cell = createCalendarCell(day, false, dayTasks);
                
                if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
                    cell.classList.add('today');
                }
                
                calendarBody.appendChild(cell);
            }
            
            // 다음 달 날짜
            const totalCells = calendarBody.children.length;
            const remainingCells = (totalCells < 35 ? 35 : 42) - totalCells;
            for (let day = 1; day <= remainingCells; day++) {
                const cell = createCalendarCell(day, true, null);
                calendarBody.appendChild(cell);
            }
            
            updateDateDisplay();
        }

        function createCalendarCell(day, isOtherMonth, tasks) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            if (isOtherMonth) {
                cell.classList.add('other-month');
            }
            
            const dateDiv = document.createElement('div');
            dateDiv.className = 'calendar-date';
            dateDiv.textContent = day;
            cell.appendChild(dateDiv);
            
            if (tasks && tasks.length > 0 && !isOtherMonth) {
                const maxDisplay = 3;
                tasks.slice(0, maxDisplay).forEach(task => {
                    const taskEl = document.createElement('div');
                    taskEl.className = 'task-item';
                    
                    // 업무 유형에 따른 스타일 적용
                    if (task.type === 'task') {
                        taskEl.classList.add(`task-${(task['우선순위'] || 'medium').toLowerCase()}`);
                        taskEl.textContent = task['업무제목'];
                    } else if (task.type === 'short') {
                        taskEl.classList.add('task-short');
                        taskEl.textContent = task['제목'];
                    } else if (task.type === 'long') {
                        taskEl.classList.add('task-long');
                        taskEl.textContent = task['계획명'];
                    }
                    
                    taskEl.onclick = (e) => {
                        e.stopPropagation();
                        // 상세 보기 또는 편집
                    };
                    cell.appendChild(taskEl);
                });
                
                if (tasks.length > maxDisplay) {
                    const moreDiv = document.createElement('div');
                    moreDiv.className = 'task-item';
                    moreDiv.style.color = '#6c757d';
                    moreDiv.style.background = '#f8f9fa';
                    moreDiv.textContent = `+${tasks.length - maxDisplay}개 더`;
                    cell.appendChild(moreDiv);
                }
            }
            
            if (!isOtherMonth) {
                cell.onclick = function() {
                    openTaskModal(day);
                };
            }
            
            return cell;
        }

        function getTasksForDate(dateStr) {
            const today = new Date().toISOString().split('T')[0];
            let allTasks = [];
            
            // 업무지시 - 마감일이 해당 날짜인 것
            const tasks = tasksData.filter(task => {
                return task['마감일'] === dateStr || 
                       (task['등록일'] === dateStr && task['상태'] !== '완료');
            }).map(task => ({ ...task, type: 'task' }));
            
            // 단기계획 - 기간에 포함되는 것
            const shortTasks = shortTermData.filter(plan => {
                return plan['시작일'] <= dateStr && dateStr <= plan['종료일'];
            }).map(task => ({ ...task, type: 'short' }));
            
            // 장기계획 - 해당 월에 포함되는 것
            const [year, month] = dateStr.split('-').slice(0, 2);
            const longTasks = longTermData.filter(plan => {
                return plan['연도'] == year && 
                       parseInt(plan['시작월']) <= parseInt(month) && 
                       parseInt(month) <= parseInt(plan['종료월']);
            }).map(task => ({ ...task, type: 'long' }));
            
            // 탭 필터링 적용
            if (currentTab === 'all') {
                allTasks = [...tasks, ...shortTasks, ...longTasks];
            } else if (currentTab === 'today') {
                // 오늘 날짜인 경우에만 표시
                if (dateStr === today) {
                    allTasks = [
                        ...tasks.filter(t => t['우선순위'] === '긴급' || t['마감일'] === today),
                        ...shortTasks,
                        ...longTasks
                    ];
                }
            } else if (currentTab === 'short') {
                allTasks = shortTasks;
            } else if (currentTab === 'long') {
                allTasks = longTasks;
            }
            
            return allTasks;
        }

        function updateListView() {
            const content = document.getElementById('taskListContent');
            const today = new Date().toISOString().split('T')[0];
            
            let displayData = [];
            
            if (currentTab === 'all') {
                displayData = [
                    ...tasksData.map(t => ({ ...t, type: 'task', category: '업무지시' })),
                    ...shortTermData.map(t => ({ ...t, type: 'short', category: '단기계획' })),
                    ...longTermData.map(t => ({ ...t, type: 'long', category: '장기계획' }))
                ];
            } else if (currentTab === 'today') {
                displayData = [
                    ...tasksData.filter(t => 
                        t['마감일'] === today || 
                        t['우선순위'] === '긴급'
                    ).map(t => ({ ...t, type: 'task', category: '오늘 업무' })),
                    ...shortTermData.filter(t => 
                        t['시작일'] <= today && today <= t['종료일']
                    ).map(t => ({ ...t, type: 'short', category: '진행중 단기계획' }))
                ];
            } else if (currentTab === 'short') {
                displayData = shortTermData.map(t => ({ ...t, type: 'short', category: '단기계획' }));
            } else if (currentTab === 'long') {
                displayData = longTermData.map(t => ({ ...t, type: 'long', category: '장기계획' }));
            }
            
            // 카테고리별로 그룹화
            const grouped = {};
            displayData.forEach(item => {
                if (!grouped[item.category]) {
                    grouped[item.category] = [];
                }
                grouped[item.category].push(item);
            });
            
            let html = '';
            Object.entries(grouped).forEach(([category, items]) => {
                html += `
                    <div class="task-group">
                        <div class="task-group-title">
                            ${category}
                            <span class="task-count">${items.length}</span>
                        </div>
                        ${items.map(item => {
                            const title = item['업무제목'] || item['제목'] || item['계획명'] || '';
                            const meta = [];
                            if (item['담당자'] || item['책임자']) meta.push(`담당: ${item['담당자'] || item['책임자']}`);
                            if (item['마감일'] || item['종료일'] || item['종료월']) {
                                meta.push(`마감: ${item['마감일'] || item['종료일'] || item['종료월'] + '월'}`);
                            }
                            if (item['진행률']) meta.push(`진행: ${item['진행률']}%`);
                            
                            const priority = item['우선순위'] || '중간';
                            const classMap = {
                                'task': 'urgent',
                                'short': 'short-term',
                                'long': 'long-term'
                            };
                            
                            return `
                                <div class="task-list-item ${classMap[item.type] || ''}">
                                    <input type="checkbox" class="task-checkbox" ${item['상태'] === '완료' ? 'checked' : ''}>
                                    <div class="task-content">
                                        <div class="task-title">${title}</div>
                                        <div class="task-meta">${meta.join(' | ')}</div>
                                    </div>
                                    ${item.type === 'task' ? `<span class="task-priority task-${priority.toLowerCase()}">${priority}</span>` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            });
            
            content.innerHTML = html || '<p style="text-align: center; color: #6c757d; padding: 40px;">등록된 업무가 없습니다.</p>';
        }

        function changeMonth(direction) {
            currentDate.setMonth(currentDate.getMonth() + direction);
            generateCalendar();
        }

        function goToToday() {
            currentDate = new Date();
            generateCalendar();
        }

        function updateDateDisplay() {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            document.getElementById('currentDate').textContent = `${year}년 ${month}월`;
        }

        function toggleView(view) {
            currentView = view;
            const buttons = document.querySelectorAll('.view-btn');
            buttons.forEach(btn => btn.classList.remove('active'));
            
            if (view === 'calendar') {
                document.getElementById('calendarView').classList.add('active');
                document.getElementById('listView').classList.remove('active');
                buttons[0].classList.add('active');
                generateCalendar();
            } else {
                document.getElementById('calendarView').classList.remove('active');
                document.getElementById('listView').classList.add('active');
                buttons[1].classList.add('active');
                updateListView();
            }
        }

        function openTaskModal(day) {
            document.getElementById('taskModal').classList.add('show');
            if (day) {
                const year = currentDate.getFullYear();
                const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                const dayStr = String(day).padStart(2, '0');
                const dateStr = `${year}-${month}-${dayStr}`;
                
                // 날짜 필드 설정
                setTimeout(() => {
                    const dateField = document.getElementById('taskDate');
                    if (dateField) dateField.value = dateStr;
                }, 100);
            }
        }

        function closeTaskModal() {
            document.getElementById('taskModal').classList.remove('show');
        }

        function updateModalFields() {
            const taskType = document.getElementById('taskType').value;
            const fieldsContainer = document.getElementById('taskFields');
            
            let html = '';
            
            if (taskType === 'task') {
                html = `
                    <div class="form-group">
                        <label class="form-label">업무 제목</label>
                        <input type="text" class="form-control" id="taskTitle" placeholder="업무 제목을 입력하세요">
                    </div>
                    <div class="form-group">
                        <label class="form-label">마감일</label>
                        <input type="date" class="form-control" id="taskDate">
                    </div>
                    <div class="form-group">
                        <label class="form-label">담당자</label>
                        <input type="text" class="form-control" id="taskAssignee">
                    </div>
                    <div class="form-group">
                        <label class="form-label">우선순위</label>
                        <select class="form-control" id="taskPriority">
                            <option value="낮음">낮음</option>
                            <option value="중간">중간</option>
                            <option value="높음">높음</option>
                            <option value="긴급">긴급</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">업무 내용</label>
                        <textarea class="form-control" id="taskDescription" placeholder="업무 내용을 입력하세요"></textarea>
                    </div>
                `;
            } else if (taskType === 'short') {
                html = `
                    <div class="form-group">
                        <label class="form-label">계획 제목</label>
                        <input type="text" class="form-control" id="planTitle" placeholder="계획 제목을 입력하세요">
                    </div>
                    <div class="form-group">
                        <label class="form-label">계획 유형</label>
                        <select class="form-control" id="planType">
                            <option value="주간">주간</option>
                            <option value="월간">월간</option>
                            <option value="프로젝트">프로젝트</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">시작일</label>
                        <input type="date" class="form-control" id="startDate">
                    </div>
                    <div class="form-group">
                        <label class="form-label">종료일</label>
                        <input type="date" class="form-control" id="endDate">
                    </div>
                    <div class="form-group">
                        <label class="form-label">담당팀</label>
                        <input type="text" class="form-control" id="team">
                    </div>
                    <div class="form-group">
                        <label class="form-label">목표</label>
                        <textarea class="form-control" id="goal" placeholder="목표를 입력하세요"></textarea>
                    </div>
                `;
            } else if (taskType === 'long') {
                html = `
                    <div class="form-group">
                        <label class="form-label">계획명</label>
                        <input type="text" class="form-control" id="longPlanTitle" placeholder="계획명을 입력하세요">
                    </div>
                    <div class="form-group">
                        <label class="form-label">연도</label>
                        <input type="number" class="form-control" id="planYear" value="${new Date().getFullYear()}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">분기</label>
                        <select class="form-control" id="planQuarter">
                            <option value="1">1분기</option>
                            <option value="2">2분기</option>
                            <option value="3">3분기</option>
                            <option value="4">4분기</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">시작월</label>
                        <input type="number" class="form-control" id="startMonth" min="1" max="12">
                    </div>
                    <div class="form-group">
                        <label class="form-label">종료월</label>
                        <input type="number" class="form-control" id="endMonth" min="1" max="12">
                    </div>
                    <div class="form-group">
                        <label class="form-label">담당부서</label>
                        <input type="text" class="form-control" id="department">
                    </div>
                    <div class="form-group">
                        <label class="form-label">목표</label>
                        <textarea class="form-control" id="longGoal" placeholder="목표를 입력하세요"></textarea>
                    </div>
                `;
            }
            
            fieldsContainer.innerHTML = html;
        }

        async function saveTask() {
            const taskType = document.getElementById('taskType').value;
            let data = {};
            let range = '';
            
            if (taskType === 'task') {
                data = {
                    '연번': '',
                    '등록일': new Date().toISOString().split('T')[0],
                    '마감일': document.getElementById('taskDate').value,
                    '업무제목': document.getElementById('taskTitle').value,
                    '업무내용': document.getElementById('taskDescription').value,
                    '담당자': document.getElementById('taskAssignee').value,
                    '지시자': window.currentUser?.name || '',
                    '우선순위': document.getElementById('taskPriority').value,
                    '상태': '대기',
                    '완료일': '',
                    '비고': ''
                };
                range = '업무지시!A:K';
            } else if (taskType === 'short') {
                data = {
                    '연번': '',
                    '계획유형': document.getElementById('planType').value,
                    '시작일': document.getElementById('startDate').value,
                    '종료일': document.getElementById('endDate').value,
                    '제목': document.getElementById('planTitle').value,
                    '목표': document.getElementById('goal').value,
                    '담당팀': document.getElementById('team').value,
                    '책임자': '',
                    '진행률': '0',
                    '상태': '계획',
                    '주요일정': '',
                    '성과지표': ''
                };
                range = '단기계획!A:L';
            } else if (taskType === 'long') {
                data = {
                    '연번': '',
                    '연도': document.getElementById('planYear').value,
                    '분기': document.getElementById('planQuarter').value,
                    '계획명': document.getElementById('longPlanTitle').value,
                    '목표': document.getElementById('longGoal').value,
                    '시작월': document.getElementById('startMonth').value,
                    '종료월': document.getElementById('endMonth').value,
                    '예산': '',
                    '담당부서': document.getElementById('department').value,
                    '책임자': '',
                    'KPI': '',
                    '달성률': '0',
                    '평가': ''
                };
                range = '장기계획!A:M';
            }
            
            showLoading();
            try {
                const response = await fetch('/api/planning', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'appendData',
                        range: range,
                        data: data
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    closeTaskModal();
                    await loadData();
                } else {
                    alert('저장 중 오류가 발생했습니다.');
                }
            } catch (error) {
                console.error('저장 실패:', error);
                alert('저장 중 오류가 발생했습니다.');
            } finally {
                hideLoading();
            }
        }

        function showLoading() {
            document.getElementById('loading').classList.add('show');
        }

        function hideLoading() {
            document.getElementById('loading').classList.remove('show');
        }

        // 모달 외부 클릭시 닫기
        document.getElementById('taskModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeTaskModal();
            }
        });
    </script>
</body>
</html>