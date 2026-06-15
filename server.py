#!/usr/bin/env python3
import os
import json
import ssl
import smtplib
from http.server import SimpleHTTPRequestHandler, HTTPServer
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import urllib.request
import urllib.parse

PORT = 8000
QUERIES_FILE = "queries.json"
ONBOARDING_FILE = "onboarding.json"
CONFIG_FILE = "config.json"
OLD_SMTP_FILE = "smtp_config.json"
RECIPIENT_EMAIL = "thisisakarsh02@gmail.com"

# Setup defaults for unified config
default_config = {
    "smtp_host": "smtp.gmail.com",
    "smtp_port": 465,
    "smtp_user": "",
    "smtp_pass": "",
    "web3forms_key": "",
    "gemini_key": "",
    "google_maps_key": ""
}

def load_json(filepath):
    try:
        with open(filepath, "r") as f:
            return json.load(f)
    except Exception:
        return []

def save_json(filepath, data):
    try:
        with open(filepath, "w") as f:
            json.dump(data, f, indent=4)
        return True
    except Exception as e:
        print(f"Error saving to {filepath}: {e}")
        return False

# Migrate old config parameters if they exist
if os.path.exists(OLD_SMTP_FILE):
    try:
        old_data = load_json(OLD_SMTP_FILE)
        if isinstance(old_data, dict):
            for k, v in old_data.items():
                if k in default_config:
                    default_config[k] = v
        os.remove(OLD_SMTP_FILE)
    except Exception as e:
        print(f"Migration error: {e}")

# Ensure config and database files exist
for filepath, default_data in [
    (QUERIES_FILE, []),
    (ONBOARDING_FILE, []),
    (CONFIG_FILE, default_config)
]:
    if not os.path.exists(filepath):
        with open(filepath, "w") as f:
            json.dump(default_data, f, indent=4)


def send_notification_email(subject, html_content, text_content=""):
    config = load_json(CONFIG_FILE)
    if not isinstance(config, dict):
        config = {}

    smtp_user = config.get("smtp_user", "")
    smtp_pass = config.get("smtp_pass", "")
    smtp_host = config.get("smtp_host", "smtp.gmail.com")
    smtp_port = config.get("smtp_port", 465)
    web3forms_key = config.get("web3forms_key", "")

    email_sent = False
    log_messages = []

    # 1. Try Python SMTP
    if smtp_user and smtp_pass:
        try:
            log_messages.append(f"Attempting SMTP delivery via {smtp_host}:{smtp_port} for user {smtp_user}...")
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = smtp_user
            msg["To"] = RECIPIENT_EMAIL

            part1 = MIMEText(text_content or "New query alert. Please check admin dashboard.", "plain")
            part2 = MIMEText(html_content, "html")
            msg.attach(part1)
            msg.attach(part2)

            if int(smtp_port) == 465:
                context = ssl.create_default_context()
                with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context) as server:
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(smtp_user, RECIPIENT_EMAIL, msg.as_string())
            else:
                with smtplib.SMTP(smtp_host, smtp_port) as server:
                    server.ehlo()
                    server.starttls()
                    server.ehlo()
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(smtp_user, RECIPIENT_EMAIL, msg.as_string())
            
            log_messages.append("SMTP email sent successfully!")
            email_sent = True
        except Exception as e:
            log_messages.append(f"SMTP delivery failed: {e}")

    # 2. Try Web3Forms fallback
    if not email_sent and web3forms_key:
        try:
            log_messages.append("Attempting Web3Forms API fallback...")
            url = "https://api.web3forms.com/submit"
            payload = {
                "access_key": web3forms_key,
                "subject": f"Web3Forms Fallback: {subject}",
                "from_name": "STOOP Local Server",
                "message": text_content or "Please log in to STOOP admin to view this submission.",
                "email": RECIPIENT_EMAIL
            }
            data = urllib.parse.urlencode(payload).encode("utf-8")
            req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
            with urllib.request.urlopen(req, timeout=10) as response:
                resp_data = json.loads(response.read().decode())
                if resp_data.get("success"):
                    log_messages.append("Web3Forms email fallback sent successfully!")
                    email_sent = True
                else:
                    log_messages.append(f"Web3Forms API rejected request: {resp_data}")
        except Exception as e:
            log_messages.append(f"Web3Forms fallback failed: {e}")

    if not email_sent:
        log_messages.append("WARNING: Notification email could not be delivered. Submission saved locally.")

    print("\n".join(log_messages))
    return email_sent, log_messages


class StoopRequestHandler(SimpleHTTPRequestHandler):
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path == "/api/admin/queries":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            queries = load_json(QUERIES_FILE)
            self.wfile.write(json.dumps(queries).encode())
            
        elif self.path == "/api/admin/onboarding":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            onboarding = load_json(ONBOARDING_FILE)
            self.wfile.write(json.dumps(onboarding).encode())

        elif self.path == "/api/admin/smtp":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            config = load_json(CONFIG_FILE)
            if not isinstance(config, dict):
                config = {}
            # Return sanitised configuration config to UI
            safe_config = {
                "smtp_host": config.get("smtp_host", "smtp.gmail.com"),
                "smtp_port": config.get("smtp_port", 465),
                "smtp_user": config.get("smtp_user", ""),
                "smtp_pass_configured": bool(config.get("smtp_pass", "")),
                "web3forms_key_configured": bool(config.get("web3forms_key", "")),
                "gemini_key_configured": bool(config.get("gemini_key", "")),
                "google_maps_key_configured": bool(config.get("google_maps_key", "")),
                "google_maps_key": config.get("google_maps_key", "") # Maps needs this key in client-side script
            }
            self.wfile.write(json.dumps(safe_config).encode())

        else:
            super().do_GET()

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
        except Exception:
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Invalid JSON format"}).encode())
            return

        if self.path == "/api/query":
            queries = load_json(QUERIES_FILE)
            
            new_id = f"Q-{int(datetime.now().timestamp())}"
            query_record = {
                "id": new_id,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "name": data.get("name", "Anonymous"),
                "email": data.get("email", ""),
                "subject": data.get("subject", "General Query"),
                "message": data.get("message", ""),
                "status": "unread"
            }
            queries.insert(0, query_record)
            save_json(QUERIES_FILE, queries)

            email_subject = f"🔴 [STOOP QUERY] New message from {query_record['name']}"
            email_text = f"STOOP Lead Alert!\n\nName: {query_record['name']}\nEmail: {query_record['email']}\nSubject: {query_record['subject']}\nMessage: {query_record['message']}\nTimestamp: {query_record['timestamp']}"
            email_html = f"""
            <html>
                <body style="font-family: Arial, sans-serif; color: #333; background-color: #f8f9fa; padding: 20px;">
                    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-top: 4px solid #FC6100;">
                        <h2 style="color: #FC6100; margin-top: 0;">🔥 STOOP Lead Registered</h2>
                        <p>A new customer has sent a support query on your website. Details:</p>
                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                            <tr style="background-color: #f1f3f5;"><td style="padding: 10px; font-weight: bold; width: 120px;">Name</td><td style="padding: 10px;">{query_record['name']}</td></tr>
                            <tr><td style="padding: 10px; font-weight: bold;">Email</td><td style="padding: 10px;"><a href="mailto:{query_record['email']}">{query_record['email']}</a></td></tr>
                            <tr style="background-color: #f1f3f5;"><td style="padding: 10px; font-weight: bold;">Subject</td><td style="padding: 10px;">{query_record['subject']}</td></tr>
                        </table>
                        <div style="background-color: #f8f9fa; border-left: 4px solid #00E676; padding: 15px; border-radius: 4px; font-style: italic; white-space: pre-wrap;">
                            "{query_record['message']}"
                        </div>
                    </div>
                </body>
            </html>
            """
            email_sent, mail_logs = send_notification_email(email_subject, email_html, email_text)

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "id": new_id,
                "email_sent": email_sent,
                "logs": mail_logs
            }).encode())

        elif self.path == "/api/onboarding":
            onboardings = load_json(ONBOARDING_FILE)
            
            new_id = f"ONB-{int(datetime.now().timestamp())}"
            onboarding_record = {
                "id": new_id,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "name": data.get("name", ""),
                "email": data.get("email", ""),
                "tracker": data.get("tracker", "None"),
                "goals": data.get("goals", []),
                "frequency": data.get("frequency", "Not Specified"),
                "query": data.get("query", "")
            }
            onboardings.insert(0, onboarding_record)
            save_json(ONBOARDING_FILE, onboardings)

            email_subject = f"🏃 [STOOP ONBOARDING] New Athlete Onboarded: {onboarding_record['name']}"
            goals_str = ", ".join(onboarding_record["goals"])
            email_text = f"STOOP Onboarding Completed!\n\nName: {onboarding_record['name']}\nEmail: {onboarding_record['email']}\nTracker: {onboarding_record['tracker']}\nGoals: {goals_str}"
            email_html = f"""
            <html>
                <body style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
                    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 20px; border-top: 4px solid #00E676;">
                        <h2 style="color: #00E676; margin-top: 0;">⚡ STOOP Athlete Registered</h2>
                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                            <tr style="background-color: #f1f3f5;"><td style="padding: 10px; font-weight: bold; width: 150px;">Name</td><td style="padding: 10px;">{onboarding_record['name']}</td></tr>
                            <tr><td style="padding: 10px; font-weight: bold;">Email</td><td style="padding: 10px;">{onboarding_record['email']}</td></tr>
                            <tr style="background-color: #f1f3f5;"><td style="padding: 10px; font-weight: bold;">Tracker</td><td style="padding: 10px;">{onboarding_record['tracker']}</td></tr>
                        </table>
                    </div>
                </body>
            </html>
            """
            email_sent, mail_logs = send_notification_email(email_subject, email_html, email_text)

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "id": new_id,
                "email_sent": email_sent,
                "logs": mail_logs
            }).encode())

        elif self.path == "/api/admin/smtp":
            config = load_json(CONFIG_FILE)
            if not isinstance(config, dict):
                config = {}
                
            config["smtp_host"] = data.get("smtp_host", "smtp.gmail.com")
            config["smtp_port"] = int(data.get("smtp_port", 465))
            config["smtp_user"] = data.get("smtp_user", "")
            
            if "smtp_pass" in data:
                config["smtp_pass"] = data["smtp_pass"]
            if "web3forms_key" in data:
                config["web3forms_key"] = data["web3forms_key"]
            if "gemini_key" in data:
                config["gemini_key"] = data["gemini_key"]
            if "google_maps_key" in data:
                config["google_maps_key"] = data["google_maps_key"]

            save_json(CONFIG_FILE, config)
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "message": "API configuration updated"}).encode())

        elif self.path == "/api/admin/test-email":
            test_subject = "🧪 STOOP - SMTP Configuration Test Successful"
            test_html = """
            <html>
                <body style="font-family: Arial, sans-serif; padding: 20px;">
                    <div style="max-width: 600px; margin: 0 auto; background: white; text-align: center; border-top: 4px solid #FC6100; padding: 20px;">
                        <h2 style="color: #FC6100;">🎉 SMTP Active!</h2>
                        <p>STOOP local mail delivery routing is fully configured.</p>
                    </div>
                </body>
            </html>
            """
            test_text = "STOOP SMTP configuration test successful!"
            email_sent, mail_logs = send_notification_email(test_subject, test_html, test_text)
            
            self.send_response(200 if email_sent else 500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": email_sent,
                "logs": mail_logs
            }).encode())

        elif self.path == "/api/ai-coach":
            # Handle AI fitness tracker evaluation using Gemini API
            config = load_json(CONFIG_FILE)
            if not isinstance(config, dict):
                config = {}
            
            gemini_key = config.get("gemini_key", "")
            
            # Fetch details from request
            athlete_name = data.get("name", "Athlete")
            age = data.get("age", "28")
            tracker = data.get("tracker", "WHOOP Strap")
            goals = ", ".join(data.get("goals", ["Cardiovascular Strain"]))
            frequency = data.get("frequency", "Active")
            recovery = data.get("recovery", 84)
            sleep = data.get("sleep", 90)
            strain = data.get("strain", 15.8)
            hrv = data.get("hrv", 72)
            rhr = data.get("rhr", 52)
            distance = data.get("distance", 0.0)

            # Define static fallback prompt response if Gemini is not set up
            fallback_coaching = f"""### ⚡ STOOP AI Performance Report (Simulation Mode)

Dear **{athlete_name}**, here is your physiological vital assessment based on your **{tracker}** metrics:

*   **Recovery Analysis ({recovery}% - Optimal)**: Your recovery is in the green zone. An HRV of **{hrv} ms** indicates high autonomic nervous system adaptability. You are well primed for a high-intensity session today.
*   **Sleep Performance ({sleep}%)**: You logged an excellent sleep cycle. Your resting heart rate of **{rhr} bpm** shows cardiovascular efficiency.
*   **Cardio Strain Budget ({strain:.1f})**: You have reached a daily cardiovascular strain of **{strain:.1f}**. Since your recovery is high, you can push your strain up to **18.5** today.
*   **Training Recommendation**: Plan a high-intensity interval session (HIIT) or a long endurance run today. Take advantage of this green recovery!

> **🔧 System Note**: To activate live Gemini intelligence coaching, input your Gemini API Key in the STOOP Admin Panel settings page."""

            if not gemini_key:
                # Return mock simulation
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": True,
                    "analysis": fallback_coaching,
                    "model": "Simulated Fallback Mode"
                }).encode())
                return

            # Construct Gemini API Request payload
            gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
            
            prompt_text = f"""You are the STOOP AI Athletic Coach, an elite sports scientist and physiological advisor blending WHOOP's health vitals intelligence and Strava's social training metrics.
Evaluate this athlete's fitness level and provide a motivating, scientific, and actionable coaching evaluation:

Athlete Profile:
- Name: {athlete_name}
- Age: {age}
- Hardware Tracker: {tracker}
- Primary Fitness Goals: {goals}
- Workout Frequency: {frequency}

Physiological Status Today:
- Recovery Score: {recovery}%
- Sleep Performance: {sleep}%
- Cardiovascular Strain Level: {strain} (scale: 0 to 21)
- Heart Rate Variability (HRV): {hrv} ms
- Resting Heart Rate (RHR): {rhr} bpm
- Running Distance Logged today: {distance:.1f} km

Provide a detailed evaluation of their current fitness level. Give concrete recommendations for:
1. Cardiovascular Strain target budget for today's workouts.
2. HRV and sleep-hygiene optimization tips.
3. Motivating training recommendation.

Use clean Markdown formatting. Use H3 and H4 headers, bold highlights, and clean bullet points. Keep it professional, direct, and concise."""

            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": prompt_text}
                        ]
                    }
                ]
            }

            try:
                req_data = json.dumps(payload).encode("utf-8")
                req = urllib.request.Request(
                    gemini_url,
                    data=req_data,
                    headers={"Content-Type": "application/json"}
                )
                
                with urllib.request.urlopen(req, timeout=15) as response:
                    resp = json.loads(response.read().decode())
                    
                    # Parse Gemini text output
                    candidates = resp.get("candidates", [])
                    if candidates:
                        content_parts = candidates[0].get("content", {}).get("parts", [])
                        if content_parts:
                            analysis_text = content_parts[0].get("text", "")
                            
                            self.send_response(200)
                            self.send_header("Content-Type", "application/json")
                            self.end_headers()
                            self.wfile.write(json.dumps({
                                "success": True,
                                "analysis": analysis_text,
                                "model": "gemini-2.5-flash"
                            }).encode())
                            return
                            
                    # If parse failed
                    raise Exception(f"Unexpected response structure: {resp}")

            except Exception as e:
                # Return fallback with error header
                error_notice = f"""### ⚠️ Gemini API Connection Error
STOOP backend failed to contact the Gemini service: `{str(e)}`. Falling back to simulation mode.\n\n"""
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": True,
                    "analysis": error_notice + fallback_coaching,
                    "model": "Fallback Mode (Gemini API error)"
                }).encode())

        else:
            self.send_response(404)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "API route not found"}).encode())


if __name__ == "__main__":
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, StoopRequestHandler)
    print(f"STOOP Backend running locally at http://localhost:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping STOOP server...")
        httpd.server_close()
