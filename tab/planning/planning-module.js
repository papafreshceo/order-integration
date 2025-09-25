<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>업무계획</title>
    <style>
        /* 원본 스타일 그대로 유지 */
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

        /* 캘린더 뷰 - 원본 스타일 그대로 */
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
            min-height: 100px;
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
            font-size: 12px;
            padding: 2px 4px;
            margin: 2px 0;
            border-radius: 3px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
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

        /* 리스트 뷰 - 원본 스타일 그대로 */
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
        }

        .task-list-item:hover {
            background: #e9ecef;
            transform: translateX(4px);
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

        /* 태스크 추가 버튼 - 원본 스타일 그대로 */
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
        }

        .add-task-btn:hover {
            background: #1d4ed8;
            transform: scale(1.1);
        }

        /* 모든 모달 스타일 그대로 유지 */
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

        /* 탭 추가 */
        .tabs {
            display: flex;
            gap: 8px;
            margin-bottom: 20px;
            background: #ffffff;
            padding: 4px;
            border: 1px solid #dee2e6;
            border-radius: 8px;
        }

        .tab-btn {
            padding: 8px 16px;
            background: transparent;
            border: none;
            border-radius: 6px;
            color: #495057;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .tab-btn.active {
            background: #2563eb;
            color: white;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- 탭 추가 -->
        <div class="tabs">
            <button class="tab-btn active" onclick="switchTab('tasks')">업무지시</button>
            <button class="tab-btn" onclick="switchTab('short')">단기계획</button>
            <button class="tab-btn" onclick="switchTab('long')">장기계획</button>
        </div>

        <!-- 헤더 - 원본 그대로 -->
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

        <!-- 날짜 네비게이션 - 원본 그대로 -->
        <div class="date-navigation">
            <button class="date-nav-btn" onclick="changeMonth(-1)">◀</button>
            <div class="current-date" id="currentDate">2025년 1월</div>
            <button class="date-nav-btn" onclick="changeMonth(1)">▶</button>
            <button class="date-nav-btn" onclick="goToToday()">오늘</button>
        </div>

        <!-- 캘린더 뷰 - 원본 그대로 -->
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
            <div class="calendar-body" id="calendarBody">
                <!-- 캘린더 셀은 JavaScript로 생성 -->
            </div>
        </div>

        <!-- 리스트 뷰 - 원본 그대로 -->
        <div class="list-view" id="listView">
            <div class="task-list" id="taskListContent">
                <!-- 동적 생성 -->
            </div>
        </div>

        <!-- 태스크 추가 버튼 - 원본 그대로 -->
        <button class="add-task-btn" onclick="openTaskModal()">+</button>
    </div>

    <!-- 태스크 추가/수정 모달 - 원본 그대로 -->
    <div class="modal" id="taskModal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>새 업무 추가</h3>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">업무 제목</label>
                    <input type="text" class="form-control" id="taskTitle" placeholder="업무 제목을 입력하세요">
                </div>
                <div class="form-group">
                    <label class="form-label">날짜</label>
                    <input type="date" class="form-control" id="taskDate">
                </div>
                <div class="form-group">
                    <label class="form-label">시간</label>
                    <div style="display: flex; gap: 8px;">
                        <input type="time" class="form-control" id="taskStartTime">
                        <span style="align-self: center;">~</span>
                        <input type="time" class="form-control" id="taskEndTime">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">담당자</label>
                    <select class="form-control" id="taskAssignee">
                        <option value="">선택</option>
                        <option value="김철수">김철수</option>
                        <option value="이영희">이영희</option>
                        <option value="박민수">박민수</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">우선순위</label>
                    <select class="form-control" id="taskPriority">
                        <option value="low">낮음</option>
                        <option value="medium">중간</option>
                        <option value="high">높음</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">설명</label>
                    <textarea class="form-control" id="taskDescription" placeholder="업무 설명을 입력하세요"></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeTaskModal()">취소</button>
                <button class="btn btn-primary" onclick="saveTask()">저장</button>
            </div>
        </div>
    </div>

    <script>
        let currentDate = new Date();
        let currentView = 'calendar';
        let currentTab = 'tasks';
        let tasksData = [];
        let shortTermData = [];
        let longTermData = [];

        // 페이지 로드시 초기화
        document.addEventListener('DOMContentLoaded', function() {
            loadData();
        });

        async function loadData() {
            try {
                // 업무지시 데이터 로드
                const tasksRes = await fetch('/api/planning', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'getData',
                        range: '업무지시!A:K'
                    })
                });
                const tasksResult = await tasksRes.json();
                if (tasksResult.success) {
                    tasksData = parseSheetData(tasksResult.data);
                }

                // 다른 데이터도 로드...
                
                generateCalendar();
            } catch (error) {
                console.error('데이터 로드 실패:', error);
                // 에러 시에도 빈 캘린더 표시
                generateCalendar();
            }
        }

        function parseSheetData(data) {
            if (!data || data.length < 2) return [];
            const headers = data[0];
            return data.slice(1).map(row => {
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

        // 원본 함수들 그대로 유지
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
                const cell = createCalendarCell(daysInPrevMonth - i, true);
                calendarBody.appendChild(cell);
            }
            
            // 현재 달 날짜
            const today = new Date();
            for (let day = 1; day <= daysInMonth; day++) {
                const cell = createCalendarCell(day, false);
                if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
                    cell.classList.add('today');
                }
                
                // 구글시트에서 가져온 데이터 표시
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayTasks = getTasksForDate(dateStr);
                dayTasks.forEach(task => {
                    const taskEl = document.createElement('div');
                    taskEl.className = `task-item task-${task['우선순위'] || 'medium'}`;
                    taskEl.textContent = task['업무제목'] || task['제목'] || '';
                    cell.appendChild(taskEl);
                });
                
                calendarBody.appendChild(cell);
            }
            
            // 다음 달 날짜
            const totalCells = calendarBody.children.length;
            const remainingCells = 35 - totalCells;
            for (let day = 1; day <= remainingCells; day++) {
                const cell = createCalendarCell(day, true);
                calendarBody.appendChild(cell);
            }
            
            updateDateDisplay();
        }

        function getTasksForDate(dateStr) {
            let data = [];
            if (currentTab === 'tasks') {
                data = tasksData;
            } else if (currentTab === 'short') {
                data = shortTermData;
            } else {
                data = longTermData;
            }
            
            return data.filter(task => 
                task['마감일'] === dateStr || task['등록일'] === dateStr
            );
        }

        function createCalendarCell(day, isOtherMonth) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            if (isOtherMonth) {
                cell.classList.add('other-month');
            }
            
            const dateDiv = document.createElement('div');
            dateDiv.className = 'calendar-date';
            dateDiv.textContent = day;
            cell.appendChild(dateDiv);
            
            cell.onclick = function() {
                openTaskModal(day);
            };
            
            return cell;
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

        function updateListView() {
            const content = document.getElementById('taskListContent');
            let data = currentTab === 'tasks' ? tasksData : 
                       currentTab === 'short' ? shortTermData : longTermData;
            
            // 상태별 그룹화
            const grouped = {
                '오늘 할 일': [],
                '이번 주 예정': [],
                '전체': data
            };
            
            let html = '';
            Object.entries(grouped).forEach(([group, tasks]) => {
                if (tasks.length > 0) {
                    html += `
                        <div class="task-group">
                            <div class="task-group-title">${group}</div>
                            ${tasks.map(task => `
                                <div class="task-list-item">
                                    <input type="checkbox" class="task-checkbox">
                                    <div class="task-content">
                                        <div class="task-title">${task['업무제목'] || task['제목'] || ''}</div>
                                        <div class="task-meta">${task['담당자'] || ''} | ${task['마감일'] || ''}</div>
                                    </div>
                                    <span class="task-priority task-${task['우선순위'] || 'medium'}">${task['우선순위'] || '중간'}</span>
                                </div>
                            `).join('')}
                        </div>
                    `;
                }
            });
            
            content.innerHTML = html || '<p style="text-align: center; color: #6c757d;">등록된 업무가 없습니다.</p>';
        }

        function openTaskModal(day) {
            document.getElementById('taskModal').classList.add('show');
            if (day) {
                const year = currentDate.getFullYear();
                const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                const dayStr = String(day).padStart(2, '0');
                document.getElementById('taskDate').value = `${year}-${month}-${dayStr}`;
            }
        }

        function closeTaskModal() {
            document.getElementById('taskModal').classList.remove('show');
        }

        async function saveTask() {
            const taskData = {
                '업무제목': document.getElementById('taskTitle').value,
                '마감일': document.getElementById('taskDate').value,
                '담당자': document.getElementById('taskAssignee').value,
                '우선순위': document.getElementById('taskPriority').value,
                '업무내용': document.getElementById('taskDescription').value,
                '등록일': new Date().toISOString().split('T')[0],
                '상태': '대기'
            };
            
            try {
                const response = await fetch('/api/planning', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'appendData',
                        range: '업무지시!A:K',
                        data: taskData
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    alert('업무가 저장되었습니다.');
                    closeTaskModal();
                    loadData();
                }
            } catch (error) {
                console.error('저장 실패:', error);
                alert('저장 중 오류가 발생했습니다.');
            }
        }

        // 모달 외부 클릭시 닫기 - 원본 그대로
        document.getElementById('taskModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeTaskModal();
            }
        });
    </script>
</body>
</html>