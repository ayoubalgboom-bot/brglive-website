document.addEventListener('DOMContentLoaded', () => {
    // Use API base from config, fallback to localhost if direct access
    const API_BASE = (window.CONFIG && window.CONFIG.apiBase) || 'http://localhost:3000/api/matches';

    // Form elements
    const form = document.getElementById('match-form');
    const homeTeam = document.getElementById('home-team');
    const awayTeam = document.getElementById('away-team');
    const homeLogo = document.getElementById('home-logo');
    const awayLogo = document.getElementById('away-logo');
    const matchTime = document.getElementById('match-time');
    const matchScore = document.getElementById('match-score');
    const league = document.getElementById('league');
    const channel = document.getElementById('channel');
    const commentator = document.getElementById('commentator');
    const matchDay = document.getElementById('match-day');
    const streamUrl = document.getElementById('stream-url');

    // Edit mode fields
    const editMode = document.getElementById('edit-mode');
    const editDay = document.getElementById('edit-day');
    const editIndex = document.getElementById('edit-index');

    // Buttons
    const submitBtn = document.getElementById('submit-btn');
    const cancelBtn = document.getElementById('cancel-btn');

    // Lists
    const matchesList = document.getElementById('matches-list');
    const tabsAdmin = document.querySelectorAll('.tab-btn-admin');
    const notification = document.getElementById('notification');

    let matchesData = { today: [], tomorrow: [], yesterday: [] };
    let currentDay = 'today';

    // Fetch matches from API
    async function fetchMatches() {
        try {
            const response = await fetch(API_BASE);
            if (response.ok) {
                matchesData = await response.json();
                renderMatches(currentDay);
            } else {
                showNotification('فشل في تحميل المباريات', 'error');
            }
        } catch (error) {
            showNotification('خطأ في الاتصال بالخادم', 'error');
            console.error('Error fetching matches:', error);
        }
    }

    // Render matches for a specific day
    function renderMatches(day) {
        currentDay = day;
        matchesList.innerHTML = '';

        const matches = matchesData[day] || [];

        if (matches.length === 0) {
            matchesList.innerHTML = '<div class="no-matches">لا توجد مباريات في هذا القسم</div>';
            return;
        }

        matches.forEach((match, index) => {
            const matchItem = document.createElement('div');
            matchItem.className = 'match-item-admin';
            matchItem.innerHTML = `
                <div class="match-info-admin">
                    <div class="match-teams">
                        <img src="${match.homeLogo}" alt="${match.home}" onerror="this.src='assets/team_blue.png'">
                        <span>${match.home}</span>
                        <span style="margin: 0 10px;">vs</span>
                        <img src="${match.awayLogo}" alt="${match.away}" onerror="this.src='assets/team_red.png'">
                        <span>${match.away}</span>
                    </div>
                    <div class="match-meta">
                        <div><strong>الوقت:</strong> ${match.time}</div>
                        <div><strong>النتيجة:</strong> ${match.score}</div>
                    </div>
                    <div class="match-meta">
                        <div><strong>البطولة:</strong> ${match.league}</div>
                        <div><strong>القناة:</strong> ${match.channel}</div>
                    </div>
                    <div class="match-meta">
                        <div><strong>المعلق:</strong> ${match.commentator}</div>
                        <div><strong>البث:</strong> ${match.streamUrl.substring(0, 40)}...</div>
                    </div>
                </div>
                <div class="match-actions">
                    <button class="btn-edit" onclick="editMatch('${day}', ${index})">تعديل</button>
                    <button class="btn-delete" onclick="deleteMatch('${day}', ${index})">حذف</button>
                </div>
            `;
            matchesList.appendChild(matchItem);
        });
    }

    // Show notification
    function showNotification(message, type = 'success') {
        notification.textContent = message;
        notification.className = `notification ${type}`;

        setTimeout(() => {
            notification.className = 'notification hidden';
        }, 3000);
    }

    // Add or update match
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const matchData = {
            home: homeTeam.value.trim(),
            away: awayTeam.value.trim(),
            homeLogo: homeLogo.value.trim(),
            awayLogo: awayLogo.value.trim(),
            time: matchTime.value.trim(),
            status: matchTime.value.trim(),
            score: matchScore.value.trim(),
            league: league.value.trim(),
            channel: channel.value.trim(),
            commentator: commentator.value.trim(),
            streamUrl: streamUrl.value.trim()
        };

        const day = matchDay.value;
        const isEditMode = editMode.value === 'true';

        try {
            let response;

            if (isEditMode) {
                // Update existing match
                const updateDay = editDay.value;
                const updateIndex = editIndex.value;
                response = await fetch(`${API_BASE}/${updateDay}/${updateIndex}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(matchData)
                });

                if (response.ok) {
                    showNotification('تم تحديث المباراة بنجاح', 'success');
                    resetForm();
                } else {
                    showNotification('فشل في تحديث المباراة', 'error');
                }
            } else {
                // Add new match
                response = await fetch(`${API_BASE}/${day}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(matchData)
                });

                if (response.ok) {
                    showNotification('تمت إضافة المباراة بنجاح', 'success');
                    form.reset();
                } else {
                    showNotification('فشل في إضافة المباراة', 'error');
                }
            }

            // Refresh matches list
            await fetchMatches();

        } catch (error) {
            showNotification('خطأ في الاتصال بالخادم', 'error');
            console.error('Error saving match:', error);
        }
    });

    // Edit match (called from rendered buttons)
    window.editMatch = function (day, index) {
        const match = matchesData[day][index];

        homeTeam.value = match.home;
        awayTeam.value = match.away;
        homeLogo.value = match.homeLogo;
        awayLogo.value = match.awayLogo;
        matchTime.value = match.time;
        matchScore.value = match.score;
        league.value = match.league;
        channel.value = match.channel;
        commentator.value = match.commentator;
        matchDay.value = day;
        streamUrl.value = match.streamUrl;

        editMode.value = 'true';
        editDay.value = day;
        editIndex.value = index;

        submitBtn.textContent = 'تحديث المباراة';
        cancelBtn.style.display = 'block';

        // Scroll to form
        form.scrollIntoView({ behavior: 'smooth' });
    };

    // Delete match (called from rendered buttons)
    window.deleteMatch = async function (day, index) {
        if (!confirm('هل أنت متأكد من حذف هذه المباراة؟')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/${day}/${index}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showNotification('تم حذف المباراة بنجاح', 'success');
                await fetchMatches();
            } else {
                showNotification('فشل في حذف المباراة', 'error');
            }
        } catch (error) {
            showNotification('خطأ في الاتصال بالخادم', 'error');
            console.error('Error deleting match:', error);
        }
    };

    // Reset form to add mode
    function resetForm() {
        form.reset();
        editMode.value = 'false';
        editDay.value = '';
        editIndex.value = '';
        submitBtn.textContent = 'إضافة المباراة';
        cancelBtn.style.display = 'none';
    }

    // Cancel edit
    cancelBtn.addEventListener('click', resetForm);

    // Tab switching
    tabsAdmin.forEach(tab => {
        tab.addEventListener('click', () => {
            tabsAdmin.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const day = tab.getAttribute('data-day');
            renderMatches(day);
        });
    });

    // Initial load
    fetchMatches();
});
