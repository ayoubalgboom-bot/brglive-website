// Channels Page Logic
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('channels-container');

    if (!container) return; // Not on channels page

    const API_BASE = (window.CONFIG && window.CONFIG.apiBase) || 'http://localhost:3000/api/matches';
    const CHANNELS_API = API_BASE.replace('/matches', '/channels');

    // Fetch channels from API
    async function fetchChannels() {
        try {
            const response = await fetch(CHANNELS_API);
            if (response.ok) {
                const data = await response.json();
                renderChannels(data.channels || []);
            } else {
                showError('فشل في تحميل القنوات');
            }
        } catch (error) {
            console.error('Error fetching channels:', error);
            showError('خطأ في الاتصال بالخادم');
        }
    }

    // Render channels
    function renderChannels(channels) {
        container.innerHTML = '';

        if (channels.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:40px; color: var(--text-secondary);">لا توجد قنوات متاحة حالياً</div>';
            return;
        }

        channels.forEach(channel => {
            const card = document.createElement('div');
            card.className = 'match-card';
            card.style.cursor = 'pointer';

            card.onclick = () => {
                // Navigate to simplified channel watch page
                const params = new URLSearchParams({
                    name: channel.name,
                    logo: channel.logo,
                    category: channel.category || 'قناة تلفزيونية',
                    streamUrl: channel.streamUrl
                });
                window.location.href = `channel-watch.html?${params.toString()}`;
            };

            card.innerHTML = `
                <div class="match-card-content">
                    <div class="team home" style="width: 100%; justify-content: center;">
                        <img src="${channel.logo}" alt="${channel.name}" class="team-logo-img" style="width: 80px; height: 80px; object-fit: contain;">
                    </div>
                </div>
                
                <div class="match-card-footer">
                    <div class="info-item" style="text-align: center; width: 100%;">
                        <strong style="font-size: 1.1rem;">${channel.name}</strong>
                    </div>
                    <div class="info-item" style="text-align: center; width: 100%; color: var(--text-secondary); font-size: 0.9rem;">
                        ${channel.category || 'عام'}
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    // Show error message
    function showError(message) {
        container.innerHTML = `<div style="text-align:center; padding:40px; color: #e74c3c;">${message}</div>`;
    }

    // Load channels on page load
    fetchChannels();
});
