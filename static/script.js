/**
 * SchemeHelper.AI — Elite Frontend Logic
 * Gemini AI Integration · Voice Input · Multi-lingual · Animated Meter · Direct Apply Links
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("SchemeHelper.AI — Citizen Command Center Online.");

    // ── Language Map ───────────────────────────────────────────────────────────
    const translations = {
        'Eng': {
            'hero_h1': 'Find Your <em>Right Scheme</em><br>in Under 60 Seconds',
            'search_placeholder': "e.g. woman farmer from Madurai, age 35, income ₹1.2L..."
        },
        'Tamil': {
            'hero_h1': 'உங்கள் <em>சரியான திட்டத்தை</em><br>60 வினாடிகளில் கண்டறியுங்கள்',
            'search_placeholder': "உ.ம்: மதுரையைச் சேர்ந்த பெண் விவசாயி, வயது 35, வருமானம் ₹1.2L..."
        }
    };

    // ── Language Toggle Button ─────────────────────────────────────────────────
    const langBtn = document.getElementById('lang-btn') || document.querySelector('.language-toggle');
    let currentLang = 'Eng';
    if (langBtn) {
        langBtn.addEventListener('click', () => {
            currentLang = (currentLang === 'Eng') ? 'Tamil' : 'Eng';
            langBtn.textContent = currentLang === 'Eng' ? '🌐 Eng ▾' : '🌐 தமிழ் ▾';
            const t = translations[currentLang];
            const heroH1 = document.querySelector('.hero h1');
            if (heroH1) heroH1.innerHTML = t['hero_h1'];
            const searchInput = document.getElementById('scheme-search');
            if (searchInput) searchInput.placeholder = t['search_placeholder'];
        });
    }

    // ── Voice Input (Web Speech API) ───────────────────────────────────────────
    const voiceTrigger = document.getElementById('voice-trigger');
    const searchInput = document.getElementById('scheme-search');
    if (voiceTrigger && searchInput) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.lang = 'en-IN';
            voiceTrigger.addEventListener('click', () => {
                recognition.start();
                voiceTrigger.classList.add('active');
                searchInput.placeholder = "🎤 Listening...";
            });
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                searchInput.value = transcript;
                voiceTrigger.classList.remove('active');
                searchInput.placeholder = translations['Eng']['search_placeholder'];
                if (transcript.length > 5) {
                    setTimeout(() => { window.location.href = `/dashboard?q=${encodeURIComponent(transcript)}`; }, 800);
                }
            };
        }
    }

    // ── AI Eligibility Form Submission ─────────────────────────────────────────
    const eliteForm = document.getElementById('elite-eligibility-form');
    if (eliteForm) {
        eliteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = eliteForm.querySelector('button[type="submit"]');
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-brain fa-spin"></i> Analyzing with Gemini AI...';
            btn.disabled = true;

            const data = Object.fromEntries(new FormData(eliteForm).entries());
            try {
                const res = await fetch('/api/predict_schemes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await res.json();
                animateCircularMeter(result.score || 0);
                displayRecommendations(result.recommendations || []);
                const statusEl = document.getElementById('match-status');
                if (statusEl) {
                    statusEl.textContent = `AI found ${result.recommendations.length} high-match scheme${result.recommendations.length !== 1 ? 's' : ''}.`;
                    statusEl.style.color = 'var(--green)';
                    statusEl.style.fontWeight = '700';
                }
            } catch (err) {
                console.error("AI fetch error:", err);
                const statusEl = document.getElementById('match-status');
                if (statusEl) { statusEl.textContent = "Connection error. Please try again."; statusEl.style.color = 'var(--red)'; }
            } finally {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
            }
        });
    }
});

// ── Animated Circular Score Meter ─────────────────────────────────────────────
function animateCircularMeter(score) {
    const circle = document.getElementById('meter-circle');
    const scoreText = document.getElementById('score-val');
    if (!circle || !scoreText) return;
    const circumference = 2 * Math.PI * 85; // r=85 matches SVG
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = circumference - (score / 100) * circumference;
    let count = 0;
    const step = Math.max(1, Math.floor(score / 60));
    const interval = setInterval(() => {
        count = Math.min(count + step, score);
        scoreText.textContent = count;
        if (count >= score) clearInterval(interval);
    }, 20);
}

// ── Store last AI results for comparison use ──────────────────────────────────
let _lastRecommendations = [];

// ── Render Scheme Result Cards with Direct Apply Links ────────────────────────
function displayRecommendations(schemes) {
    const container = document.getElementById('recommended-schemes');
    if (!container) return;
    container.innerHTML = '';

    if (!schemes.length) {
        container.innerHTML = `
            <div style="text-align:center;padding:60px 20px;color:var(--text-muted);">
                <i class="fa-solid fa-circle-info" style="font-size:2.5rem;display:block;margin-bottom:16px;opacity:0.3;"></i>
                <p>No schemes matched your profile. Try changing Occupation or Income.</p>
            </div>`;
        return;
    }

    _lastRecommendations = schemes;
    schemes.forEach((scheme) => {
        // Tags
        const tagsHtml = (scheme.tags || []).slice(0, 3).map(t =>
            `<span style="display:inline-flex;align-items:center;padding:3px 10px;
             background:var(--navy-light);color:var(--navy);border-radius:999px;
             font-size:0.72rem;font-weight:700;">${t}</span>`
        ).join(' ');

        // Jurisdiction badge
        const jurisdictionBadge = scheme.jurisdiction === 'Tamil Nadu'
            ? `<span style="padding:3px 10px;background:#fef3c7;color:#92400e;border-radius:999px;font-size:0.72rem;font-weight:700;">🏛 Tamil Nadu</span>`
            : `<span style="padding:3px 10px;background:#e0f2fe;color:#075985;border-radius:999px;font-size:0.72rem;font-weight:700;">🇮🇳 Central Govt.</span>`;

        // Apply Now — direct official link (opens in new tab)
        const applyBtn = scheme.apply_url
            ? `<a href="${scheme.apply_url}"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open official application portal: ${scheme.apply_url}"
                  style="display:inline-flex;align-items:center;gap:8px;padding:12px 24px;
                         background:var(--saffron);color:#fff;border:none;border-radius:999px;
                         font-size:0.88rem;font-weight:700;cursor:pointer;text-decoration:none;
                         box-shadow:0 4px 16px rgba(249,115,22,0.35);white-space:nowrap;
                         transition:background 0.2s,transform 0.2s;"
                  onmouseover="this.style.background='#ea6c00';this.style.transform='translateY(-2px)'"
                  onmouseout="this.style.background='var(--saffron)';this.style.transform='translateY(0)'">
                   <i class="fa-solid fa-arrow-up-right-from-square"></i> Apply Now
               </a>`
            : `<button disabled style="padding:12px 24px;background:#e2e8f0;color:#94a3b8;
                         border:none;border-radius:999px;font-size:0.88rem;font-weight:700;cursor:not-allowed;">
                   Apply Now
               </button>`;

        // Short domain label under the Apply button
        const domainLabel = scheme.apply_url
            ? `<small style="display:block;text-align:center;font-size:0.7rem;
                             color:var(--text-muted);margin-top:4px;word-break:break-all;">
                   ${new URL(scheme.apply_url).hostname}
               </small>`
            : '';

        const card = document.createElement('div');
        card.className = 'scheme-result-card';
        card.style.marginBottom = '16px';
        card.innerHTML = `
            <!-- Scheme Info -->
            <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
                    <span class="scheme-tag">${scheme.sector || 'General'}</span>
                    ${jurisdictionBadge}
                </div>
                <h4 style="font-family:'Outfit',sans-serif;font-weight:700;font-size:1.05rem;
                           color:var(--navy-dark);margin-bottom:6px;">${scheme.name}</h4>
                <p style="font-size:0.88rem;color:var(--text-secondary);line-height:1.55;margin-bottom:10px;">
                    <i class="fa-solid fa-gift" style="color:var(--saffron);margin-right:6px;"></i>${scheme.benefits}
                </p>
                ${scheme.ministry
                ? `<p style="font-size:0.78rem;color:var(--text-muted);">
                           <i class="fa-solid fa-building-columns" style="margin-right:5px;"></i>${scheme.ministry}
                       </p>`
                : ''}
                <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;">${tagsHtml}</div>
            </div>

            <!-- Action Buttons -->
            <div style="display:flex;flex-direction:column;align-items:stretch;gap:10px;
                        flex-shrink:0;margin-left:24px;min-width:140px;">
                <div style="text-align:center;">
                    ${applyBtn}
                    ${domainLabel}
                </div>
                <button onclick="window.openSchemeGuide(${scheme.id}, '${scheme.name.replace(/'/g, "\\'")}')"
                        style="padding:10px 20px;background:#f8fafc;color:var(--navy);
                               border:1.5px solid var(--border);border-radius:999px;
                               font-size:0.85rem;font-weight:700;cursor:pointer;
                               display:flex;align-items:center;justify-content:center;gap:6px;
                               transition:all 0.2s;"
                        onmouseover="this.style.background='#f1f5f9';this.style.borderColor='var(--navy)'"
                        onmouseout="this.style.background='#f8fafc';this.style.borderColor='var(--border)'">
                    <i class="fa-solid fa-wand-magic-sparkles" style="color:var(--saffron);"></i> How to Apply
                </button>
                <button onclick="window.compareScheme('${scheme.name.replace(/'/g, "\\'")}')"
                        style="padding:10px 20px;background:transparent;color:var(--navy);
                               border:1.5px solid var(--navy);border-radius:999px;
                               font-size:0.85rem;font-weight:700;cursor:pointer;
                               display:flex;align-items:center;justify-content:center;gap:6px;
                               transition:all 0.2s;"
                        onmouseover="this.style.background='var(--navy)';this.style.color='#fff'"
                        onmouseout="this.style.background='transparent';this.style.color='var(--navy)'">
                    <i class="fa-solid fa-code-compare"></i> Compare
                </button>
            </div>`;
        container.appendChild(card);
    });
}

// ── Chatbot ────────────────────────────────────────────────────────────────────
window.toggleChat = function () {
    const chat = document.getElementById('elite-chat-panel');
    if (!chat) return;
    const isOpen = chat.style.display === 'flex';
    chat.style.display = isOpen ? 'none' : 'flex';
};

window.sendChatMessage = async function () {
    const input = document.getElementById('chat-input');
    const stream = document.getElementById('chat-stream');
    if (!input || !input.value.trim()) return;

    // User bubble
    const userMsg = document.createElement('div');
    userMsg.style.cssText = "background:var(--navy);color:#fff;padding:10px 15px;border-radius:12px 12px 2px 12px;margin-bottom:10px;font-size:0.88rem;align-self:flex-end;max-width:80%;margin-left:auto;";
    userMsg.textContent = input.value;
    stream.appendChild(userMsg);
    const query = input.value;
    input.value = '';
    stream.scrollTop = stream.scrollHeight;

    // Bot thinking bubble
    const botMsg = document.createElement('div');
    botMsg.style.cssText = "background:#f1f5f9;padding:10px 15px;border-radius:12px 12px 12px 2px;margin-bottom:10px;font-size:0.88rem;max-width:85%;";
    botMsg.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="color:var(--saffron);"></i> Thinking...';
    stream.appendChild(botMsg);
    stream.scrollTop = stream.scrollHeight;

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        const data = await res.json();
        botMsg.textContent = data.answer;
    } catch {
        botMsg.textContent = "Sorry, I'm offline. Please try again later.";
    }
    stream.scrollTop = stream.scrollHeight;
};

// Allow Enter key to send chat
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.activeElement.id === 'chat-input') {
        window.sendChatMessage();
    }
});

// ── Comparison Modal ───────────────────────────────────────────────────────────
window.compareScheme = function (name) {
    const modal = document.getElementById('compare-modal');
    const col1 = document.getElementById('compare-1');
    const col2 = document.getElementById('compare-2');

    // Find the selected scheme from last results
    const selected = _lastRecommendations.find(s => s.name === name);
    // Pick best alternative (first result that isn't selected)
    const alt = _lastRecommendations.find(s => s.name !== name) || null;

    if (col1 && selected) {
        col1.innerHTML = `
            <h4 style="color:var(--navy-dark);font-size:1rem;font-weight:800;margin-bottom:10px;">${selected.name}</h4>
            <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:6px;">
                <i class="fa-solid fa-gift" style="color:var(--saffron);margin-right:6px;"></i><strong>Benefit:</strong> ${selected.benefits}</p>
            <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:6px;">
                <i class="fa-solid fa-tag" style="color:var(--navy);margin-right:6px;"></i><strong>Sector:</strong> ${selected.sector || 'General'}</p>
            <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:6px;">
                <i class="fa-solid fa-building-columns" style="color:var(--green);margin-right:6px;"></i><strong>Ministry:</strong> ${selected.ministry || '—'}</p>
            <p style="font-size:0.85rem;color:var(--text-secondary);">
                <i class="fa-solid fa-circle-check" style="color:var(--green);margin-right:6px;"></i><strong>Match:</strong> Your selected choice</p>
            ${selected.apply_url ? `<a href="${selected.apply_url}" target="_blank" rel="noopener"
                style="display:inline-flex;align-items:center;gap:6px;margin-top:14px;padding:10px 18px;
                background:var(--saffron);color:#fff;border-radius:999px;font-size:0.82rem;
                font-weight:700;text-decoration:none;">Apply Now <i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ''}`;
    } else if (col1) {
        col1.innerHTML = `<h4>${name}</h4><p style="color:var(--text-muted);font-size:0.85rem;">Submit the AI form to load full details.</p>`;
    }

    if (col2 && alt) {
        col2.innerHTML = `
            <h4 style="color:var(--navy-dark);font-size:1rem;font-weight:800;margin-bottom:10px;">${alt.name}</h4>
            <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:6px;">
                <i class="fa-solid fa-gift" style="color:var(--saffron);margin-right:6px;"></i><strong>Benefit:</strong> ${alt.benefits}</p>
            <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:6px;">
                <i class="fa-solid fa-tag" style="color:var(--navy);margin-right:6px;"></i><strong>Sector:</strong> ${alt.sector || 'General'}</p>
            <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:6px;">
                <i class="fa-solid fa-building-columns" style="color:var(--green);margin-right:6px;"></i><strong>Ministry:</strong> ${alt.ministry || '—'}</p>
            <p style="font-size:0.85rem;color:var(--text-secondary);">
                <i class="fa-solid fa-wand-magic-sparkles" style="color:var(--saffron);margin-right:6px;"></i><strong>AI Rank:</strong> #${_lastRecommendations.indexOf(alt) + 1} match</p>
            ${alt.apply_url ? `<a href="${alt.apply_url}" target="_blank" rel="noopener"
                style="display:inline-flex;align-items:center;gap:6px;margin-top:14px;padding:10px 18px;
                background:var(--navy);color:#fff;border-radius:999px;font-size:0.82rem;
                font-weight:700;text-decoration:none;">Apply Now <i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ''}`;
    }

    if (modal) modal.style.display = 'flex';
};

window.closeCompare = function () {
    const modal = document.getElementById('compare-modal');
    if (modal) modal.style.display = 'none';
};

// Opens Compare nav link — shows general scheme comparison guidance
window.openCompareNav = function (e) {
    e.preventDefault();
    const col1 = document.getElementById('compare-1');
    const col2 = document.getElementById('compare-2');
    if (_lastRecommendations.length >= 2) {
        // Auto-compare the top two AI-matched results
        const s1 = _lastRecommendations[0], s2 = _lastRecommendations[1];
        const makeCol = (s, rank) => `
            <h4 style="color:var(--navy-dark);font-size:1rem;font-weight:800;margin-bottom:10px;">${s.name}</h4>
            <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:6px;">
                <i class="fa-solid fa-gift" style="color:var(--saffron);margin-right:6px;"></i><strong>Benefit:</strong> ${s.benefits}</p>
            <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:6px;">
                <i class="fa-solid fa-tag" style="color:var(--navy);margin-right:6px;"></i><strong>Sector:</strong> ${s.sector || 'General'}</p>
            <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:6px;">
                <i class="fa-solid fa-building-columns" style="color:var(--green);margin-right:6px;"></i><strong>Ministry:</strong> ${s.ministry || '—'}</p>
            <p style="font-size:0.85rem;color:var(--text-secondary);">
                <i class="fa-solid fa-wand-magic-sparkles" style="color:var(--saffron);margin-right:6px;"></i><strong>AI Rank:</strong> #${rank}</p>
            ${s.apply_url ? `<a href="${s.apply_url}" target="_blank" rel="noopener"
                style="display:inline-flex;align-items:center;gap:6px;margin-top:14px;padding:10px 18px;
                background:var(--saffron);color:#fff;border-radius:999px;font-size:0.82rem;
                font-weight:700;text-decoration:none;">Apply Now <i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ''}`;
        if (col1) col1.innerHTML = makeCol(s1, 1);
        if (col2) col2.innerHTML = makeCol(s2, 2);
    } else {
        if (col1) col1.innerHTML = `<h4>Your Top Match</h4>
            <p style="color:var(--text-muted);font-size:0.85rem;margin-top:8px;">Complete the <strong>AI Finder</strong> on the Dashboard first to compare your matched schemes here.</p>`;
        if (col2) col2.innerHTML = `<h4>Runner-up Match</h4>
            <p style="color:var(--text-muted);font-size:0.85rem;margin-top:8px;">AI needs at least 2 matched schemes to populate this column.</p>`;
    }
    const modal = document.getElementById('compare-modal');
    if (modal) modal.style.display = 'flex';
};

// ── Tracker Modal ──────────────────────────────────────────────────────────────
window.openTracker = function (e) {
    e.preventDefault();
    const modal = document.getElementById('tracker-modal');
    if (modal) modal.style.display = 'flex';
};

window.closeTracker = function () {
    const modal = document.getElementById('tracker-modal');
    if (modal) modal.style.display = 'none';
};

// ── Help Center Modal ──────────────────────────────────────────────────────────
window.openHelpCenter = function (e) {
    e.preventDefault();
    const modal = document.getElementById('help-center-modal');
    if (modal) modal.style.display = 'flex';
};

window.closeHelpCenter = function () {
    const modal = document.getElementById('help-center-modal');
    if (modal) modal.style.display = 'none';
};

// ── FAQ Accordion inside Help Center ──────────────────────────────────────────
window.toggleFaq = function (item) {
    const answer = item.querySelector('.faq-a');
    const icon = item.querySelector('.faq-icon');
    const isOpen = answer.style.display === 'block';
    // Close all others
    document.querySelectorAll('.faq-item .faq-a').forEach(a => { a.style.display = 'none'; });
    document.querySelectorAll('.faq-item .faq-icon').forEach(i => { i.style.transform = 'rotate(0deg)'; });
    if (!isOpen) {
        answer.style.display = 'block';
        if (icon) icon.style.transform = 'rotate(180deg)';
    }
};

// ── Close modals on overlay click ─────────────────────────────────────────────
document.addEventListener('click', (e) => {
    if (e.target.id === 'compare-modal') window.closeCompare();
    if (e.target.id === 'tracker-modal') window.closeTracker();
    if (e.target.id === 'help-center-modal') window.closeHelpCenter();
    if (e.target.id === 'guide-modal') e.target.classList.remove('active');
});

// ── Application Guidance Modal ────────────────────────────────────────────────
window.openSchemeGuide = async function (schemeId, schemeName) {
    let modal = document.getElementById('guide-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'guide-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width:550px;">
                <div class="modal-header">
                    <h2><i class="fa-solid fa-wand-magic-sparkles" style="color:var(--saffron);margin-right:8px;"></i> Application Guide</h2>
                    <button class="modal-close" onclick="document.getElementById('guide-modal').classList.remove('active')">&times;</button>
                </div>
                <div class="modal-body">
                    <h3 id="guide-scheme-name" style="color:var(--navy-dark);margin-bottom:12px;font-size:1.1rem;"></h3>
                    <div id="guide-content" style="background:#f8fafc;padding:20px;border-radius:8px;border:1px solid var(--border);font-size:0.95rem;line-height:1.6;color:var(--text-secondary);">
                    </div>
                </div>
            </div>`;
        document.body.appendChild(modal);
    }
    document.getElementById('guide-scheme-name').textContent = schemeName;
    document.getElementById('guide-content').innerHTML = `
        <div style="text-align:center;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem;color:var(--saffron);margin-bottom:12px;"></i>
            <p>AI is generating step-by-step instructions...</p>
        </div>`;
    modal.style.display = 'flex'; // Use flex for centering overlay
    modal.classList.add('active'); // Keep class if needed for css

    try {
        const res = await fetch('/api/scheme_guide', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scheme_name: schemeName })
        });
        const data = await res.json();

        let formattedText = data.guide.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--navy);">$1</strong>');
        formattedText = formattedText.replace(/\*/g, '&bull;');
        formattedText = formattedText.split('\n').map(line => line.trim() ? `<p style="margin-bottom:8px;">${line}</p>` : '').join('');

        document.getElementById('guide-content').innerHTML = formattedText;
    } catch (err) {
        document.getElementById('guide-content').innerHTML = `
            <div style="color:var(--red);text-align:center;">
                <i class="fa-solid fa-triangle-exclamation"></i> Error fetching guidance.
            </div>`;
    }
};
// ── CSC Geolocation Map ─────────────────────────────────────────────────────────
window.locateNearbyCSC = function () {
    const placeholder = document.getElementById('csc-map-placeholder');
    const iframe = document.getElementById('csc-map-iframe');

    if (!placeholder || !iframe) return;

    placeholder.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right:8px;"></i> Locating your position...';

    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                // Load Google Maps embed with a search query around coordinates
                // Since this requires an API key in reality, we use a generic maps iframe url
                const mapUrl = `https://maps.google.com/maps?q=Common+Service+Centre&ll=${lat},${lng}&z=14&output=embed`;

                placeholder.style.display = 'none';
                iframe.src = mapUrl;
                iframe.style.display = 'block';
            },
            function (error) {
                placeholder.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="color:var(--red);margin-right:8px;"></i> Location access denied or unavailable.';
            }
        );
    } else {
        placeholder.innerHTML = "Geolocation is not supported by this browser.";
    }
};

// ── Fraud Detection Verification ──────────────────────────────────────────────
window.verifyScheme = async function () {
    const input = document.getElementById('verify-scheme-input');
    const resultBox = document.getElementById('fraud-detection-result');
    if (!input || !input.value.trim()) return;

    const schemeName = input.value.trim();

    resultBox.style.display = 'block';
    resultBox.style.background = '#f8fafc';
    resultBox.style.color = 'var(--text-secondary)';
    resultBox.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="color:var(--navy);margin-right:8px;"></i> Scanning official databases for authenticity...';

    try {
        const res = await fetch('/api/verify_fraud', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scheme_name: schemeName })
        });
        const data = await res.json();

        if (data.is_fraud) {
            resultBox.style.background = '#fef2f2';
            resultBox.style.color = '#991b1b';
            resultBox.style.border = '1px solid #fecaca';
            resultBox.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="font-size:1.2rem;margin-right:8px;"></i> <strong>Fraud Alert:</strong> ${data.message}`;
        } else {
            resultBox.style.background = '#f0fdf4';
            resultBox.style.color = '#166534';
            resultBox.style.border = '1px solid #bbf7d0';
            resultBox.innerHTML = `<i class="fa-solid fa-circle-check" style="font-size:1.2rem;margin-right:8px;"></i> <strong>Verified Official Scheme:</strong> ${data.message}`;
        }
    } catch (err) {
        resultBox.style.background = '#fef2f2';
        resultBox.style.color = 'var(--red)';
        resultBox.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Error verifying scheme. Try again later.';
    }
};
