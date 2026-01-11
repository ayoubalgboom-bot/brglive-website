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
    const fallbackMatchesData = {
        today: [
            {
                home: 'برشلونة', away: 'ريال مدريد', score: '0 - 0', status: '23:00', time: '23:00',
                league: 'الدوري الإسباني', channel: 'beIN Sports 1', commentator: 'عصام الشوالي',
                homeLogo: 'assets/barcelona.png', awayLogo: 'assets/real_madrid.png',
                streamUrl: 'http://het129c.ycn-redirect.com/live/918454578001/index.m3u8?t=dt_PzZsOxY6_xqEQ7PGKtw&e=1768111577'
            }
        ],
        yesterday: [],
        tomorrow: []
    };

    let matchesData = fallbackMatchesData;

    // Fetch matches from API or matches.json depending on environment
    async function fetchMatchesFromAPI() {
        try {
            const source = CONFIG.getMatchesSource();

            if (!source) {
                console.warn('⚠️ No matches source configured');
                return false;
            }

            console.log('📡 Fetching matches from:', source);
            const response = await fetch(source);

            if (response.ok) {
                const data = await response.json();
                matchesData = data;
                console.log('✅ Matches loaded successfully');
                return true;
            } else {
                console.error('❌ Failed to fetch matches:', response.status);
            }
        } catch (error) {
            console.warn('⚠️ Error fetching matches:', error);

            // In production, if matches.json fails, there's no fallback
            // In development, we already tried the API
            if (CONFIG.isDevelopment) {
                console.log('💡 Using fallback data');
            }
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

    function renderMatches(day) {
        container.innerHTML = '';
        const matches = matchesData[day] || [];

        if (matches.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:20px;">لا توجد مباريات لعرضها</div>';
            return;
        }

        matches.forEach(match => {
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
                    status: match.status,
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
                        <div class="status-badge ${match.status === 'جاري الآن' ? 'live' : ''}">${match.status}</div>
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
