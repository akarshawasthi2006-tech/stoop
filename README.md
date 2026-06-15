# ⚡ STOOP - The Athlete's Social Engine

Welcome to **STOOP**, a premium, high-fidelity fitness web application designed as a hybrid of **Strava** (onboarding flows, kudos interactions, activity feeds, live GPS route maps, community leaderboards) and **WHOOP** (screenless vital tracking, sleep scores, recovery gauges, cardiovascular strain indexes, and a live AI Performance Coach).

The project is built entirely on native web standards (HTML, JavaScript, and custom Vanilla CSS) backed by a lightweight server-less Python 3 backend data logger.

---

## 🚀 Instant Start Guide

You can run the STOOP application locally on your Mac using the pre-installed Python 3 engine.

1. **Open your Terminal** and navigate to the STOOP directory:
   ```bash
   cd /Users/akarshawasthi/Documents/stoop
   ```

2. **Start the Python Web Server**:
   ```bash
   python3 server.py
   ```
   *The server will initialize its local JSON databases and start listening on port 8000.*

3. **Open the App in your Browser**:
   Navigate to [http://localhost:8000](http://localhost:8000) on Chrome, Safari, or Firefox.

---

## 📂 Project Architecture

- **`index.html`**: Structured single-page application viewport with multi-views (Home, Onboarding Wizard, Vitals Dashboard, Support Ticket, Admin Panel).
- **`style.css`**: Responsive design system featuring custom grid variables, circular SVG progress animations, canvas map layouts, and high-contrast styling (Strava Orange & WHOOP Biotech Green).
- **`app.js`**: Core frontend application manager controlling routing, kudos persistence, workout loggers, HTML5 GPS route tracking, canvas radar fallback simulations, and AI Coach dispatches.
- **`server.py`**: Python 3 request handler serving static assets, logging queries to local databases (`queries.json` and `onboarding.json`), and routing requests securely to Gmail SMTP and Gemini APIs.
- **`config.json`**: Central unified configuration file for mail credentials and developer API keys (Auto-created on start).
- **`assets/`**: Generated adult lifestyle photography used by the landing page, feature cards, onboarding, dashboard, club, support, and activity feed.

---

## ✉️ Setting Up Gmail Alerts (`thisisakarsh02@gmail.com`)

When queries are registered or onboarding is completed, STOOP sends alert emails to **`thisisakarsh02@gmail.com`**. You can configure SMTP credentials (username and Google App Passwords) or a Web3Forms key inside **Admin Panel -> SMTP & API Keys** to activate delivery. For detailed steps, check the settings panel.

---

## 🤖 Activating Gemini AI Fitness Coach

STOOP includes an intelligent performance evaluation panel using the **Gemini 2.5 Flash** model. It analyzes the athlete's current recovery score, heart rate variability (HRV), resting heart rate (RHR), and strain levels.

To activate the live connection:
1. Obtain a free **Gemini API Key** from the Google AI Studio ([https://aistudio.google.com/](https://aistudio.google.com/)).
2. Go to STOOP **Admin Panel -> SMTP & API Keys**.
3. Input your key in the **Gemini Developer API Key** field and click **Save Settings**.
4. Return to your Dashboard, and click **Consult AI Coach** to view a live, personalized athletic analysis!
*(If no key is configured, the coach operates in a simulated local athletic feedback fallback mode).*

---

## 🧭 Live GPS Route Mapping

The dashboard contains a **Live GPS Route Tracker** that records coordinates using your browser's Geolocation API (`navigator.geolocation.watchPosition`) to track your runs.

- **Real Map View**: To load actual Google Maps vector terrain, get a **Maps Javascript API Key** from the Google Cloud Console ([https://console.cloud.google.com/](https://console.cloud.google.com/)), input it in the Admin settings panel, and click save. STOOP will load real-time mapping dynamically!
- **Simulator Fallback**: If you do not have a Google Maps key configured, or are testing the app indoors/offline, STOOP automatically launches an **HTML5 Radar Canvas Simulator** that visually generates coordinates drift, calculates speed, pace, and draws your active route path live! Stopping the tracker immediately commits the run to your Strava activity feed.
