// ==========================================================================
// STOOP FRONTEND ENGINE (With Google Maps and Gemini AI Integrations)
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
    // -------------------------------------------------------------
    // 1. SPA ROUTER
    // -------------------------------------------------------------
    const views = document.querySelectorAll(".app-view");
    const navItems = document.querySelectorAll(".nav-item");
    const mobileMenu = document.getElementById("nav-menu");
    const mobileToggle = document.getElementById("mobile-toggle");

    function navigateToHash() {
        let hash = window.location.hash || "#home";
        
        // Remove active class from all views and nav links
        views.forEach(view => view.classList.remove("active"));
        navItems.forEach(item => item.classList.remove("active"));
        
        // Activate target view
        const targetViewId = "view-" + hash.replace("#", "");
        const targetView = document.getElementById(targetViewId);
        
        if (targetView) {
            targetView.classList.add("active");
            
            // Scroll to top of viewport
            window.scrollTo(0, 0);
            
            // Highlight matching nav item
            navItems.forEach(item => {
                if (item.getAttribute("href") === hash) {
                    item.classList.add("active");
                }
            });
        }
        
        // Close mobile menu
        if (mobileMenu) {
            mobileMenu.classList.remove("active");
        }
    }

    window.addEventListener("hashchange", navigateToHash);
    navigateToHash(); // Run on initial load

    // Mobile navigation toggle
    if (mobileToggle && mobileMenu) {
        mobileToggle.addEventListener("click", () => {
            mobileMenu.classList.toggle("active");
        });
    }

    // Logo click home route
    const logoLink = document.getElementById("logo-link");
    if (logoLink) {
        logoLink.addEventListener("click", (e) => {
            e.preventDefault();
            window.location.hash = "#home";
        });
    }

    // -------------------------------------------------------------
    // 2. STATE & USER PROFILE STORAGE
    // -------------------------------------------------------------
    let userState = {
        name: localStorage.getItem("stoop_name") || "Guest Athlete",
        email: localStorage.getItem("stoop_email") || "",
        tracker: localStorage.getItem("stoop_tracker") || "WHOOP Strap",
        age: localStorage.getItem("stoop_age") || "28",
        goals: JSON.parse(localStorage.getItem("stoop_goals")) || ["Cardiovascular Strain"],
        frequency: localStorage.getItem("stoop_frequency") || "Active: 3-4 workouts / week",
        // Simulated physiological variables
        recovery: 84,
        sleep: 90,
        hrv: 72,
        rhr: 52,
        strain: 15.8,
        totalKmLogged: 42.5
    };

    // Update UI elements with state values
    function syncStateWithUI() {
        const nameFields = document.querySelectorAll("#dash-athlete-name");
        nameFields.forEach(el => el.textContent = userState.name);

        const trackerBadge = document.getElementById("dash-tracker-badge");
        if (trackerBadge) {
            trackerBadge.textContent = userState.tracker;
            if (userState.tracker.includes("WHOOP")) {
                trackerBadge.className = "badge-green";
            } else if (userState.tracker.includes("Apple")) {
                trackerBadge.className = "badge badge-green";
                trackerBadge.style.color = "#FF4A4A";
                trackerBadge.style.borderColor = "rgba(255, 74, 74, 0.2)";
                trackerBadge.style.backgroundColor = "rgba(255, 74, 74, 0.05)";
            } else {
                trackerBadge.className = "badge badge-green";
                trackerBadge.style.color = "#FC6100";
                trackerBadge.style.borderColor = "rgba(252, 97, 0, 0.2)";
                trackerBadge.style.backgroundColor = "rgba(252, 97, 0, 0.05)";
            }
        }

        // Update Gauges
        updateGauge("recovery-circle", "recovery-number", userState.recovery, "%");
        updateGauge("sleep-circle", "sleep-number", userState.sleep, "%", `${(userState.sleep * 0.1).toFixed(1)} hrs`);
        
        const strainNum = document.getElementById("strain-number");
        const strainFill = document.getElementById("strain-fill");
        if (strainNum && strainFill) {
            strainNum.textContent = userState.strain.toFixed(1);
            strainFill.style.width = `${(userState.strain / 21) * 100}%`;
        }

        const hrvVal = document.getElementById("v-hrv");
        const rhrVal = document.getElementById("v-rhr");
        if (hrvVal && rhrVal) {
            hrvVal.textContent = `${userState.hrv} ms`;
            rhrVal.textContent = `${userState.rhr} bpm`;
        }
    }

    function updateGauge(circleId, textId, percent, suffix = "", subText = "") {
        const circle = document.getElementById(circleId);
        const text = document.getElementById(textId);
        if (!circle) return;

        const radius = circle.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        
        const offset = circumference - (percent / 100) * circumference;
        circle.style.strokeDashoffset = offset;

        if (text) {
            text.innerHTML = `${percent}${suffix}`;
            if (subText) {
                const parent = text.parentElement;
                const label = parent.querySelector(".gauge-label");
                if (label) label.textContent = subText;
            }
        }
    }

    // -------------------------------------------------------------
    // 3. ONBOARDING WIZARD
    // -------------------------------------------------------------
    const onboardingForm = document.getElementById("onboarding-form");
    const onboardingProgress = document.getElementById("onboarding-progress");
    const stepDots = document.querySelectorAll(".step-dot");
    const wizardSteps = document.querySelectorAll(".wizard-step");
    const btnBack = document.getElementById("btn-back");
    const btnNext = document.getElementById("btn-next");
    const btnSubmit = document.getElementById("btn-submit");
    const onbSuccess = document.getElementById("onb-success");

    let currentStep = 1;
    const totalSteps = 5;

    function showStep(step) {
        wizardSteps.forEach(s => s.classList.remove("active"));
        document.getElementById(`onb-step-${step}`).classList.add("active");
        
        stepDots.forEach((dot, idx) => {
            const dotStep = idx + 1;
            dot.classList.remove("active", "completed");
            if (dotStep === step) {
                dot.classList.add("active");
            } else if (dotStep < step) {
                dot.classList.add("completed");
            }
        });

        const percent = (step / totalSteps) * 100;
        if (onboardingProgress) {
            onboardingProgress.style.width = `${percent}%`;
        }

        btnBack.disabled = step === 1;
        if (step === totalSteps) {
            btnNext.style.display = "none";
            btnSubmit.style.display = "inline-flex";
        } else {
            btnNext.style.display = "inline-flex";
            btnSubmit.style.display = "none";
        }
    }

    btnNext.addEventListener("click", () => {
        if (validateStep(currentStep)) {
            currentStep++;
            showStep(currentStep);
        }
    });

    btnBack.addEventListener("click", () => {
        if (currentStep > 1) {
            currentStep--;
            showStep(currentStep);
        }
    });

    stepDots.forEach(dot => {
        dot.addEventListener("click", () => {
            const target = parseInt(dot.getAttribute("data-step"));
            if (target < currentStep || validateStep(currentStep)) {
                currentStep = target;
                showStep(currentStep);
            }
        });
    });

    function validateStep(step) {
        if (step === 1) {
            const name = document.getElementById("onb-name").value.trim();
            const email = document.getElementById("onb-email").value.trim();
            const age = document.getElementById("onb-age").value;
            
            if (!name || !email || !age) {
                alert("Please fill in your name, email, and age.");
                return false;
            }
            return true;
        }
        return true;
    }

    if (onboardingForm) {
        onboardingForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const emailStatusEl = document.getElementById("onb-email-status");
            btnSubmit.disabled = true;
            btnSubmit.textContent = "Registering...";

            const formData = new FormData(onboardingForm);
            
            const goals = [];
            document.querySelectorAll("input[name='goals']:checked").forEach(cb => {
                goals.push(cb.value);
            });

            const submitData = {
                name: formData.get("name"),
                email: formData.get("email"),
                age: formData.get("age"),
                tracker: formData.get("tracker"),
                goals: goals,
                frequency: formData.get("frequency"),
                query: formData.get("query")
            };

            userState.name = submitData.name;
            userState.email = submitData.email;
            userState.tracker = submitData.tracker;
            userState.age = submitData.age;
            userState.goals = submitData.goals;
            userState.frequency = submitData.frequency;

            localStorage.setItem("stoop_name", userState.name);
            localStorage.setItem("stoop_email", userState.email);
            localStorage.setItem("stoop_tracker", userState.tracker);
            localStorage.setItem("stoop_age", userState.age);
            localStorage.setItem("stoop_goals", JSON.stringify(userState.goals));
            localStorage.setItem("stoop_frequency", userState.frequency);

            syncStateWithUI();
            
            try {
                const response = await fetch("/api/onboarding", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(submitData)
                });
                
                const result = await response.json();
                
                onboardingForm.style.display = "none";
                onbSuccess.style.display = "block";
                
                if (result.email_sent) {
                    emailStatusEl.className = "status-msg text-green";
                    emailStatusEl.innerHTML = "✅ Notification email successfully sent to <strong>thisisakarsh02@gmail.com</strong>!";
                } else {
                    emailStatusEl.className = "status-msg text-muted";
                    emailStatusEl.innerHTML = "ℹ️ Onboarding logged in local database. Setup SMTP in the Admin Panel to enable email alerts.";
                }
            } catch (err) {
                console.error("Onboarding server error:", err);
                onboardingForm.style.display = "none";
                onbSuccess.style.display = "block";
                emailStatusEl.className = "status-msg text-muted";
                emailStatusEl.innerHTML = "⚠️ Backend offline. Submissions saved locally in browser memory.";
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.textContent = "Complete Onboarding";
            }
        });
    }

    const btnGoDashboard = document.getElementById("btn-go-dashboard");
    if (btnGoDashboard) {
        btnGoDashboard.addEventListener("click", () => {
            currentStep = 1;
            onboardingForm.reset();
            onboardingForm.style.display = "block";
            onbSuccess.style.display = "none";
            showStep(1);
            window.location.hash = "#dashboard";
        });
    }

    // -------------------------------------------------------------
    // 4. ACTIVITY FEED (STRAVA FEED SIMULATION)
    // -------------------------------------------------------------
    let activities = [
        {
            id: "act-1",
            athleteName: "Virat Kohli",
            athleteAvatar: "V",
            tracker: "WHOOP Strap",
            timeAgo: "2 hours ago",
            title: "Hard Cardiovascular Cardio intervals in Mumbai gym",
            type: "🏋️ Strength & HIIT",
            distance: null,
            duration: 75,
            strain: 16.2,
            kudos: 342,
            hasKudosed: false
        },
        {
            id: "act-2",
            athleteName: "Neeraj Chopra",
            athleteAvatar: "N",
            tracker: "Garmin Peak",
            timeAgo: "4 hours ago",
            title: "Restorative morning run in Patiala stadium",
            type: "🏃 Run",
            distance: 8.5,
            duration: 48,
            strain: 12.8,
            kudos: 184,
            hasKudosed: false
        },
        {
            id: "act-3",
            athleteName: "Cristiano Ronaldo",
            athleteAvatar: "C",
            tracker: "WHOOP Strap",
            timeAgo: "1 day ago",
            title: "Recovery active spin & hydrotherapy session",
            type: "🚴 Ride",
            distance: 22.0,
            duration: 55,
            strain: 10.4,
            kudos: 2452,
            hasKudosed: true
        }
    ];

    function renderFeed() {
        const feedContainer = document.getElementById("feed-items");
        if (!feedContainer) return;
        
        feedContainer.innerHTML = "";
        
        activities.forEach(activity => {
            const card = document.createElement("div");
            card.className = "activity-card";
            
            const distanceHtml = activity.distance ? `
                <div class="stat-item">
                    <span class="stat-label">Distance</span>
                    <span class="stat-val">${activity.distance.toFixed(1)} km</span>
                </div>
            ` : '';

            card.innerHTML = `
                <div class="activity-card-header">
                    <div class="act-avatar">${activity.athleteAvatar}</div>
                    <div class="act-meta">
                        <h5>${activity.athleteName}</h5>
                        <span class="act-time">${activity.timeAgo} • via ${activity.tracker}</span>
                    </div>
                </div>
                <h4 class="activity-title">${activity.title}</h4>
                <div class="activity-stats">
                    <div class="stat-item">
                        <span class="stat-label">Activity Type</span>
                        <span class="stat-val">${activity.type}</span>
                    </div>
                    ${distanceHtml}
                    <div class="stat-item">
                        <span class="stat-label">Duration</span>
                        <span class="stat-val">${activity.duration} mins</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Strain</span>
                        <span class="stat-val text-green">${activity.strain.toFixed(1)}</span>
                    </div>
                </div>
                <div class="activity-actions">
                    <button class="btn-kudos ${activity.hasKudosed ? 'kudosed' : ''}" data-id="${activity.id}">
                        <span class="kudos-heart">🧡</span>
                        <span>Give Kudos</span>
                    </button>
                    <span class="kudos-count">${activity.kudos} Kudos</span>
                </div>
            `;
            
            feedContainer.appendChild(card);
        });

        document.querySelectorAll(".btn-kudos").forEach(btn => {
            btn.addEventListener("click", () => {
                const actId = btn.getAttribute("data-id");
                toggleKudos(actId);
            });
        });
    }

    function toggleKudos(id) {
        const activity = activities.find(a => a.id === id);
        if (activity) {
            if (activity.hasKudosed) {
                activity.kudos--;
                activity.hasKudosed = false;
            } else {
                activity.kudos++;
                activity.hasKudosed = true;
            }
            renderFeed();
        }
    }

    const activityForm = document.getElementById("activity-form");
    if (activityForm) {
        activityForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const title = document.getElementById("act-title").value.trim();
            const type = document.getElementById("act-type").value;
            const distance = document.getElementById("act-distance").value ? parseFloat(document.getElementById("act-distance").value) : null;
            const duration = parseInt(document.getElementById("act-duration").value);

            if (!title || isNaN(duration)) return;

            let calculatedStrain = 4.0;
            if (type.includes("Run")) {
                calculatedStrain = Math.min(21.0, 8.0 + (duration / 8));
            } else if (type.includes("Ride")) {
                calculatedStrain = Math.min(21.0, 6.0 + (duration / 12));
            } else if (type.includes("Strength")) {
                calculatedStrain = Math.min(21.0, 7.0 + (duration / 10));
            } else {
                calculatedStrain = Math.min(21.0, 4.0 + (duration / 15));
            }

            postUserActivity(title, type, distance, duration, calculatedStrain);
            activityForm.reset();
        });
    }

    function postUserActivity(title, type, distance, duration, strain) {
        const newActivity = {
            id: `act-${Date.now()}`,
            athleteName: userState.name,
            athleteAvatar: userState.name.charAt(0).toUpperCase(),
            tracker: userState.tracker,
            timeAgo: "Just now",
            title: title,
            type: type,
            distance: distance,
            duration: duration,
            strain: strain,
            kudos: 0,
            hasKudosed: false
        };

        activities.unshift(newActivity);
        
        userState.strain = Math.min(21.0, userState.strain + (strain / 2));
        if (distance) {
            userState.totalKmLogged += distance;
        }
        
        userState.recovery = Math.max(30, Math.round(userState.recovery - (strain * 1.2)));
        userState.hrv = Math.max(40, Math.round(userState.hrv - (strain * 0.7)));
        userState.rhr = Math.min(90, Math.round(userState.rhr + (strain * 0.3)));

        syncStateWithUI();
        renderFeed();
        renderLeaderboard();
    }

    // -------------------------------------------------------------
    // 5. CLUB LEADERBOARD (STRAVA/WHOOP METRIC SWAPPING)
    // -------------------------------------------------------------
    let leaderboardAthletes = [
        { name: "Virat Kohli", tracker: "WHOOP Strap", strain: 18.4, distance: 34.5 },
        { name: "LeBron James", tracker: "WHOOP Strap", strain: 17.9, distance: 12.0 },
        { name: "Neeraj Chopra", tracker: "Garmin Peak", strain: 16.5, distance: 58.0 },
        { name: "Virgil van Dijk", tracker: "WHOOP Strap", strain: 15.2, distance: 28.4 },
        { name: "Rory McIlroy", tracker: "WHOOP Strap", strain: 12.1, distance: 15.6 }
    ];

    let currentLeaderboardMetric = "strain";

    function renderLeaderboard() {
        const lbContainer = document.getElementById("leaderboard-list");
        if (!lbContainer) return;

        lbContainer.innerHTML = "";

        let currentLeaderboard = [...leaderboardAthletes];
        
        const userIndex = currentLeaderboard.findIndex(a => a.name === userState.name);
        if (userIndex !== -1) {
            currentLeaderboard[userIndex].strain = userState.strain;
            currentLeaderboard[userIndex].distance = userState.totalKmLogged;
        } else {
            currentLeaderboard.push({
                name: userState.name,
                tracker: userState.tracker,
                strain: userState.strain,
                distance: userState.totalKmLogged
            });
        }

        if (currentLeaderboardMetric === "strain") {
            currentLeaderboard.sort((a, b) => b.strain - a.strain);
        } else {
            currentLeaderboard.sort((a, b) => b.distance - a.distance);
        }

        currentLeaderboard.forEach((athlete, index) => {
            const item = document.createElement("li");
            const isMe = athlete.name === userState.name;
            item.className = `leaderboard-item ${isMe ? 'me-user' : ''}`;
            
            const rank = index + 1;
            const scoreVal = currentLeaderboardMetric === "strain" 
                ? athlete.strain.toFixed(1) 
                : `${athlete.distance.toFixed(1)} km`;

            item.innerHTML = `
                <span class="rank-number">#${rank}</span>
                <div class="lb-athlete-info">
                    <span class="lb-athlete-name">${athlete.name} ${isMe ? '(You)' : ''}</span>
                    <span class="lb-device">${athlete.tracker}</span>
                </div>
                <span class="lb-score">${scoreVal}</span>
            `;
            
            lbContainer.appendChild(item);
        });
    }

    document.querySelectorAll(".lb-tab").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".lb-tab").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            
            currentLeaderboardMetric = tab.getAttribute("data-metric");
            renderLeaderboard();
        });
    });


    // -------------------------------------------------------------
    // 6. SUPPORT FORM (GMAIL DISPATCHER)
    // -------------------------------------------------------------
    const supportForm = document.getElementById("support-form");
    const supSuccess = document.getElementById("sup-success");
    const supError = document.getElementById("sup-error");
    const supLogs = document.getElementById("sup-logs");
    const btnSubmitSupport = document.getElementById("btn-submit-support");

    if (supportForm) {
        supportForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            btnSubmitSupport.disabled = true;
            btnSubmitSupport.textContent = "Dispatched query email...";
            supSuccess.style.display = "none";
            supError.style.display = "none";

            const payload = {
                name: document.getElementById("sup-name").value.trim(),
                email: document.getElementById("sup-email").value.trim(),
                subject: document.getElementById("sup-subject").value,
                message: document.getElementById("sup-message").value.trim()
            };

            try {
                const response = await fetch("/api/query", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    supSuccess.style.display = "flex";
                    supportForm.reset();
                    
                    if (result.email_sent) {
                        supLogs.innerHTML = `Mail dispatcher logs:\n` + result.logs.join("\n");
                        supLogs.className = "log-output-box text-green";
                    } else {
                        supLogs.innerHTML = `DB log: Success (ID: ${result.id})\n` + result.logs.join("\n");
                        supLogs.className = "log-output-box text-gray";
                    }
                } else {
                    supError.style.display = "flex";
                }
            } catch (err) {
                console.error("Support API failed:", err);
                supError.style.display = "flex";
            } finally {
                btnSubmitSupport.disabled = false;
                btnSubmitSupport.textContent = "Send Query Message";
            }
        });
    }

    // -------------------------------------------------------------
    // 7. GEMINI AI PERFORMANCE COACH
    // -------------------------------------------------------------
    const btnConsultAi = document.getElementById("btn-consult-ai");
    const aiLoader = document.getElementById("ai-coach-loader");
    const aiOutput = document.getElementById("ai-coach-output");

    if (btnConsultAi) {
        btnConsultAi.addEventListener("click", async () => {
            btnConsultAi.disabled = true;
            aiLoader.style.display = "block";
            aiOutput.style.display = "none";
            aiOutput.innerHTML = "";

            const payload = {
                name: userState.name,
                age: userState.age,
                tracker: userState.tracker,
                goals: userState.goals,
                frequency: userState.frequency,
                recovery: userState.recovery,
                sleep: userState.sleep,
                strain: userState.strain,
                hrv: userState.hrv,
                rhr: userState.rhr,
                distance: userState.totalKmLogged
            };

            try {
                const res = await fetch("/api/ai-coach", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                
                if (res.ok && data.success) {
                    aiOutput.innerHTML = parseMarkdown(data.analysis);
                    aiOutput.style.display = "block";
                } else {
                    aiOutput.innerHTML = `<p style="color:var(--text-red);">Failed to compile AI evaluation. Check server status logs.</p>`;
                    aiOutput.style.display = "block";
                }
            } catch (err) {
                aiOutput.innerHTML = `<p style="color:var(--text-red);">AI coach offline. Launch server.py locally to activate Gemini AI.</p>`;
                aiOutput.style.display = "block";
            } finally {
                btnConsultAi.disabled = false;
                aiLoader.style.display = "none";
            }
        });
    }

    // A helper function to parse simple markdown to HTML (H3, H4, lists, blockquotes, bold)
    function parseMarkdown(md) {
        let html = md;
        
        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
        
        // Blockquotes
        html = html.replace(/^\> (.*$)/gim, '<blockquote><p>$1</p></blockquote>');
        
        // Lists
        html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
        html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
        
        // Wrap <li> groups in <ul>
        // Match consecutive <li> blocks and wrap them
        html = html.replace(/(<li>.*<\/li>)/gms, '<ul>$1</ul>');
        
        // Bold text
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Paragraphs (split by double newline and wrap in p if not headers/lists/quotes)
        const parts = html.split(/\n\n+/);
        const formattedParts = parts.map(part => {
            const trimmed = part.trim();
            if (trimmed.startsWith("<h") || trimmed.startsWith("<ul") || trimmed.startsWith("<block")) {
                return trimmed;
            }
            return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
        });
        
        return formattedParts.join("");
    }

    // -------------------------------------------------------------
    // 8. GOOGLE MAPS & HTML5 GEOLOCATION TRACKING
    // -------------------------------------------------------------
    let map;
    let pathPolyline;
    let watchId = null;
    let isTracking = false;
    let trackingPoints = [];
    let trackDistance = 0.0;
    let trackingStartTime = null;
    let simulationInterval = null;
    let simAngle = 0; // for radar rotation

    const gpsStatusBadge = document.getElementById("gps-status-badge");
    const gpsSpeedVal = document.getElementById("gps-speed");
    const gpsPaceVal = document.getElementById("gps-pace");
    const gpsDistanceVal = document.getElementById("gps-distance");
    const btnStartGps = document.getElementById("btn-start-gps");
    const btnStopGps = document.getElementById("btn-stop-gps");
    const mapOverlay = document.getElementById("map-overlay");
    const mapViewport = document.getElementById("live-route-map");
    const canvasSim = document.getElementById("simulator-map-canvas");

    // Dynamic Google Maps Script loading hook
    window.initGoogleMap = function() {
        const mapsStatus = document.getElementById("lbl-maps-status");
        if (mapsStatus) {
            mapsStatus.className = "indicator-value indicator-green";
            mapsStatus.textContent = "Active";
        }
        
        if (mapOverlay) mapOverlay.style.display = "none";
        if (canvasSim) canvasSim.style.display = "none";

        const centerCoords = { lat: 18.9220, lng: 72.8340 }; // Mumbai Gateway coordinates
        map = new google.maps.Map(mapViewport, {
            center: centerCoords,
            zoom: 16,
            styles: [
                { elementType: "geometry", stylers: [{ color: "#0C0C0E" }] },
                { elementType: "labels.text.stroke", stylers: [{ color: "#0C0C0E" }] },
                { elementType: "labels.text.fill", stylers: [{ color: "#71717A" }] },
                { featureType: "road", elementType: "geometry", stylers: [{ color: "#1E1E22" }] },
                { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "rgba(255,255,255,0.05)" }] },
                { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#A0A0AB" }] },
                { featureType: "water", elementType: "geometry", stylers: [{ color: "#09090B" }] }
            ],
            disableDefaultUI: true
        });

        pathPolyline = new google.maps.Polyline({
            path: [],
            geodesic: true,
            strokeColor: "#FC6100",
            strokeOpacity: 1.0,
            strokeWeight: 4,
            map: map
        });
    };

    function loadGoogleMapsScript(apiKey) {
        if (window.google && window.google.maps) {
            window.initGoogleMap();
            return;
        }
        if (!apiKey) return;
        
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGoogleMap`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }

    // HTML5 Canvas Location tracking animation fallback (used if Maps is inactive or for simulated indoors test)
    function startCanvasSimulation() {
        if (!canvasSim) return;
        
        canvasSim.style.display = "block";
        if (mapOverlay) {
            mapOverlay.style.background = "rgba(12, 12, 14, 0.4)";
            mapOverlay.querySelector("span").textContent = "GPS Tracking Active (Simulating Location)";
        }
        
        const ctx = canvasSim.getContext("2d");
        const resizeCanvas = () => {
            canvasSim.width = mapViewport.clientWidth;
            canvasSim.height = mapViewport.clientHeight;
        };
        resizeCanvas();

        let points = [];
        let curX = canvasSim.width / 2;
        let curY = canvasSim.height / 2;

        simulationInterval = setInterval(() => {
            ctx.clearRect(0, 0, canvasSim.width, canvasSim.height);
            
            // Draw grid lines
            ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
            ctx.lineWidth = 1;
            const gridSpacing = 20;
            for(let x=0; x<canvasSim.width; x+=gridSpacing) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvasSim.height); ctx.stroke();
            }
            for(let y=0; y<canvasSim.height; y+=gridSpacing) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvasSim.width, y); ctx.stroke();
            }

            // Radar sweep sweep circle
            simAngle += 0.02;
            const centerX = canvasSim.width / 2;
            const centerY = canvasSim.height / 2;
            const maxRadius = Math.min(centerX, centerY) * 0.9;
            ctx.strokeStyle = "rgba(252, 97, 0, 0.15)";
            ctx.beginPath();
            ctx.arc(centerX, centerY, maxRadius, 0, 2*Math.PI);
            ctx.stroke();

            // Draw radar sweeping line
            ctx.strokeStyle = "rgba(252, 97, 0, 0.3)";
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX + maxRadius * Math.cos(simAngle), centerY + maxRadius * Math.sin(simAngle));
            ctx.stroke();

            // Simulate walking vector coordinate drift
            if (Math.random() > 0.6) {
                const angle = Math.random() * 2 * Math.PI;
                const dist = 3 + Math.random() * 4;
                curX += dist * Math.cos(angle);
                curY += dist * Math.sin(angle);
                
                // Keep boundary safe
                if (curX < 20 || curX > canvasSim.width - 20) curX = canvasSim.width / 2;
                if (curY < 20 || curY > canvasSim.height - 20) curY = canvasSim.height / 2;

                points.push({x: curX, y: curY});
                
                // Track simulated metrics
                trackDistance += 0.01 + Math.random() * 0.015;
                const speed = 8.5 + Math.random() * 2.0; // km/h
                const paceMin = Math.floor(60 / speed);
                const paceSec = Math.floor((60 / speed - paceMin) * 60);

                gpsDistanceVal.textContent = `${trackDistance.toFixed(2)} km`;
                gpsSpeedVal.textContent = `${speed.toFixed(1)} km/h`;
                gpsPaceVal.textContent = `${paceMin}:${paceSec < 10 ? '0' : ''}${paceSec} /km`;
            }

            // Draw polyline path
            if (points.length > 1) {
                ctx.beginPath();
                ctx.strokeStyle = "var(--orange-primary)";
                ctx.lineWidth = 3;
                ctx.lineCap = "round";
                ctx.moveTo(points[0].x, points[0].y);
                for(let i=1; i<points.length; i++) {
                    ctx.lineTo(points[i].x, points[i].y);
                }
                ctx.stroke();
            }

            // Draw current location beacon
            ctx.fillStyle = "var(--green-primary)";
            ctx.shadowColor = "var(--green-primary)";
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(curX, curY, 6, 0, 2*Math.PI);
            ctx.fill();
            ctx.shadowBlur = 0; // reset
        }, 100);
    }

    function stopCanvasSimulation() {
        if (simulationInterval) {
            clearInterval(simulationInterval);
            simulationInterval = null;
        }
        if (canvasSim) {
            canvasSim.style.display = "none";
        }
        if (mapOverlay) {
            mapOverlay.style.background = "rgba(12, 12, 14, 0.85)";
            mapOverlay.querySelector("span").textContent = "GPS Tracking Portal";
        }
    }

    // Geolocation handlers
    if (btnStartGps && btnStopGps) {
        btnStartGps.addEventListener("click", () => {
            isTracking = true;
            btnStartGps.disabled = true;
            btnStopGps.disabled = false;
            mapViewport.classList.add("tracking-active");
            gpsStatusBadge.textContent = "GPS Tracking Active";
            gpsStatusBadge.style.color = "var(--green-primary)";
            gpsStatusBadge.style.borderColor = "var(--green-primary)";

            trackDistance = 0.0;
            trackingPoints = [];
            trackingStartTime = Date.now();

            // Check if real Google Maps is running
            if (window.google && window.google.maps && map) {
                if (navigator.geolocation) {
                    watchId = navigator.geolocation.watchPosition(
                        (position) => {
                            const lat = position.coords.latitude;
                            const lng = position.coords.longitude;
                            const currentPos = new google.maps.LatLng(lat, lng);
                            
                            trackingPoints.push(currentPos);
                            pathPolyline.setPath(trackingPoints);
                            map.setCenter(currentPos);

                            const speed = position.coords.speed ? (position.coords.speed * 3.6) : (5.0 + Math.random() * 2.0); // convert m/s to km/h
                            
                            // Calculate cumulative distance using Haversine if multiple coordinates
                            if (trackingPoints.length > 1) {
                                const prev = trackingPoints[trackingPoints.length - 2];
                                const dist = google.maps.geometry.spherical.computeDistanceBetween(prev, currentPos) / 1000; // in km
                                trackDistance += dist;
                            }

                            const paceMin = Math.floor(60 / speed);
                            const paceSec = Math.floor((60 / speed - paceMin) * 60);

                            gpsDistanceVal.textContent = `${trackDistance.toFixed(2)} km`;
                            gpsSpeedVal.textContent = `${speed.toFixed(1)} km/h`;
                            gpsPaceVal.textContent = `${paceMin}:${paceSec < 10 ? '0' : ''}${paceSec} /km`;
                        },
                        (err) => {
                            console.error("GPS Watch error:", err);
                        },
                        { enableHighAccuracy: true, timeout: 5000 }
                    );
                }
            } else {
                // Fallback simulation canvas animation
                startCanvasSimulation();
            }
        });

        btnStopGps.addEventListener("click", () => {
            isTracking = false;
            btnStartGps.disabled = false;
            btnStopGps.disabled = true;
            mapViewport.classList.remove("tracking-active");
            gpsStatusBadge.textContent = "GPS Offline";
            gpsStatusBadge.style.color = "var(--text-secondary)";
            gpsStatusBadge.style.borderColor = "var(--border-color)";

            const durationSec = Math.floor((Date.now() - trackingStartTime) / 1000);
            const durationMin = Math.max(1, Math.floor(durationSec / 60));

            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
                watchId = null;
            } else {
                stopCanvasSimulation();
            }

            // Post logged GPS run to active Strava feed automatically!
            if (trackDistance > 0.05) {
                postUserActivity(
                    `Live GPS Tracker Route Run`,
                    `🏃 Run`,
                    trackDistance,
                    durationMin,
                    Math.min(21.0, 7.0 + (durationMin / 8))
                );
                alert(`Workout saved! Logged ${trackDistance.toFixed(2)} km run in the STOOP activity feed.`);
            } else {
                alert("Tracking session stopped. Distance logged was too short to post on feed.");
            }

            // Reset dashboard route values
            gpsDistanceVal.textContent = "0.00 km";
            gpsSpeedVal.textContent = "0.0 km/h";
            gpsPaceVal.textContent = "0:00 /km";
        });
    }

    // -------------------------------------------------------------
    // 9. ADMIN DASHBOARD & SMTP/KEYS INTEGRATION
    // -------------------------------------------------------------
    const adminTabs = document.querySelectorAll(".admin-tab");
    const adminTabContents = document.querySelectorAll(".admin-tab-content");

    adminTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            adminTabs.forEach(t => t.classList.remove("active"));
            adminTabContents.forEach(c => c.classList.remove("active"));
            
            tab.classList.add("active");
            const target = tab.getAttribute("data-target");
            document.getElementById(target).classList.add("active");

            if (target === "admin-queries-tab") {
                fetchAdminQueries();
            } else if (target === "admin-onboarding-tab") {
                fetchAdminOnboardings();
            } else if (target === "admin-smtp-tab") {
                fetchAdminSmtpConfig();
            }
        });
    });

    document.getElementById("btn-refresh-queries")?.addEventListener("click", fetchAdminQueries);
    document.getElementById("btn-refresh-onboarding")?.addEventListener("click", fetchAdminOnboardings);

    async function fetchAdminQueries() {
        const tbody = document.getElementById("tbl-queries-body");
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-gray">Refreshing queries...</td></tr>`;

        try {
            const res = await fetch("/api/admin/queries");
            const data = await res.json();
            
            if (data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="text-center text-gray">No contact queries logged yet.</td></tr>`;
                return;
            }

            tbody.innerHTML = "";
            data.forEach(item => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>${item.id}</strong></td>
                    <td class="text-gray">${item.timestamp}</td>
                    <td>${item.name}</td>
                    <td><a href="mailto:${item.email}" style="color:var(--orange-primary);">${item.email}</a></td>
                    <td><span class="badge-green" style="background:rgba(255,255,255,0.05);color:white;border:none;">${item.subject}</span></td>
                    <td class="admin-table-query-cell" title="${item.message}">${item.message}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-red">Error: Failed to fetch backend queries.</td></tr>`;
        }
    }

    async function fetchAdminOnboardings() {
        const tbody = document.getElementById("tbl-onboarding-body");
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-gray">Refreshing onboarding profiles...</td></tr>`;

        try {
            const res = await fetch("/api/admin/onboarding");
            const data = await res.json();

            if (data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" class="text-center text-gray">No athlete profiles onboarded yet.</td></tr>`;
                return;
            }

            tbody.innerHTML = "";
            data.forEach(item => {
                const tr = document.createElement("tr");
                const goalsStr = Array.isArray(item.goals) ? item.goals.join(", ") : "None";
                tr.innerHTML = `
                    <td><strong>${item.id}</strong></td>
                    <td class="text-gray">${item.timestamp}</td>
                    <td>${item.name}</td>
                    <td><a href="mailto:${item.email}" style="color:var(--green-primary);">${item.email}</a></td>
                    <td>${item.tracker}</td>
                    <td style="font-size:12px;color:var(--text-secondary);">${goalsStr}</td>
                    <td>${item.frequency}</td>
                    <td class="admin-table-query-cell" title="${item.query || ''}">${item.query || '-'}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-red">Error: Failed to fetch onboarding records.</td></tr>`;
        }
    }

    async function fetchAdminSmtpConfig() {
        try {
            const res = await fetch("/api/admin/smtp");
            const config = await res.json();

            document.getElementById("cfg-smtp-host").value = config.smtp_host;
            document.getElementById("cfg-smtp-port").value = config.smtp_port;
            document.getElementById("cfg-smtp-user").value = config.smtp_user;
            
            // API key settings inputs
            document.getElementById("cfg-smtp-pass").value = "";
            document.getElementById("cfg-gemini-key").value = "";
            document.getElementById("cfg-maps-key").value = config.google_maps_key || "";

            const smtpStatus = document.getElementById("lbl-smtp-status");
            const web3Status = document.getElementById("lbl-web3-status");
            const geminiStatus = document.getElementById("lbl-gemini-status");
            const mapsStatus = document.getElementById("lbl-maps-status");

            if (config.smtp_pass_configured) {
                smtpStatus.className = "indicator-value indicator-green";
                smtpStatus.textContent = "Active";
            } else {
                smtpStatus.className = "indicator-value indicator-red";
                smtpStatus.textContent = "Inactive";
            }

            if (config.web3forms_key_configured) {
                web3Status.className = "indicator-value indicator-green";
                web3Status.textContent = "Active";
            } else {
                web3Status.className = "indicator-value indicator-red";
                web3Status.textContent = "Inactive";
            }

            if (config.gemini_key_configured) {
                geminiStatus.className = "indicator-value indicator-green";
                geminiStatus.textContent = "Active";
            } else {
                geminiStatus.className = "indicator-value indicator-red";
                geminiStatus.textContent = "Inactive";
            }

            if (config.google_maps_key_configured) {
                mapsStatus.className = "indicator-value indicator-green";
                mapsStatus.textContent = "Active";
                
                // If API Key is configured, load the Google Maps Javascript API dynamically
                loadGoogleMapsScript(config.google_maps_key);
            } else {
                mapsStatus.className = "indicator-value indicator-red";
                mapsStatus.textContent = "Inactive";
            }
        } catch (err) {
            console.error("Failed to load configs settings:", err);
        }
    }

    const smtpForm = document.getElementById("smtp-settings-form");
    if (smtpForm) {
        smtpForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const btnSave = document.getElementById("btn-save-smtp");
            btnSave.disabled = true;
            btnSave.textContent = "Saving...";

            const payload = {
                smtp_host: document.getElementById("cfg-smtp-host").value.trim(),
                smtp_port: parseInt(document.getElementById("cfg-smtp-port").value),
                smtp_user: document.getElementById("cfg-smtp-user").value.trim(),
                web3forms_key: document.getElementById("cfg-web3forms-key").value.trim(),
                google_maps_key: document.getElementById("cfg-maps-key").value.trim()
            };

            const pass = document.getElementById("cfg-smtp-pass").value.trim();
            if (pass) {
                payload.smtp_pass = pass;
            }

            const gemini = document.getElementById("cfg-gemini-key").value.trim();
            if (gemini) {
                payload.gemini_key = gemini;
            }

            try {
                const response = await fetch("/api/admin/smtp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                const res = await response.json();
                if (res.success) {
                    alert("Configuration keys saved successfully!");
                    fetchAdminSmtpConfig();
                } else {
                    alert("Error saving API keys.");
                }
            } catch (err) {
                alert("Failed to contact backend. Verify server is running.");
            } finally {
                btnSave.disabled = false;
                btnSave.textContent = "Save Configuration Settings";
            }
        });
    }

    const btnTestEmail = document.getElementById("btn-test-email");
    const testLogsOutput = document.getElementById("test-logs-output");
    const testLogsContent = document.getElementById("test-logs-content");

    if (btnTestEmail) {
        btnTestEmail.addEventListener("click", async () => {
            btnTestEmail.disabled = true;
            btnTestEmail.textContent = "Sending Test...";
            testLogsOutput.style.display = "block";
            testLogsContent.textContent = "Dispatching test message...";

            try {
                const response = await fetch("/api/admin/test-email", {
                    method: "POST"
                });
                const res = await response.json();
                
                if (response.ok && res.success) {
                    testLogsContent.textContent = "✅ SUCCESS: Verification mail delivered!\n\n" + res.logs.join("\n");
                    testLogsContent.style.color = "#00FF66";
                } else {
                    testLogsContent.textContent = "❌ ERROR: SMTP delivery failed. Read traceback below:\n\n" + (res.logs ? res.logs.join("\n") : "Server error.");
                    testLogsContent.style.color = "#FF4A4A";
                }
                
                fetchAdminSmtpConfig();
            } catch (err) {
                testLogsContent.textContent = "❌ CONNECTION FAILED: Backend offline.";
                testLogsContent.style.color = "#FF4A4A";
            } finally {
                btnTestEmail.disabled = false;
                btnTestEmail.textContent = "Send Test Verification Email";
            }
        });
    }

    // -------------------------------------------------------------
    // 10. BOOTSTRAP INITIALIZATION
    // -------------------------------------------------------------
    syncStateWithUI();
    renderFeed();
    renderLeaderboard();
    showStep(1);

    // Initial check for settings parameters (leads script loader check for Maps/Gemini indicator updates)
    fetchAdminSmtpConfig();
});
