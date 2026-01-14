document.addEventListener('DOMContentLoaded', () => {

    // Inject Mobile Menu HTML
    const mobileMenuHTML = `
        <div class="menu-overlay"></div>
        <nav class="mobile-nav">
            <button class="close-menu">&times;</button>
            <ul>
                <li><a href="index.html">الرئيسية</a></li>
                <li><a href="index.html?day=today">مباريات اليوم</a></li>
                <li><a href="index.html?day=tomorrow">مباريات الغد</a></li>
                <li><a href="index.html?day=yesterday">مباريات الأمس</a></li>
                <li><a href="news.html">الأخبار</a></li>
                <li><a href="#">اتصل بنا</a></li>
            </ul>
        </nav>
    `;
    document.body.insertAdjacentHTML('beforeend', mobileMenuHTML);

    const menuToggleBtn = document.getElementById('menu-toggle');
    const mobileNav = document.querySelector('.mobile-nav');
    const menuOverlay = document.querySelector('.menu-overlay');
    const closeMenuBtn = document.querySelector('.close-menu');

    function toggleMenu() {
        mobileNav.classList.toggle('active');
        menuOverlay.classList.toggle('active');
    }

    if (menuToggleBtn) menuToggleBtn.addEventListener('click', toggleMenu);
    if (closeMenuBtn) closeMenuBtn.addEventListener('click', toggleMenu);
    if (menuOverlay) menuOverlay.addEventListener('click', toggleMenu);

    // Theme Toggling
    const themeToggleBtn = document.getElementById('theme-toggle');
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');

    // Check saved preference
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    }

    themeToggleBtn.addEventListener('click', () => {
        let theme = document.body.getAttribute('data-theme');
        if (theme === 'dark') {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        } else {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        }
    });

    // Mock Data for Matches (Fallback if API fails)
    // Updated with all 7 matches from matches.json to ensure users always see full match list
    const fallbackMatchesData = {
        today: [
            {
                home: 'برشلونة', away: 'ريال مدريد', score: '0 - 0', status: 'انتهت', time: '23:00',
                league: 'الدوري الإسباني', channel: 'beIN Sports 1', commentator: 'عصام الشوالي',
                homeLogo: 'assets/barcelona.png', awayLogo: 'assets/real_madrid.png',
                streamUrl: 'http://het101b.ycn-redirect.com/live/610303030/index.m3u8?t=ywdukc8IrU4XpCm2Iz89Iw&e=1768155540'
            },
            {
                home: 'مانشستر يونايتد', away: 'تشيلسي', score: '0 - 0', status: 'انتهت', time: '21:00',
                league: 'الدوري الإنجليزي', channel: 'beIN Sports1', commentator: 'حفيظ دراجي',
                homeLogo: 'assets/man_utd.png', awayLogo: 'assets/chelsea.png',
                streamUrl: 'http://het129c.ycn-redirect.com/live/918454578001/index.m3u8?t=dt_PzZsOxY6_xqEQ7PGKtw&e=1768111577'
            },
            {
                home: 'السعودية تحت 23', away: 'فيتنام تحت 23', score: '0-0', status: 'انتهت', time: '05:30 PM',
                league: 'كأس آسيا تحت 23 سنة', channel: 'bein sport 5', commentator: 'غير معروف',
                homeLogo: 'https://i0.wp.com/www.yalla1shoot.com/wp-content/uploads/2025/12/28914-150x150.png',
                awayLogo: 'https://i0.wp.com/www.yalla1shoot.com/wp-content/uploads/2026/01/28923.png',
                streamUrl: 'http://het101b.ycn-redirect.com/live/610303030/index.m3u8?t=ywdukc8IrU4XpCm2Iz89Iw&e=1768155540'
            },
            {
                home: 'ليفربول', away: 'بارنزلي', score: '0-0', status: '08:45 PM', time: '08:45 PM',
                league: 'إنجلترا, كاس الاتحاد الإنجليزي - الدور 3', channel: 'Bein Sports HD2', commentator: 'غير معروف',
                homeLogo: 'https://i0.wp.com/www.yalla1shoot.com/wp-content/uploads/2025/08/108-90x150.png',
                awayLogo: 'https://i0.wp.com/www.yalla1shoot.com/wp-content/uploads/2025/09/17-150x150.png',
                streamUrl: 'http://het137b.ycn-redirect.com/live/69854211/index.m3u8?t=QQft5riYAQbrc-F-YgQlgA&e=1768255838'
            },
            {
                home: 'يوفنتوس', away: 'كريمونيسي', score: '0-0', status: '08:45 PM', time: '08:45 PM',
                league: 'إيطاليا, الدوري الإيطالي', channel: 'Starzplay', commentator: 'غير معروف',
                homeLogo: 'https://i0.wp.com/www.yalla1shoot.com/wp-content/uploads/2025/08/226-150x150.png',
                awayLogo: 'https://i0.wp.com/www.yalla1shoot.com/wp-content/uploads/2025/08/290.png',
                streamUrl: 'https://dnlyr.yallashootttv.com/hls/ch10/master.m3u8'
            },
            {
                home: 'إشبيلية', away: 'سيلتا فيجو', score: '0-0', status: '09:00 PM', time: '09:00 PM',
                league: 'إسبانيا, الدوري الإسباني', channel: 'beIN Sports 3 HD', commentator: 'غير معروف',
                homeLogo: 'https://i0.wp.com/www.yalla1shoot.com/wp-content/uploads/2025/08/135-1-135x150.png',
                awayLogo: 'https://i0.wp.com/www.yalla1shoot.com/wp-content/uploads/2025/08/158-1.png',
                streamUrl: 'https://dnlys.yallashoooootlive.info/hls/ch3/master.m3u8'
            },
            {
                home: 'باريس سان جيرمان', away: 'باريس أف.سي.', score: '0-0', status: '09:10 PM', time: '09:10 PM',
                league: 'فرنسا, كأس فرنسا - دور الـ 32', channel: 'beIN SPORTS HD 1', commentator: 'غير معروف',
                homeLogo: 'https://i0.wp.com/www.yalla1shoot.com/wp-content/uploads/2025/08/480-150x150.png',
                awayLogo: 'https://i0.wp.com/www.yalla1shoot.com/wp-content/uploads/2025/08/6075.png',
                streamUrl: 'https://dnlyt.yallashootttv.com/hls/ch1/master.m3u8'
            }
        ],
        yesterday: [],
        tomorrow: []
    };

    let matchesData = fallbackMatchesData;

    // Fetch matches from API or matches.json depending on environment
    // Now with retry logic to handle tunnel startup delays
    async function fetchMatchesFromAPI(retryCount = 0) {
        const MAX_RETRIES = 3;
        const RETRY_DELAY = 2000; // 2 seconds

        try {
            const source = CONFIG.getMatchesSource();

            if (!source) {
                console.warn('⚠️ No matches source configured');
                return false;
            }

            console.log(`📡 Fetching matches from: ${source} (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
            const response = await fetch(source);

            if (response.ok) {
                const data = await response.json();
                matchesData = data;
                console.log('✅ Matches loaded successfully from API');
                console.log(`📊 Loaded ${data.today?.length || 0} today, ${data.tomorrow?.length || 0} tomorrow, ${data.yesterday?.length || 0} yesterday`);
                return true;
            } else {
                console.error(`❌ Failed to fetch matches: ${response.status} ${response.statusText}`);

                // Retry if we haven't exceeded max retries
                if (retryCount < MAX_RETRIES - 1) {
                    console.log(`⏳ Retrying in ${RETRY_DELAY / 1000} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                    return fetchMatchesFromAPI(retryCount + 1);
                }
            }
        } catch (error) {
            console.warn('⚠️ Error fetching matches:', error.message);

            // Retry if we haven't exceeded max retries
            if (retryCount < MAX_RETRIES - 1) {
                console.log(`⏳ Retrying in ${RETRY_DELAY / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                return fetchMatchesFromAPI(retryCount + 1);
            }

            // After all retries failed
            console.log('💡 Using fallback data (7 matches)');
        }
        return false;
    }

    // Load matches on page load
    fetchMatchesFromAPI().then(() => {
        // Render initial matches after API fetch
        const urlParams = new URLSearchParams(window.location.search);
        const dayParam = urlParams.get('day');
        if (dayParam && ['today', 'yesterday', 'tomorrow'].includes(dayParam)) {
            tabs.forEach(t => t.classList.remove('active'));
            const activeTab = document.querySelector(`.tab-btn.${dayParam}`);
            if (activeTab) activeTab.classList.add('active');
            renderMatches(dayParam);
        } else {
            renderMatches('today');
        }
    });

    const container = document.getElementById('matches-container');
    const tabs = document.querySelectorAll('.tab-btn');

    // Helper function to calculate match status based on time
    function getMatchStatus(matchTimeStr, originalStatus) {
        // If status is manually set to specific values, respect them
        if (originalStatus === 'انتهت' || originalStatus === 'جاري الآن' || originalStatus === 'مؤجلة') {
            return { text: originalStatus, class: originalStatus === 'جاري الآن' ? 'live' : '' };
        }

        // Parse match time (expected "HH:MM")
        // Note: Assumes match time is in local time or comparable format
        const now = new Date();
        const [hours, minutes] = matchTimeStr.split(':').map(Number);

        if (isNaN(hours) || isNaN(minutes)) {
            // If time format is invalid (like "09:00 PM" instead of "21:00"), just return original
            return { text: originalStatus, class: '' };
        }

        const matchDate = new Date();
        matchDate.setHours(hours, minutes, 0, 0);

        const diffMinutes = (matchDate - now) / (1000 * 60);

        // Logic:
        // > 30 mins before: Show Time
        // 0-30 mins before: "تبدأ قريبًا" (Starts Soon)
        // 0-120 mins after: "جاري الآن" (Live)
        // > 120 mins after: "انتهت" (Ended)

        if (diffMinutes > 30) {
            return { text: matchTimeStr, class: 'scheduled' };
        } else if (diffMinutes > 0 && diffMinutes <= 30) {
            return { text: 'تبدأ قريبًا', class: 'soon' };
        } else if (diffMinutes <= 0 && diffMinutes > -120) { // 2 hours duration
            return { text: 'جاري الآن', class: 'live' };
        } else {
            return { text: 'انتهت', class: 'ended' };
        }
    }

    function renderMatches(day) {
        container.innerHTML = '';
        const matches = matchesData[day] || [];

        if (matches.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:20px;">لا توجد مباريات لعرضها</div>';
            return;
        }

        matches.forEach(match => {
            // Calculate dynamic status for "today" matches only
            // For yesterday/tomorrow, we can rely on static or just simple logic
            let displayStatus = { text: match.status, class: '' };

            if (day === 'today') {
                // Try to parse time from "match.time" e.g. "23:00"
                // If match.time is complex (like "09:00 PM"), we might need better parsing
                // The current input seems to accept various formats.
                // Let's assume standard "HH:MM" 24h format for auto-logic to work best

                // Normalizing time input: remove "PM"/"AM" if present and convert roughly if needed?
                // For now, let's try direct usage if it fits HH:MM
                let time = match.time;
                if (time.includes('PM')) {
                    // Simple optional conversion logic could go here, but let's rely on admin entering 24h
                    // or just pass it to getMatchStatus
                }

                displayStatus = getMatchStatus(time.replace(' PM', '').replace(' AM', '').trim(), match.status);
            }

            const card = document.createElement('div');
            card.className = 'match-card';
            // Make the whole card clickable
            card.style.cursor = 'pointer';
            card.onclick = () => {
                // Create query string with match details
                const params = new URLSearchParams({
                    home: match.home,
                    away: match.away,
                    homeLogo: match.homeLogo,
                    awayLogo: match.awayLogo,
                    score: match.score,
                    status: displayStatus.text, // Use dynamic status
                    league: match.league,
                    channel: match.channel,
                    commentator: match.commentator,
                    streamUrl: match.streamUrl
                });
                window.location.href = `watch.html?${params.toString()}`;
            };

            card.innerHTML = `
                <div class="match-card-content">
                    <div class="team home">
                        <img src="${match.homeLogo}" alt="${match.home}" class="team-logo-img">
                        <span class="team-name">${match.home}</span>
                    </div>
                    
                    <div class="match-center">
                        <div class="status-badge ${displayStatus.class}">${displayStatus.text}</div>
                        <div class="score">${match.score}</div>
                    </div>
                    
                    <div class="team away">
                        <img src="${match.awayLogo}" alt="${match.away}" class="team-logo-img">
                        <span class="team-name">${match.away}</span>
                    </div>
                </div>
                
                <div class="match-card-footer">
                    <div class="info-item league">🏆 ${match.league}</div>
                    <div class="info-item commentator">🎤 ${match.commentator}</div>
                    <div class="info-item channel">📺 ${match.channel}</div>
                </div>
            `;
            container.appendChild(card);
        });
    }



    // Tab Switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class
            tabs.forEach(t => t.classList.remove('active'));
            // Add active class
            tab.classList.add('active');

            // Render content
            const target = tab.getAttribute('data-target');
            renderMatches(target);
        });
    });

    // Link news cards to news.html
    const newsCards = document.querySelectorAll('.news-card');
    newsCards.forEach(card => {
        card.addEventListener('click', () => {
            window.location.href = 'news.html';
        });
    });

});
