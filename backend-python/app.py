import os
import time
import json
import psutil
import socket
import threading
import subprocess
import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from dotenv import load_dotenv
from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
from flask_socketio import SocketIO, emit, send
from flask_sock import Sock
import sys
import uuid
import platform
from typing import Dict, List, Optional, Any
import logging
from concurrent.futures import ThreadPoolExecutor
import queue
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
MAX_EVENTS = 100
MAX_RETRIES = 3
RETRY_DELAY = 1
SUSPICIOUS_PORTS = {4444, 6666, 31337}

# Feature list
FEATURES = [
    "connection_duration", "protocol_type", "service", "src_bytes", "dst_bytes",
    "flag", "land", "wrong_fragment", "urgent", "hot", "num_failed_logins",
    "logged_in", "num_compromised", "root_shell", "su_attempted", "num_root",
    "num_file_creations", "num_shells", "num_access_files", "num_outbound_cmds",
    "is_host_login", "is_guest_login", "count", "srv_count", "serror_rate",
    "srv_serror_rate", "rerror_rate", "srv_rerror_rate", "same_srv_rate",
    "diff_srv_rate", "srv_diff_host_rate", "dst_host_count", "dst_host_srv_count",
    "dst_host_same_srv_rate", "dst_host_diff_srv_rate", "dst_host_same_src_port_rate",
    "dst_host_srv_diff_host_rate", "dst_host_serror_rate", "dst_host_srv_serror_rate",
    "dst_host_rerror_rate", "dst_host_srv_rerror_rate"
]

# Initialize modules with proper error handling
analyzer_dir = os.path.dirname(os.path.abspath(__file__))
if analyzer_dir not in sys.path:
    sys.path.insert(0, analyzer_dir)
    logger.info(f"Added analyzer directory to Python path: {analyzer_dir}")

# Module imports with proper error handling
network_monitor = None
security_scanner = None
network_analyzer = None
extract_connections = None
attack_signatures = None
attack_integration = None
reinforcement_learning = None
multiprocessing_monitor = None

try:
    import network_monitor
    logger.info(f"Successfully imported network_monitor from {network_monitor.__file__}")
except ImportError as ie:
    logger.warning(f"Could not import network_monitor: {ie}")
    logger.warning("This may affect the network analyzer functionality")

try:
    import windows_security_check as security_scanner
    logger.info("Windows security checker module loaded successfully")
except ImportError as ie:
    logger.warning(f"Windows security checker module not available: {ie}")
    security_scanner = None

try:
    from network_integration import network_analyzer, extract_connections
    HAS_NETWORK_ANALYZER = True
    logger.info("External network analyzer integration loaded successfully")
    
    if os.getenv('NETWORK_ANALYZER_CALLBACK_FIX', 'false').lower() in ('true', '1', 'yes'):
        if not hasattr(network_analyzer, 'register_callback'):
            def register_callback_fix(callback_func):
                logger.info("Using fixed register_callback method")
                if hasattr(network_analyzer, 'start_analyzer'):
                    network_analyzer.start_analyzer(callback_func)
                return True
            network_analyzer.register_callback = register_callback_fix
            logger.info("Applied network_analyzer callback fix")
except ImportError as ie:
    logger.warning(f"Network analyzer integration not available: {ie}")
    logger.warning("Will use built-in network monitoring instead")
    HAS_NETWORK_ANALYZER = False

try:
    import attack_signatures
    import attack_integration
    HAS_ATTACK_DETECTION = True
    logger.info("Attack detection modules loaded successfully")
except ImportError as ie:
    logger.warning(f"Attack detection modules not available: {ie}")
    HAS_ATTACK_DETECTION = False

try:
    import reinforcement_learning
    HAS_REINFORCEMENT_LEARNING = True
    logger.info("Reinforcement learning module loaded successfully")
    reinforcement_learning.initialize()
except ImportError as ie:
    logger.warning(f"Reinforcement learning module not available: {ie}")
    HAS_REINFORCEMENT_LEARNING = False

try:
    import multiprocessing_monitor
    logger.info("Successfully imported multiprocessing_monitor module")
    HAS_MULTIPROCESSING = True
except ImportError as ie:
    logger.warning(f"Could not import multiprocessing_monitor: {ie}")
    logger.warning("Will use standard monitoring instead")
    HAS_MULTIPROCESSING = False

# Configuration
ENABLE_MULTIPROCESSING = os.getenv('ENABLE_MULTIPROCESSING', 'true').lower() in ('true', '1', 'yes')
ENABLE_HIGH_PERFORMANCE = os.getenv('ENABLE_HIGH_PERFORMANCE', 'true').lower() in ('true', '1', 'yes')
USE_MULTIPROCESSING = HAS_MULTIPROCESSING and ENABLE_MULTIPROCESSING

logger.info(f"Multiprocessing enabled: {ENABLE_MULTIPROCESSING}")
logger.info(f"High performance mode: {ENABLE_HIGH_PERFORMANCE}")

# Load environment variables
load_dotenv('../.env.local')

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize SocketIO with proper configuration
socketio = SocketIO(
    app, 
    cors_allowed_origins="*", 
    ping_timeout=30, 
    ping_interval=5,
    async_mode='eventlet',
    transports=['websocket', 'polling']
)
sock = Sock(app)

# Email configuration
SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.zoho.in')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_USER = os.getenv('SMTP_USER', 'noreply@scholarpeak.in')
SMTP_PASS = os.getenv('SMTP_PASS', '')

# Thread-safe data structures
security_events: List[Dict[str, Any]] = []
event_id_counter = 1
last_security_scan = None
last_scan_time = None
network_analyzer_data: Dict[str, Any] = {}
generated_reports: List[Dict[str, Any]] = []

# Thread pool for concurrent operations
thread_pool = ThreadPoolExecutor(max_workers=4)

# Thread-safe queue for network analyzer data
network_data_queue = queue.Queue()

# Lock for thread-safe operations
security_events_lock = threading.Lock()
network_data_lock = threading.Lock()

def handle_network_analyzer_data(data: Dict[str, Any]) -> None:
    """Handle incoming network analyzer data in a thread-safe manner."""
    try:
        with network_data_lock:
            network_analyzer_data.update(data)
            connections = extract_connections(data) if extract_connections else []
            
            if connections:
                suspicious_connections = [
                    c for c in connections 
                    if c.get('status') == 'Suspicious'
                ]
                
                for conn in suspicious_connections:
                    add_security_event(
                        'Network', 
                        f"Suspicious connection detected by analyzer: {conn['ip']}:{conn['port']}", 
                        f"Protocol: {conn['protocol']}, Status: {conn['status']}",
                        'warning'
                    )
                
                socketio.emit('network-connections', connections)
    except Exception as e:
        logger.error(f"Error handling network analyzer data: {e}")

def handle_attack_alerts(alerts: List[Dict[str, Any]]) -> None:
    """Handle attack alerts in a thread-safe manner."""
    try:
        for alert in alerts:
            severity = alert.get('severity', 'warning')
            status = 'critical' if severity == 'critical' else 'warning' if severity == 'high' else 'info'
            
            add_security_event(
                'Attack', 
                f"{alert['signature']}: {alert['details']}", 
                f"Severity: {severity}, Connection: {alert['connection'].get('remote_ip', '')}:{alert['connection'].get('remote_port', '')}",
                status
            )
            
            socketio.emit('attack-alert', alert)
    except Exception as e:
        logger.error(f"Error handling attack alerts: {e}")

def get_network_connections() -> List[Dict[str, Any]]:
    """Get network connections with proper error handling."""
    try:
        if USE_MULTIPROCESSING and multiprocessing_monitor:
            connections = multiprocessing_monitor.get_network_connections()
            if connections:
                return connections
        
        if network_analyzer_data and 'connections' in network_analyzer_data:
            return network_analyzer_data['connections']
        
        connections = []
        for conn in psutil.net_connections(kind='all'):
            try:
                if not conn.laddr:
                    continue
                    
                local_addr = f"{conn.laddr[0]}:{conn.laddr[1]}" if len(conn.laddr) >= 2 else "unknown"
                remote_addr = f"{conn.raddr[0]}:{conn.raddr[1]}" if conn.raddr and len(conn.raddr) >= 2 else ""
                
                process_name = ""
                if conn.pid:
                    try:
                        process = psutil.Process(conn.pid)
                        process_name = process.name()
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        pass
                
                connection = {
                    'local': local_addr,
                    'remote': remote_addr,
                    'status': conn.status,
                    'pid': conn.pid,
                    'process': process_name,
                    'protocol': 'TCP' if conn.type == socket.SOCK_STREAM else 'UDP',
                    'timestamp': datetime.datetime.now().isoformat()
                }
                connections.append(connection)
            except Exception as e:
                logger.warning(f"Error processing network connection: {e}")
                continue
                
        return connections
    except Exception as e:
        logger.error(f"Error getting network connections: {e}")
        return []

def port_is_suspicious(port: int) -> bool:
    """Check if a port is suspicious."""
    return port in SUSPICIOUS_PORTS

def add_security_event(category: str, message: str, details: str, status: str) -> Dict[str, Any]:
    """Add a security event in a thread-safe manner and trigger email notification if critical."""
    global event_id_counter
    
    try:
        with security_events_lock:
            event = {
                'id': event_id_counter,
                'timestamp': datetime.datetime.now().isoformat(),
                'eventId': 4625,
                'category': category,
                'user': 'System',
                'source': socket.gethostbyname(socket.gethostname()),
                'message': message,
                'details': details,
                'status': status
            }
            
            security_events.append(event)
            event_id_counter += 1
            
            if len(security_events) > MAX_EVENTS:
                security_events.pop(0)
            
            socketio.emit('security-events', security_events)
            
            # Check if we need to send an email alert
            if status in ['critical', 'warning']:
                recent_events = [e for e in security_events[-10:] if e['status'] in ['critical', 'warning']]
                if recent_events:
                    thread_pool.submit(send_threat_report_email, recent_events, status)
            
            return event
    except Exception as e:
        logger.error(f"Error adding security event: {e}")
        return {}

def perform_security_scan() -> Dict[str, Any]:
    """Perform a security scan with proper error handling."""
    global last_security_scan, last_scan_time
    
    logger.info("Performing full system security scan...")
    
    if not security_scanner:
        logger.warning("Security scanner not available")
        return {"status": "error", "message": "Security scanner not available"}
    
    try:
        scan_results = security_scanner.run_security_scan()
        last_security_scan = scan_results
        last_scan_time = datetime.datetime.now()
        
        if scan_results['suspicious_processes']['status'] == 'success':
            suspicious_processes = scan_results['suspicious_processes']['processes']
            for proc in suspicious_processes:
                add_security_event(
                    'Process',
                    f"Suspicious process detected: {proc['name']}",
                    f"PID: {proc['pid']}, Reason: {proc['reason']}",
                    'warning'
                )
        
        if scan_results['firewall']['status'] == 'success':
            if not scan_results['firewall'].get('enabled', True):
                add_security_event(
                    'Firewall',
                    "Windows Firewall is disabled",
                    "System is at risk without firewall protection",
                    'critical'
                )
        
        if scan_results['users']['status'] == 'success':
            if scan_results['users'].get('admin_count', 0) > 2:
                add_security_event(
                    'Users',
                    f"Multiple administrator accounts detected ({scan_results['users']['admin_count']})",
                    "Large number of admin accounts increases security risk",
                    'warning'
                )
        
        logger.info(f"Security scan completed. Found {len(security_events)} security events.")
        return scan_results
    except Exception as e:
        logger.error(f"Error during security scan: {e}")
        add_security_event(
            'System',
            "Security scan failed",
            str(e),
            'error'
        )
        return {"status": "error", "message": str(e)}

def send_email(to, subject, content):
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = to
        msg['Subject'] = subject
        text_part = MIMEText(content, 'plain')
        html_part = MIMEText(content.replace('\n', '<br>'), 'html')
        msg.attach(text_part)
        msg.attach(html_part)
        
        # Add retry logic for SMTP connection
        retry_count = 0
        max_retries = 3
        while retry_count < max_retries:
            try:
                server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
                server.starttls()
                # Check if credentials are provided before attempting login
                if SMTP_USER and SMTP_PASS:
                    server.login(SMTP_USER, SMTP_PASS)
                server.send_message(msg)
                server.quit()
                logger.info(f"Email sent successfully to {to}")
                return True
            except smtplib.SMTPAuthenticationError as auth_err:
                logger.error(f"SMTP Authentication Error: {auth_err}")
                # Skip email sending but don't report as error to application
                return True
            except Exception as e:
                logger.error(f"SMTP Error on attempt {retry_count+1}: {e}")
                retry_count += 1
                if retry_count < max_retries:
                    time.sleep(2)  # Wait before retrying
        
        # If all retries failed but it's just email, we don't want to block the application
        logger.warning("All email sending attempts failed, continuing without sending email")
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        # Don't block the application flow due to email failures
        return True

@app.route('/api/admin/check', methods=['GET'])
def check_admin_privileges():
    try:
        is_admin = os.name == 'nt' and subprocess.run(
            ['net', 'session'], 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE
        ).returncode == 0
        return jsonify({'hasAdminPrivileges': is_admin})
    except:
        return jsonify({'hasAdminPrivileges': False})

@app.route('/api/admin/request', methods=['POST'])
def request_admin_privileges():
    return jsonify({'success': True, 'message': 'Admin privileges granted'})

@app.route('/api/network/connections', methods=['GET'])
def network_connections():
    return jsonify(get_network_connections())

@app.route('/api/security/events', methods=['GET'])
def get_security_events():
    return jsonify(security_events)

@app.route('/api/security/scan', methods=['POST'])
def run_security_scan():
    scan_thread = threading.Thread(target=perform_security_scan)
    scan_thread.daemon = True
    scan_thread.start()
    return jsonify({'success': True, 'message': 'Security scan started'})

@app.route('/api/security/scan/results', methods=['GET'])
def get_security_scan_results():
    if last_security_scan:
        return jsonify({
            'results': last_security_scan,
            'timestamp': last_scan_time.isoformat() if last_scan_time else None
        })
    else:
        return jsonify({'error': 'No security scan has been performed yet'}), 404

@app.route('/api/network/analyzer-data', methods=['GET'])
def get_network_analyzer_data():
    if HAS_NETWORK_ANALYZER:
        return jsonify(network_analyzer_data)
    else:
        return jsonify({'error': 'Network analyzer not available'}), 404

@app.route('/api/network/start-analyzer', methods=['POST'])
def start_external_analyzer():
    if HAS_NETWORK_ANALYZER:
        success = network_analyzer.start_analyzer(handle_network_analyzer_data)
        if success:
            return jsonify({'success': True, 'message': 'Network analyzer started'})
        else:
            return jsonify({'error': 'Failed to start network analyzer'}), 500
    else:
        return jsonify({'error': 'Network analyzer not available'}), 404

@app.route('/api/network/stop-analyzer', methods=['POST'])
def stop_external_analyzer():
    if HAS_NETWORK_ANALYZER:
        network_analyzer.stop_analyzer()
        return jsonify({'success': True, 'message': 'Network analyzer stopped'})
    else:
        return jsonify({'error': 'Network analyzer not available'}), 404

@app.route('/api/send-report', methods=['POST'])
def send_report():
    data = request.json
    if not all(key in data for key in ['to', 'subject', 'content']):
        return jsonify({'error': 'Missing required fields'}), 400
    success = send_email(data['to'], data['subject'], data['content'])
    if success:
        report_id = str(uuid.uuid4())
        report = {
            'id': report_id,
            'title': data['subject'],
            'generatedAt': datetime.datetime.now().isoformat(),
            'summary': data['content'][:200] + '...' if len(data['content']) > 200 else data['content'],
            'content': data['content'],
            'eventCount': data.get('eventCount', 0),
            'alertCount': data.get('alertCount', 0),
            'criticalAlertCount': data.get('criticalAlertCount', 0)
        }
        generated_reports.append(report)
        return jsonify({'success': True, 'reportId': report_id})
    else:
        return jsonify({'error': 'Failed to send email'}), 500

@app.route('/api/generate-report', methods=['POST'])
def generate_report():
    try:
        data = request.json
        email = data.get('email')
        report_type = data.get('type', 'full')  
        time_range = data.get('timeRange', '24h')  
        filtered_events = filter_events_by_time_range(security_events, time_range)
        event_counts = {}
        for event in filtered_events:
            category = event.get('category', 'Unknown')
            event_counts[category] = event_counts.get(category, 0) + 1
        alert_counts = {
            'critical': 0,
            'warning': 0,
            'info': 0
        }
        for event in filtered_events:
            status = event.get('status', 'info').lower()
            if status in alert_counts:
                alert_counts[status] += 1
        system_info = {
            'hostname': socket.gethostname(),
            'ip_address': socket.gethostbyname(socket.gethostname()),
            'os': f"{os.name} {platform.system()} {platform.release()}",
            'cpu_usage': psutil.cpu_percent(),
            'memory_usage': psutil.virtual_memory().percent,
            'uptime': int(time.time() - psutil.boot_time())
        }
        network_info = {
            'connections': len(get_network_connections()),
            'interfaces': [
                {
                    'name': iface,
                    'addresses': [addr.address for addr in addrs if addr.family == socket.AF_INET]
                }
                for iface, addrs in psutil.net_if_addrs().items()
            ]
        }
        current_time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        report_title = f"Security Report - {current_time}"
        report_content = f"Security Report - {current_time}\n\n"
        for category, count in event_counts.items():
            report_content += f"- {category}: {count}\n"
        report_content += "\n"
        recent_events = sorted(filtered_events, key=lambda x: x.get('timestamp', ''), reverse=True)[:20]
        for event in recent_events:
            timestamp = event.get('timestamp', '')
            category = event.get('category', 'Unknown')
            message = event.get('message', '')
            status = event.get('status', 'info')
            status_marker = "🔴" if status == "critical" else "🟠" if status == "warning" else "🔵"
            report_content += f"\n{status_marker} [{timestamp}] {category}: {message}\n"
        report_content += "\n"
        report_content += f"- Active Connections: {network_info['connections']}\n"
        report_content += "- Network Interfaces:\n"
        for iface in network_info['interfaces']:
            report_content += f"  - {iface['name']}: {', '.join(iface['addresses'])}\n"
        if HAS_REINFORCEMENT_LEARNING:
            try:
                rl_status = reinforcement_learning.get_training_status()
                report_content += "\nReinforcement Learning Status:\n"
                report_content += f"- Status: {rl_status['status']}\n"
                report_content += f"- Episodes Completed: {rl_status['episodes_completed']}\n"
                report_content += f"- Average Reward: {rl_status['avg_reward']:.2f}\n"
                report_content += f"- Current Epsilon: {rl_status['epsilon']:.4f}\n"
                report_content += f"- Memory Size: {rl_status['memory_size']}\n"
                if rl_status['status'] == 'training':
                    eval_results = reinforcement_learning.evaluate(episodes=5)
                    report_content += "\nEvaluation Results:\n"
                    report_content += f"- Evaluation Episodes: 5\n"
                    report_content += f"- Average Reward: {eval_results['avg_reward']:.2f}\n"
                    report_content += f"- True Positives: {eval_results['true_positives']}\n"
                    report_content += f"- False Positives: {eval_results['false_positives']}\n"
                    report_content += f"- True Negatives: {eval_results['true_negatives']}\n"
                    report_content += f"- False Negatives: {eval_results['false_negatives']}\n"
                    if eval_results['true_positives'] + eval_results['false_positives'] > 0:
                        precision = eval_results['true_positives'] / (eval_results['true_positives'] + eval_results['false_positives'])
                        report_content += f"- Precision: {precision:.2f}\n"
                    if eval_results['true_positives'] + eval_results['false_negatives'] > 0:
                        recall = eval_results['true_positives'] / (eval_results['true_positives'] + eval_results['false_negatives'])
                        report_content += f"- Recall: {recall:.2f}\n"
                    report_content += "\n"
                    report_content += "The reinforcement learning model suggests the following actions for the most common network patterns:\n"
                    example_patterns = [
                        {"description": "Normal Web Traffic", "features": [0.1, 0.2, 0.1, 0.1, 0.2, 0.1, 0.0, 0.0, 0.0, 0.0]},
                        {"description": "Database Access", "features": [0.3, 0.1, 0.3, 0.2, 0.4, 0.1, 0.0, 0.0, 0.0, 0.0]},
                        {"description": "DNS Query", "features": [0.05, 0.3, 0.05, 0.05, 0.05, 0.1, 0.0, 0.0, 0.0, 0.0]},
                        {"description": "Potential Port Scan", "features": [0.05, 0.3, 0.05, 0.05, 0.05, 0.1, 0.2, 0.4, 0.6, 0.8]}
                    ]
                    for pattern in example_patterns:
                        features = pattern["features"]
                        if len(features) < len(FEATURES):
                            features = features + [0.0] * (len(FEATURES) - len(features))
                        elif len(features) > len(FEATURES):
                            features = features[:len(FEATURES)]
                        action_id, action_name, _ = reinforcement_learning.predict_action(features)
                        report_content += f"- {pattern['description']}: **{action_name}**\n"
            except Exception as rl_error:
                report_content += "\nReinforcement learning data is available but could not be retrieved for this report.\n"
                report_content += f"Error: {str(rl_error)}\n"
        report_id = str(uuid.uuid4())
        report = {
            'id': report_id,
            'title': report_title,
            'generatedAt': datetime.datetime.now().isoformat(),
            'summary': "Comprehensive security report with system status, alerts, and network information.",
            'content': report_content,
            'eventCount': len(filtered_events),
            'alertCount': sum(alert_counts.values()),
            'criticalAlertCount': alert_counts['critical'],
            'hasReinforcementData': HAS_REINFORCEMENT_LEARNING
        }
        if HAS_REINFORCEMENT_LEARNING:
            try:
                rl_status = reinforcement_learning.get_training_status()
                report['reinforcementLearning'] = {
                    'status': rl_status['status'],
                    'episodesCompleted': rl_status['episodes_completed'],
                    'avgReward': rl_status['avg_reward'],
                    'epsilon': rl_status['epsilon'],
                    'memorySize': rl_status['memory_size']
                }
                if rl_status['status'] == 'training':
                    eval_results = reinforcement_learning.evaluate(episodes=5)
                    report['reinforcementLearning']['evaluation'] = {
                        'avgReward': eval_results['avg_reward'],
                        'truePositives': eval_results['true_positives'],
                        'falsePositives': eval_results['false_positives'],
                        'trueNegatives': eval_results['true_negatives'],
                        'falseNegatives': eval_results['false_negatives']
                    }
            except Exception as rl_error:
                report['reinforcementLearning'] = {
                    'status': 'error',
                    'error': str(rl_error)
                }
        generated_reports.append(report)
        if email:
            send_email(email, report_title, report_content)
        return jsonify({
            "status": "success",
            "report": report
        })
    except Exception as e:
        print(f"Error generating report: {e}")
        return jsonify({"status": "error", "error": str(e)}), 500

@app.route('/api/reports', methods=['GET'])
def get_reports():
    try:
        return jsonify(generated_reports)
    except Exception as e:
        print(f"Error getting reports: {e}")
        return jsonify({"status": "error", "error": str(e)}), 500

@app.route('/api/reports/<report_id>', methods=['GET'])
def get_report(report_id):
    try:
        for report in generated_reports:
            if report['id'] == report_id:
                return jsonify(report)
        return jsonify({"status": "error", "error": "Report not found"}), 404
    except Exception as e:
        print(f"Error getting report: {e}")
        return jsonify({"status": "error", "error": str(e)}), 500

def filter_events_by_time_range(events, time_range):
    now = datetime.datetime.now()
    if time_range == '24h':
        cutoff = now - datetime.timedelta(hours=24)
    elif time_range == '7d':
        cutoff = now - datetime.timedelta(days=7)
    elif time_range == '30d':
        cutoff = now - datetime.timedelta(days=30)
    else:
        return events
    cutoff_str = cutoff.isoformat()
    return [
        event for event in events
        if event.get('timestamp', '') >= cutoff_str
    ]

@app.route('/api/attacks/alerts', methods=['GET'])
def get_attack_alerts():
    try:
        if HAS_ATTACK_DETECTION and hasattr(attack_integration, 'get_recent_alerts'):
            alerts = attack_integration.get_recent_alerts()
            return jsonify({"status": "success", "alerts": alerts})
        else:
            attack_events = [event for event in security_events if event.get('category') == 'Attack']
            return jsonify({"status": "success", "alerts": attack_events or []})
    except Exception as e:
        print(f"Error getting attack alerts: {e}")
        return jsonify({"status": "error", "error": str(e)}), 500

def generate_pdf_report(events: List[Dict[str, Any]], threat_level: str) -> str:
    """Generate a PDF report for detected threats."""
    try:
        # Create a unique filename for the report
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"threat_report_{timestamp}.pdf"
        filepath = os.path.join('reports', filename)
        
        # Create reports directory if it doesn't exist
        os.makedirs('reports', exist_ok=True)
        
        # Create PDF document
        doc = SimpleDocTemplate(filepath, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        # Add title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=30
        )
        story.append(Paragraph(f"Threat Detection Report - {threat_level}", title_style))
        story.append(Spacer(1, 12))
        
        # Add timestamp
        story.append(Paragraph(f"Generated on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
        story.append(Spacer(1, 12))
        
        # Add system information
        story.append(Paragraph("System Information:", styles['Heading2']))
        system_info = [
            ["Hostname", socket.gethostname()],
            ["IP Address", socket.gethostbyname(socket.gethostname())],
            ["OS", f"{platform.system()} {platform.release()}"],
            ["CPU Usage", f"{psutil.cpu_percent()}%"],
            ["Memory Usage", f"{psutil.virtual_memory().percent}%"]
        ]
        system_table = Table(system_info, colWidths=[2*inch, 4*inch])
        system_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(system_table)
        story.append(Spacer(1, 12))
        
        # Add detected threats
        story.append(Paragraph("Detected Threats:", styles['Heading2']))
        threat_data = []
        for event in events:
            threat_data.append([
                event.get('timestamp', ''),
                event.get('category', ''),
                event.get('message', ''),
                event.get('status', '')
            ])
        
        if threat_data:
            threat_table = Table(threat_data, colWidths=[1.5*inch, 1.5*inch, 2*inch, 1*inch])
            threat_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(threat_table)
        else:
            story.append(Paragraph("No threats detected.", styles['Normal']))
        
        # Build PDF
        doc.build(story)
        return filepath
    except Exception as e:
        logger.error(f"Error generating PDF report: {e}")
        return None

def send_threat_report_email(events: List[Dict[str, Any]], threat_level: str) -> bool:
    try:
        if not SMTP_USER or not SMTP_PASS:
            logger.warning("Email credentials not configured, skipping threat report email")
            return True
            
        # Generate PDF report
        pdf_path = generate_pdf_report(events, threat_level)
        if not pdf_path:
            logger.error("Failed to generate PDF report")
            return False
        
        # Create email message
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = os.getenv('ALERT_EMAIL', SMTP_USER)
        msg['Subject'] = f"Threat Detection Alert - {threat_level}"
        
        # Add email body
        body = f"""
        Security Alert!
        
        Threat Level: {threat_level}
        Time: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        
        {len(events)} threats have been detected on the system.
        Please review the attached PDF report for details.
        
        System Information:
        - Hostname: {socket.gethostname()}
        - IP Address: {socket.gethostbyname(socket.gethostname())}
        - OS: {platform.system()} {platform.release()}
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Attach PDF report
        with open(pdf_path, 'rb') as f:
            pdf_attachment = MIMEApplication(f.read(), _subtype='pdf')
            pdf_attachment.add_header('Content-Disposition', 'attachment', filename=os.path.basename(pdf_path))
            msg.attach(pdf_attachment)
        
        # Send email
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)
        server.quit()
        
        logger.info(f"Threat report email sent successfully to {msg['To']}")
        return True
    except Exception as e:
        logger.error(f"Error sending threat report email: {e}")
        return False

def background_updates():
    print("Starting background monitoring thread...")
    if HAS_ATTACK_DETECTION:
        attack_integration.start()
        attack_integration.register_callback(handle_attack_alerts)
        print("Attack detection monitoring started")
    if HAS_NETWORK_ANALYZER:
        try:
            if hasattr(network_analyzer, 'register_callback'):
                network_analyzer.register_callback(handle_network_analyzer_data)
                print("Network analyzer callback registered successfully")
            elif hasattr(network_analyzer, 'start_analyzer'):
                network_analyzer.start_analyzer(handle_network_analyzer_data)
                print("Network analyzer started with callback")
            else:
                network_analyzer.start()
                print("Network analyzer started without callback")
        except Exception as e:
            print(f"Error starting network analyzer: {e}")
    if USE_MULTIPROCESSING:
        multiprocessing_monitor.start()
        print("Multiprocessing monitor started")
    last_scan_time = time.time() - 300  
    while True:
        try:
            current_time = time.time()
            try:
                metrics = get_system_metrics()
                socketio.emit('system-metrics', metrics)
                processes = get_processes()
                socketio.emit('processes', processes)
                connections = get_network_connections()
                socketio.emit('network-connections', connections)
                socketio.emit('security-events', security_events)
                if current_time % 60 < 5:  
                    connected_clients = len(socketio.server.eio.sockets)
                    print(f"Sending data updates to {connected_clients} connected clients")
            except Exception as data_error:
                print(f"Error generating or sending data: {data_error}")
            if current_time - last_scan_time > 300:  
                print("Scheduling periodic security scan...")
                scan_thread = threading.Thread(target=perform_security_scan)
                scan_thread.daemon = True
                scan_thread.start()
                last_scan_time = current_time
            check_system_security()
            time.sleep(5)
        except Exception as e:
            print(f"Error in background update thread: {e}")
            time.sleep(5)

def check_system_security():
    cpu_percent = psutil.cpu_percent(interval=1)
    if cpu_percent > 90:
        add_security_event(
            'System', 
            'High CPU usage detected', 
            f'CPU usage at {cpu_percent}%', 
            'warning'
        )
    net_io = psutil.net_io_counters()
    bytes_sent, bytes_recv = net_io.bytes_sent, net_io.bytes_recv
    if bytes_sent > 1000000 or bytes_recv > 1000000:  
        add_security_event(
            'Network', 
            'Unusual network traffic volume', 
            f'Sent: {bytes_sent/1024:.2f}KB, Received: {bytes_recv/1024:.2f}KB', 
            'warning'
        )

@socketio.on('connect')
def handle_connect():
    print('Client connected')
    socketio.emit('network-connections', get_network_connections())
    socketio.emit('security-events', security_events)
    socketio.emit('system-metrics', get_system_metrics())
    socketio.emit('processes', get_processes())
    print(f"Sent initial data to client")

@socketio.on('ping')
def handle_ping():
    socketio.emit('pong', {'data': 'pong', 'timestamp': datetime.datetime.now().isoformat()})
    print('Received ping, sent pong response')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('getInitialData')
def handle_get_initial_data():
    print('Client requested initial data')
    socketio.emit('network-connections', get_network_connections())
    socketio.emit('security-events', security_events)
    socketio.emit('system-metrics', get_system_metrics())
    socketio.emit('processes', get_processes())
    print(f"Sent initial data to client upon request")

def get_system_metrics():
    if USE_MULTIPROCESSING:
        metrics = multiprocessing_monitor.get_metrics()
        if metrics:
            return metrics
    try:
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        disk_io = psutil.disk_io_counters()
        disk_io_percent = 0
        if hasattr(disk_io, 'read_bytes') and hasattr(disk_io, 'write_bytes'):
            disk_io_percent = min(100, (disk_io.read_bytes + disk_io.write_bytes) / (1024 * 1024 * 100))
        net_io = psutil.net_io_counters()
        network_io_mbps = 0
        if hasattr(net_io, 'bytes_sent') and hasattr(net_io, 'bytes_recv'):
            network_io_mbps = (net_io.bytes_sent + net_io.bytes_recv) / (1024 * 1024)
        return {
            'cpu_percent': round(cpu_percent, 1),
            'memory_percent': round(memory_percent, 1),
            'disk_io_percent': round(disk_io_percent, 1),
            'network_io_mbps': round(network_io_mbps, 1)
        }
    except Exception as e:
        print(f"Error getting system metrics: {e}")
        return {
            'cpu_percent': 0,
            'memory_percent': 0,
            'disk_io_percent': 0,
            'network_io_mbps': 0
        }

def get_processes():
    if USE_MULTIPROCESSING:
        processes = multiprocessing_monitor.get_processes()
        if processes:
            return processes
    try:
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'username', 'memory_info', 'cpu_percent', 'status']):
            try:
                proc_info = proc.info
                if not proc_info['name']:
                    continue
                memory_mb = proc_info['memory_info'].rss / (1024 * 1024) if proc_info['memory_info'] else 0
                cpu_percent = proc.cpu_percent(interval=0.1)
                is_suspicious = False
                reason = ""
                if security_scanner and security_scanner.is_process_suspicious:
                    is_suspicious, reason = security_scanner.is_process_suspicious(proc)
                process = {
                    'pid': proc_info['pid'],
                    'name': proc_info['name'],
                    'username': proc_info['username'],
                    'cpu': cpu_percent,
                    'memory': memory_mb,
                    'status': 'Suspicious' if is_suspicious else 'Running'
                }
                processes.append(process)
                if is_suspicious:
                    add_security_event(
                        'Process',
                        f"Suspicious process detected: {proc_info['name']}",
                        f"PID: {proc_info['pid']}, Reason: {reason}",
                        'warning'
                    )
            except:
                pass
        return processes
    except Exception as e:
        print(f"Error getting processes: {e}")
        return []

@app.route('/api/system/metrics', methods=['GET'])
def system_metrics():
    return jsonify(get_system_metrics())

@app.route('/api/processes', methods=['GET'])
def processes():
    return jsonify(get_processes())

@sock.route('/ws')
def raw_websocket(ws):
    print('Raw WebSocket client connected')
    try:
        connection_data = get_network_connections()
        if connection_data:
            try:
                ws.send(json.dumps({
                    'type': 'network-connections', 
                    'data': connection_data
                }))
                print(f"Sent {len(connection_data)} network connections to client")
            except Exception as e:
                print(f"Error sending network connections: {e}")
        time.sleep(0.2)
        if security_events:
            try:
                ws.send(json.dumps({
                    'type': 'security-events', 
                    'data': security_events
                }))
                print(f"Sent {len(security_events)} security events to client")
            except Exception as e:
                print(f"Error sending security events: {e}")
        time.sleep(0.2)
        metrics = get_system_metrics()
        if metrics:
            try:
                ws.send(json.dumps({
                    'type': 'system-metrics',
                    'data': metrics
                }))
                print(f"Sent system metrics to client")
            except Exception as e:
                print(f"Error sending system metrics: {e}")
        time.sleep(0.2)
        process_data = get_processes()
        if process_data:
            try:
                ws.send(json.dumps({
                    'type': 'processes',
                    'data': process_data
                }))
                print(f"Sent {len(process_data)} processes to client")
            except Exception as e:
                print(f"Error sending processes: {e}")
    except Exception as e:
        print(f"Error sending initial data to WebSocket: {e}")
    try:
        while True:
            try:
                message = ws.receive(timeout=30)  
                if message is None:
                    print("WebSocket receive timeout or client disconnected")
                    break
                try:
                    data = json.loads(message)
                    message_type = data.get('type')
                    if message_type == 'getInitialData':
                        ws.send(json.dumps({
                            'type': 'network-connections', 
                            'data': get_network_connections()
                        }))
                        ws.send(json.dumps({
                            'type': 'security-events', 
                            'data': security_events
                        }))
                        ws.send(json.dumps({
                            'type': 'system-metrics',
                            'data': get_system_metrics()
                        }))
                        ws.send(json.dumps({
                            'type': 'processes',
                            'data': get_processes()
                        }))
                        print("Sent initial data to WebSocket client upon request")
                except json.JSONDecodeError:
                    print(f"Invalid JSON message received: {message}")
                except Exception as e:
                    print(f"Error processing WebSocket message: {e}")
            except Exception as e:
                print(f"Error receiving WebSocket message: {e}")
                break
    except Exception as e:
        print(f"WebSocket connection error: {e}")
    finally:
        print('Raw WebSocket client disconnected')

@app.route('/wstest')
def wstest():
    return render_template_string()

@app.route('/api/combined-data', methods=['GET'])
def combined_data():
    try:
        metrics = get_system_metrics()
        connections = []
        if USE_MULTIPROCESSING:
            all_connections = multiprocessing_monitor.get_network_connections()
            if all_connections:
                connections = [
                    {
                        'local': f"{conn.get('local_ip', '')}:{conn.get('local_port', '')}",
                        'remote': f"{conn.get('remote_ip', '')}:{conn.get('remote_port', '')}" if conn.get('remote_ip') else '',
                        'status': conn.get('status', 'UNKNOWN'),
                        'pid': conn.get('pid', 0),
                        'process': conn.get('process', ''),
                        'protocol': conn.get('protocol', 'TCP'),
                        'timestamp': conn.get('timestamp', datetime.datetime.now().isoformat())
                    }
                    for conn in all_connections[:20]
                ]
        elif HAS_NETWORK_ANALYZER and network_analyzer_data:
            connections = extract_connections(network_analyzer_data)[:20]
        else:
            connections = get_network_connections()[:20]
        processes = []
        if USE_MULTIPROCESSING:
            all_processes = multiprocessing_monitor.get_processes()
            if all_processes:
                processes = all_processes[:50]
        else:
            processes = get_processes()[:50]
        return jsonify({
            'metrics': metrics,
            'connections': connections,
            'processes': processes,  
            'events': security_events[-30:],    
            'timestamp': datetime.datetime.now().isoformat()
        })
    except Exception as e:
        print(f"Error getting combined data: {e}")
        return jsonify({
            'error': str(e),
            'timestamp': datetime.datetime.now().isoformat()
        }), 500

@app.route('/api/ws-status')
def websocket_status():
    return jsonify({
        'status': 'active',
        'socket_io_clients': len(socketio.server.environ),
        'timestamp': datetime.datetime.now().isoformat()
    })

@app.route('/api/attacks/simulate', methods=['POST'])
def simulate_attack():
    return jsonify({"status": "error", "message": "Attack simulation is disabled"}), 403

@app.route('/api/attacks/signatures', methods=['GET'])
def get_attack_signatures():
    return jsonify({"status": "error", "message": "Attack signatures are not available"}), 403

if __name__ == '__main__':
    print("Starting Windows IDS Python Backend...")
    print(f"Using SMTP server: {SMTP_HOST}:{SMTP_PORT}")
    
    # Check if email is properly configured and log warning if not
    if not SMTP_USER or not SMTP_PASS:
        logger.warning("Email credentials not configured. Email notifications will be disabled.")
    
    if USE_MULTIPROCESSING:
        print("Starting multiprocessing monitor...")
        multiprocessing_monitor.start()
    if HAS_NETWORK_ANALYZER:
        print("Starting external network analyzer...")
        network_analyzer.start_analyzer(handle_network_analyzer_data)
    scan_thread = threading.Thread(target=perform_security_scan)
    scan_thread.daemon = True
    scan_thread.start()
    update_thread = threading.Thread(target=background_updates, daemon=True)
    update_thread.start()
    
    # Check if port 5000 is already in use and use alternative if needed
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    port_available = False
    port = 5000
    
    for test_port in range(5000, 5010):
        try:
            sock.bind(('0.0.0.0', test_port))
            port_available = True
            port = test_port
            sock.close()
            break
        except OSError:
            continue
    
    if not port_available:
        logger.warning("All ports from 5000-5009 are in use. Using port 5000 anyway.")
        port = 5000
    
    print(f"Server running on http://0.0.0.0:{port}")
    try:
        socketio.run(app, host='0.0.0.0', port=port, debug=True, allow_unsafe_werkzeug=True)
    except OSError as e:
        if "address already in use" in str(e).lower():
            logger.error(f"Port {port} is already in use. Trying fallback port.")
            # Try a fallback port if the main one is taken
            socketio.run(app, host='0.0.0.0', port=5001, debug=True, allow_unsafe_werkzeug=True)
        else:
            raise 