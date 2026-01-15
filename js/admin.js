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
    const matchStatus = document.getElementById('match-status'); // New status dropdown
    const streamUrl = document.getElementById('stream-url');

    // Edit mode fields
    const editMode = document.getElementById('edit-mode');
    const editDay = document.getElementById('edit-day');
    const editIndex = document.getElementById('edit-index');

    // Buttons
    const submitBtn = document.getElementById('submit-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const shiftDayBtn = document.getElementById('shift-day-btn');

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
            status: matchStatus.value === 'live' ? 'جاري الآن' : (matchStatus.value === 'ended' ? 'انتهت' : matchTime.value.trim()),
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
        commentator.value = match.commentator;
        matchDay.value = day;

        // Set status dropdown logic
        if (match.status === 'جاري الآن') {
            matchStatus.value = 'live';
        } else if (match.status === 'انتهت') {
            matchStatus.value = 'ended';
        } else {
            matchStatus.value = 'scheduled';
        }

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

    // Shift Day Logic
    if (shiftDayBtn) {
        shiftDayBtn.addEventListener('click', async () => {
            if (!confirm('هل أنت متأكد؟ سيتم نقل مباريات الغد إلى اليوم، واليوم إلى الأمس.')) {
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/shift`, {
                    method: 'POST'
                });

                if (response.ok) {
                    showNotification('تم بدء يوم جديد بنجاح', 'success');
                    await fetchMatches();
                } else {
                    showNotification('فشل في بدء يوم جديد', 'error');
                }
            } catch (error) {
                showNotification('خطأ في الاتصال بالخادم', 'error');
                console.error('Error shifting day:', error);
            }
        });
    }

    // ========== CHANNEL MANAGEMENT ==========
    const CHANNELS_API = API_BASE.replace('/matches', '/channels');
    const channelForm = document.getElementById('channel-form');
    const channelName = document.getElementById('channel-name');
    const channelCategory = document.getElementById('channel-category');
    const channelLogo = document.getElementById('channel-logo');
    const channelStream = document.getElementById('channel-stream');
    const channelEditMode = document.getElementById('channel-edit-mode');
    const channelEditId = document.getElementById('channel-edit-id');
    const channelSubmitBtn = document.getElementById('channel-submit-btn');
    const channelCancelBtn = document.getElementById('channel-cancel-btn');
    const channelsList = document.getElementById('channels-list');

    let channelsData = [];

    // Fetch channels
    async function fetchChannels() {
        try {
            const response = await fetch(CHANNELS_API);
            if (response.ok) {
                const data = await response.json();
                channelsData = data.channels || [];
                renderChannels();
            } else {
                showNotification('فشل في تحميل القنوات', 'error');
            }
        } catch (error) {
            showNotification('خطأ في الاتصال بالخادم', 'error');
            console.error('Error fetching channels:', error);
        }
    }

    // Render channels list
    function renderChannels() {
        if (!channelsList) return;

        channelsList.innerHTML = '';

        if (channelsData.length === 0) {
            channelsList.innerHTML = '<div class="no-matches">لا توجد قنوات</div>';
            return;
        }

        channelsData.forEach((channel) => {
            const channelItem = document.createElement('div');
            channelItem.className = 'match-item-admin';
            channelItem.innerHTML = `
                <div class="match-info-admin">
                    <div class="match-teams">
                        <img src="${channel.logo}" alt="${channel.name}" style="width: 40px; height: 40px; object-fit: contain;" onerror="this.src='assets/logo.png'">
                        <span><strong>${channel.name}</strong></span>
                    </div>
                    <div class="match-meta">
                        <div><strong>التصنيف:</strong> ${channel.category}</div>
                        <div><strong>البث:</strong> ${channel.streamUrl.substring(0, 50)}...</div>
                    </div>
                </div>
                <div class="match-actions">
                    <button class="btn-edit" onclick="editChannel('${channel.id}')">تعديل</button>
                    <button class="btn-delete" onclick="deleteChannel('${channel.id}')">حذف</button>
                </div>
            `;
            channelsList.appendChild(channelItem);
        });
    }

    // Add/Update channel
    if (channelForm) {
        channelForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const channelData = {
                name: channelName.value.trim(),
                category: channelCategory.value.trim(),
                logo: channelLogo.value.trim(),
                streamUrl: channelStream.value.trim()
            };

            const isEditMode = channelEditMode.value === 'true';

            try {
                let response;

                if (isEditMode) {
                    // Update channel
                    const id = channelEditId.value;
                    response = await fetch(`${CHANNELS_API}/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(channelData)
                    });

                    if (response.ok) {
                        showNotification('تم تحديث القناة بنجاح', 'success');
                        resetChannelForm();
                    } else {
                        showNotification('فشل في تحديث القناة', 'error');
                    }
                } else {
                    // Add new channel
                    response = await fetch(CHANNELS_API, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(channelData)
                    });

                    if (response.ok) {
                        showNotification('تمت إضافة القناة بنجاح', 'success');
                        channelForm.reset();
                    } else {
                        showNotification('فشل في إضافة القناة', 'error');
                    }
                }

                await fetchChannels();
            } catch (error) {
                showNotification('خطأ في الاتصال بالخادم', 'error');
                console.error('Error saving channel:', error);
            }
        });
    }

    // Edit channel
    window.editChannel = function (id) {
        const channel = channelsData.find(c => c.id === id);
        if (!channel) return;

        channelName.value = channel.name;
        channelCategory.value = channel.category;
        channelLogo.value = channel.logo;
        channelStream.value = channel.streamUrl;

        channelEditMode.value = 'true';
        channelEditId.value = id;

        channelSubmitBtn.textContent = 'تحديث القناة';
        channelCancelBtn.style.display = 'block';

        channelForm.scrollIntoView({ behavior: 'smooth' });
    };

    // Delete channel
    window.deleteChannel = async function (id) {
        if (!confirm('هل أنت متأكد من حذف هذه القناة؟')) {
            return;
        }

        try {
            const response = await fetch(`${CHANNELS_API}/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showNotification('تم حذف القناة بنجاح', 'success');
                await fetchChannels();
            } else {
                showNotification('فشل في حذف القناة', 'error');
            }
        } catch (error) {
            showNotification('خطأ في الاتصال بالخادم', 'error');
            console.error('Error deleting channel:', error);
        }
    };

    // Reset channel form
    function resetChannelForm() {
        channelForm.reset();
        channelEditMode.value = 'false';
        channelEditId.value = '';
        channelSubmitBtn.textContent = 'إضافة القناة';
        channelCancelBtn.style.display = 'none';
    }

    // Cancel channel edit
    if (channelCancelBtn) {
        channelCancelBtn.addEventListener('click', resetChannelForm);
    }

    // Load channels on startup
    if (channelsList) {
        fetchChannels();
    }


});
