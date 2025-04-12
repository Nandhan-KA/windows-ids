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
from dotenv import load_dotenv
from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
from flask_socketio import SocketIO, emit, send
from flask_sock import Sock
import sys
import uuid
import platform

# Define feature names for the reinforcement learning model
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

# Add network analyzer directory to Python path
analyzer_dir = "C:\\Users\\nandhanka\\Desktop\\ids"
if analyzer_dir not in sys.path:
    sys.path.insert(0, analyzer_dir)
    print(f"Added analyzer directory to Python path: {analyzer_dir}")

# Try to import network_monitor to verify it's available
try:
    import network_monitor
    print(f"Successfully imported network_monitor from {network_monitor.__file__}")
except ImportError as ie:
    print(f"Warning: Could not import network_monitor: {ie}")
    print("This may affect the network analyzer functionality")

# Import the Windows security scanner
try:
    import windows_security_check as security_scanner
except ImportError:
    print("Warning: Windows security checker module not available.")
    security_scanner = None

# Import the network analyzer integration
try:
    from network_integration import network_analyzer, extract_connections
    HAS_NETWORK_ANALYZER = True
    print("External network analyzer integration loaded successfully")
    
    # Fix for the network_analyzer.register_callback attribute error
    if os.getenv('NETWORK_ANALYZER_CALLBACK_FIX', 'false').lower() in ('true', '1', 'yes'):
        # Add the missing method if it doesn't exist
        if not hasattr(network_analyzer, 'register_callback'):
            def register_callback_fix(callback_func):
                print("Using fixed register_callback method")
                if hasattr(network_analyzer, 'start_analyzer'):
                    network_analyzer.start_analyzer(callback_func)
                return True
            
            network_analyzer.register_callback = register_callback_fix
            print("Applied network_analyzer callback fix")
except ImportError as ie:
    print(f"Warning: Network analyzer integration not available: {ie}")
    print("Will use built-in network monitoring instead")
    HAS_NETWORK_ANALYZER = False

# Import attack detection modules
try:
    import attack_signatures
    import attack_integration
    HAS_ATTACK_DETECTION = True
    print("Attack detection modules loaded successfully")
except ImportError as ie:
    print(f"Warning: Attack detection modules not available: {ie}")
    HAS_ATTACK_DETECTION = False

# Import reinforcement learning module
try:
    import reinforcement_learning
    HAS_REINFORCEMENT_LEARNING = True
    print("Reinforcement learning module loaded successfully")
    # Initialize reinforcement learning
    reinforcement_learning.initialize()
except ImportError as ie:
    print(f"Warning: Reinforcement learning module not available: {ie}")
    HAS_REINFORCEMENT_LEARNING = False

# Get environment variables
ENABLE_MULTIPROCESSING = os.getenv('ENABLE_MULTIPROCESSING', 'true').lower() in ('true', '1', 'yes')
ENABLE_HIGH_PERFORMANCE = os.getenv('ENABLE_HIGH_PERFORMANCE', 'true').lower() in ('true', '1', 'yes')
print(f"Multiprocessing enabled: {ENABLE_MULTIPROCESSING}")
print(f"High performance mode: {ENABLE_HIGH_PERFORMANCE}")

# Import the multiprocessing monitor for better performance
try:
    import multiprocessing_monitor
    print(f"Successfully imported multiprocessing_monitor module")
    HAS_MULTIPROCESSING = True
except ImportError as ie:
    print(f"Warning: Could not import multiprocessing_monitor: {ie}")
    print("Will use standard monitoring instead")
    HAS_MULTIPROCESSING = False

# Use multiprocessing if available and enabled
USE_MULTIPROCESSING = HAS_MULTIPROCESSING and ENABLE_MULTIPROCESSING

# Load environment variables from .env.local file
load_dotenv('../.env.local')

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(
    app, 
    cors_allowed_origins="*", 
    ping_timeout=30, 
    ping_interval=5,
    async_mode='eventlet',
    transports=['websocket', 'polling']
)

# Set up Flask-Sock for raw WebSockets
sock = Sock(app)

# Get email settings from environment variables
SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.zoho.in')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_USER = os.getenv('SMTP_USER', 'noreply@scholarpeak.in')
SMTP_PASS = os.getenv('SMTP_PASS', '')

# Security events storage
security_events = []
event_id_counter = 1

# System security scan results
last_security_scan = None
last_scan_time = None

# Network analyzer data
network_analyzer_data = {}

# Global list to store generated reports
generated_reports = []

# Handler for network analyzer data
def handle_network_analyzer_data(data):
    global network_analyzer_data
    network_analyzer_data = data
    
    # Extract connections from the data
    connections = extract_connections(data)
    if connections:
        # Find suspicious connections
        suspicious_connections = [c for c in connections if c.get('status') == 'Suspicious']
        for conn in suspicious_connections:
            add_security_event(
                'Network', 
                f"Suspicious connection detected by analyzer: {conn['ip']}:{conn['port']}", 
                f"Protocol: {conn['protocol']}, Status: {conn['status']}",
                'warning'
            )
        
        # Emit the connections to clients
        socketio.emit('network-connections', connections)

# Handler for attack alerts from the attack detection module
def handle_attack_alerts(alerts):
    for alert in alerts:
        severity = alert.get('severity', 'warning')
        if severity == 'critical':
            status = 'critical'
        elif severity == 'high':
            status = 'warning'
        else:
            status = 'info'
            
        add_security_event(
            'Attack', 
            f"{alert['signature']}: {alert['details']}", 
            f"Severity: {severity}, Connection: {alert['connection'].get('remote_ip', '')}:{alert['connection'].get('remote_port', '')}",
            status
        )
        
        # Emit the alert to clients
        socketio.emit('attack-alert', alert)

# Function to get network connections
def get_network_connections():
    # If using multiprocessing, get connections from there
    if USE_MULTIPROCESSING:
        connections = multiprocessing_monitor.get_network_connections()
        if connections:
            return connections
            
    # Otherwise, use the network analyzer if available
    if network_analyzer_data and 'connections' in network_analyzer_data:
        return network_analyzer_data['connections']
        
    # Fallback to psutil if network analyzer not available
    try:
        connections = []
        for conn in psutil.net_connections(kind='all'):
            try:
                if not conn.laddr:
                    continue
                    
                local_addr = f"{conn.laddr[0]}:{conn.laddr[1]}" if len(conn.laddr) >= 2 else "unknown"
                remote_addr = f"{conn.raddr[0]}:{conn.raddr[1]}" if conn.raddr and len(conn.raddr) >= 2 else ""
                
                # Get process name
                process_name = ""
                if conn.pid:
                    try:
                        process = psutil.Process(conn.pid)
                        process_name = process.name()
                    except:
                        pass
                
                # Create connection data structure
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
            except:
                pass
                
        return connections
    except Exception as e:
        print(f"Error getting network connections: {e}")
        return []

# Check if a port is potentially suspicious
def port_is_suspicious(port):
    # Example list of potentially suspicious ports
    suspicious_ports = [4444, 6666, 31337]  # Common backdoor ports
    return port in suspicious_ports

# Add a security event
def add_security_event(category, message, details, status):
    global event_id_counter, sock
    
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
    
    # Limit the number of stored events
    if len(security_events) > 50:
        security_events.pop(0)
    
    # Notify clients about the new event
    socketio.emit('security-events', security_events)
    
    # We cannot broadcast to raw WebSocket clients here as we don't have a list of them
    # The data will be sent on the next background update cycle
    
    return event

# Perform a full system security scan
def perform_security_scan():
    global last_security_scan, last_scan_time
    
    print("Performing full system security scan...")
    
    if security_scanner:
        try:
            # Run the security scanner
            scan_results = security_scanner.run_security_scan()
            last_security_scan = scan_results
            last_scan_time = datetime.datetime.now()
            
            # Process suspicious processes
            if scan_results['suspicious_processes']['status'] == 'success':
                suspicious_processes = scan_results['suspicious_processes']['processes']
                for proc in suspicious_processes:
                    add_security_event(
                        'Process',
                        f"Suspicious process detected: {proc['name']}",
                        f"PID: {proc['pid']}, Reason: {proc['reason']}",
                        'warning'
                    )
            
            # Check firewall status
            if scan_results['firewall']['status'] == 'success':
                if not scan_results['firewall'].get('enabled', True):
                    add_security_event(
                        'Firewall',
                        "Windows Firewall is disabled",
                        "System is at risk without firewall protection",
                        'critical'
                    )
            
            # Check admin users
            if scan_results['users']['status'] == 'success':
                if scan_results['users'].get('admin_count', 0) > 2:
                    add_security_event(
                        'Users',
                        f"Multiple administrator accounts detected ({scan_results['users']['admin_count']})",
                        "Large number of admin accounts increases security risk",
                        'warning'
                    )
            
            print(f"Security scan completed. Found {len(security_events)} security events.")
            return scan_results
        except Exception as e:
            print(f"Error during security scan: {e}")
            add_security_event(
                'System',
                "Security scan failed",
                str(e),
                'error'
            )
            return {"status": "error", "message": str(e)}
    else:
        print("Security scanner not available.")
        return {"status": "error", "message": "Security scanner not available"}

# Function to send email reports
def send_email(to, subject, content):
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = to
        msg['Subject'] = subject
        
        # Attach HTML and plain text versions
        text_part = MIMEText(content, 'plain')
        html_part = MIMEText(content.replace('\n', '<br>'), 'html')
        
        msg.attach(text_part)
        msg.attach(html_part)
        
        # Connect to SMTP server and send
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)
        server.quit()
        
        print(f"Email sent to {to}")
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

# Route to check admin privileges
@app.route('/api/admin/check', methods=['GET'])
def check_admin_privileges():
    # In a real implementation, check if the Python process has admin rights
    # For Windows, you can use ctypes or a subprocess call to check
    try:
        # Just a basic demo check - in a real system you'd use proper Windows API calls
        is_admin = os.name == 'nt' and subprocess.run(
            ['net', 'session'], 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE
        ).returncode == 0
        
        return jsonify({'hasAdminPrivileges': is_admin})
    except:
        return jsonify({'hasAdminPrivileges': False})

# Route to request admin privileges
@app.route('/api/admin/request', methods=['POST'])
def request_admin_privileges():
    # This is just a simulation - in a real app, you'd use UAC elevation
    return jsonify({'success': True, 'message': 'Admin privileges granted'})

# Route to get network connections
@app.route('/api/network/connections', methods=['GET'])
def network_connections():
    return jsonify(get_network_connections())

# Route to get security events
@app.route('/api/security/events', methods=['GET'])
def get_security_events():
    return jsonify(security_events)

# Route to run a security scan
@app.route('/api/security/scan', methods=['POST'])
def run_security_scan():
    # Perform the scan in a background thread to avoid blocking
    scan_thread = threading.Thread(target=perform_security_scan)
    scan_thread.daemon = True
    scan_thread.start()
    
    return jsonify({'success': True, 'message': 'Security scan started'})

# Route to get the latest security scan results
@app.route('/api/security/scan/results', methods=['GET'])
def get_security_scan_results():
    if last_security_scan:
        return jsonify({
            'results': last_security_scan,
            'timestamp': last_scan_time.isoformat() if last_scan_time else None
        })
    else:
        return jsonify({'error': 'No security scan has been performed yet'}), 404

# Route to get the external network analyzer data
@app.route('/api/network/analyzer-data', methods=['GET'])
def get_network_analyzer_data():
    if HAS_NETWORK_ANALYZER:
        return jsonify(network_analyzer_data)
    else:
        return jsonify({'error': 'Network analyzer not available'}), 404

# Route to start the external network analyzer
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

# Route to stop the external network analyzer
@app.route('/api/network/stop-analyzer', methods=['POST'])
def stop_external_analyzer():
    if HAS_NETWORK_ANALYZER:
        network_analyzer.stop_analyzer()
        return jsonify({'success': True, 'message': 'Network analyzer stopped'})
    else:
        return jsonify({'error': 'Network analyzer not available'}), 404

# Route to send email reports
@app.route('/api/send-report', methods=['POST'])
def send_report():
    data = request.json
    
    if not all(key in data for key in ['to', 'subject', 'content']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    success = send_email(data['to'], data['subject'], data['content'])
    
    if success:
        # Create a report record
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
        
        # Add to reports list
        generated_reports.append(report)
        
        return jsonify({'success': True, 'reportId': report_id})
    else:
        return jsonify({'error': 'Failed to send email'}), 500

# Route to generate and get a security report
@app.route('/api/generate-report', methods=['POST'])
def generate_report():
    """Generate a comprehensive security report."""
    try:
        data = request.json
        email = data.get('email')
        report_type = data.get('type', 'full')  # full, alerts, network, system
        time_range = data.get('timeRange', '24h')  # 24h, 7d, 30d
        
        # Get security events filtered by time range
        filtered_events = filter_events_by_time_range(security_events, time_range)
        
        # Count events by category
        event_counts = {}
        for event in filtered_events:
            category = event.get('category', 'Unknown')
            event_counts[category] = event_counts.get(category, 0) + 1
        
        # Count alerts by severity
        alert_counts = {
            'critical': 0,
            'warning': 0,
            'info': 0
        }
        
        for event in filtered_events:
            status = event.get('status', 'info').lower()
            if status in alert_counts:
                alert_counts[status] += 1
        
        # Get system information
        system_info = {
            'hostname': socket.gethostname(),
            'ip_address': socket.gethostbyname(socket.gethostname()),
            'os': f"{os.name} {platform.system()} {platform.release()}",
            'cpu_usage': psutil.cpu_percent(),
            'memory_usage': psutil.virtual_memory().percent,
            'uptime': int(time.time() - psutil.boot_time())
        }
        
        # Get network information
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
        
        # Generate report content
        current_time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        report_title = f"Security Report - {current_time}"
        
        report_content = f"""
# Security Report - {current_time}

## System Information
- Hostname: {system_info['hostname']}
- IP Address: {system_info['ip_address']}
- Operating System: {system_info['os']}
- CPU Usage: {system_info['cpu_usage']}%
- Memory Usage: {system_info['memory_usage']}%
- Uptime: {system_info['uptime'] // 86400}d {(system_info['uptime'] % 86400) // 3600}h {((system_info['uptime'] % 86400) % 3600) // 60}m

## Security Summary
- Total Events: {len(filtered_events)}
- Critical Alerts: {alert_counts['critical']}
- Warnings: {alert_counts['warning']}
- Informational: {alert_counts['info']}

## Events by Category
"""

        for category, count in event_counts.items():
            report_content += f"- {category}: {count}\n"

        report_content += "\n## Recent Security Events\n"
        
        # Add most recent events (limited to 20)
        recent_events = sorted(filtered_events, key=lambda x: x.get('timestamp', ''), reverse=True)[:20]
        for event in recent_events:
            timestamp = event.get('timestamp', '')
            category = event.get('category', 'Unknown')
            message = event.get('message', '')
            status = event.get('status', 'info')
            
            status_marker = "🔴" if status == "critical" else "🟠" if status == "warning" else "🔵"
            report_content += f"\n{status_marker} [{timestamp}] {category}: {message}\n"
        
        # Add network information
        report_content += "\n## Network Information\n"
        report_content += f"- Active Connections: {network_info['connections']}\n"
        report_content += "- Network Interfaces:\n"
        
        for iface in network_info['interfaces']:
            report_content += f"  - {iface['name']}: {', '.join(iface['addresses'])}\n"
        
        # Add reinforcement learning data if available
        if HAS_REINFORCEMENT_LEARNING:
            try:
                rl_status = reinforcement_learning.get_training_status()
                
                report_content += "\n## Reinforcement Learning Status\n"
                report_content += f"- Status: {rl_status['status']}\n"
                report_content += f"- Episodes Completed: {rl_status['episodes_completed']}\n"
                report_content += f"- Average Reward: {rl_status['avg_reward']:.2f}\n"
                report_content += f"- Current Epsilon: {rl_status['epsilon']:.4f}\n"
                report_content += f"- Memory Size: {rl_status['memory_size']}\n"
                
                # If training is active, get additional evaluation data
                if rl_status['status'] == 'training':
                    # Perform a quick evaluation
                    eval_results = reinforcement_learning.evaluate(episodes=5)
                    
                    report_content += "\n### Reinforcement Learning Performance\n"
                    report_content += f"- Evaluation Episodes: 5\n"
                    report_content += f"- Average Reward: {eval_results['avg_reward']:.2f}\n"
                    report_content += f"- True Positives: {eval_results['true_positives']}\n"
                    report_content += f"- False Positives: {eval_results['false_positives']}\n"
                    report_content += f"- True Negatives: {eval_results['true_negatives']}\n"
                    report_content += f"- False Negatives: {eval_results['false_negatives']}\n"
                    
                    # Add precision and recall if possible
                    if eval_results['true_positives'] + eval_results['false_positives'] > 0:
                        precision = eval_results['true_positives'] / (eval_results['true_positives'] + eval_results['false_positives'])
                        report_content += f"- Precision: {precision:.2f}\n"
                    
                    if eval_results['true_positives'] + eval_results['false_negatives'] > 0:
                        recall = eval_results['true_positives'] / (eval_results['true_positives'] + eval_results['false_negatives'])
                        report_content += f"- Recall: {recall:.2f}\n"
                        
                    # Add recommended actions based on RL model
                    report_content += "\n### Recommended Actions from RL Model\n"
                    report_content += "The reinforcement learning model suggests the following actions for the most common network patterns:\n"
                    
                    # Get some example predictions for common patterns
                    example_patterns = [
                        {"description": "Normal Web Traffic", "features": [0.1, 0.2, 0.1, 0.1, 0.2, 0.1, 0.0, 0.0, 0.0, 0.0]},
                        {"description": "Database Access", "features": [0.3, 0.1, 0.3, 0.2, 0.4, 0.1, 0.0, 0.0, 0.0, 0.0]},
                        {"description": "DNS Query", "features": [0.05, 0.3, 0.05, 0.05, 0.05, 0.1, 0.0, 0.0, 0.0, 0.0]},
                        {"description": "Potential Port Scan", "features": [0.05, 0.3, 0.05, 0.05, 0.05, 0.1, 0.2, 0.4, 0.6, 0.8]}
                    ]
                    
                    for pattern in example_patterns:
                        # Ensure we have enough features - pad if necessary
                        features = pattern["features"]
                        if len(features) < len(FEATURES):
                            features = features + [0.0] * (len(FEATURES) - len(features))
                        elif len(features) > len(FEATURES):
                            features = features[:len(FEATURES)]
                        
                        action_id, action_name, _ = reinforcement_learning.predict_action(features)
                        report_content += f"- {pattern['description']}: **{action_name}**\n"
            except Exception as rl_error:
                # If there's an error getting RL data, just add a note
                report_content += "\n## Reinforcement Learning\n"
                report_content += "Reinforcement learning data is available but could not be retrieved for this report.\n"
                report_content += f"Error: {str(rl_error)}\n"
        
        # Create a report record
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
        
        # Add reinforcement learning data to the report object if available
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
                
                # Add evaluation results if available
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
        
        # Add to reports list
        generated_reports.append(report)
        
        # Send email if an email address was provided
        if email:
            send_email(email, report_title, report_content)
        
        return jsonify({
            "status": "success",
            "report": report
        })
        
    except Exception as e:
        print(f"Error generating report: {e}")
        return jsonify({"status": "error", "error": str(e)}), 500

# Route to get all reports
@app.route('/api/reports', methods=['GET'])
def get_reports():
    """Get list of all generated reports."""
    try:
        return jsonify(generated_reports)
    except Exception as e:
        print(f"Error getting reports: {e}")
        return jsonify({"status": "error", "error": str(e)}), 500

# Route to get a specific report by ID
@app.route('/api/reports/<report_id>', methods=['GET'])
def get_report(report_id):
    """Get a specific report by ID."""
    try:
        for report in generated_reports:
            if report['id'] == report_id:
                return jsonify(report)
        
        return jsonify({"status": "error", "error": "Report not found"}), 404
    except Exception as e:
        print(f"Error getting report: {e}")
        return jsonify({"status": "error", "error": str(e)}), 500

# Helper function to filter events by time range
def filter_events_by_time_range(events, time_range):
    """Filter events by the specified time range."""
    now = datetime.datetime.now()
    
    if time_range == '24h':
        cutoff = now - datetime.timedelta(hours=24)
    elif time_range == '7d':
        cutoff = now - datetime.timedelta(days=7)
    elif time_range == '30d':
        cutoff = now - datetime.timedelta(days=30)
    else:
        # Default to all events
        return events
    
    cutoff_str = cutoff.isoformat()
    
    return [
        event for event in events
        if event.get('timestamp', '') >= cutoff_str
    ]

# Route to get attack alerts
@app.route('/api/attacks/alerts', methods=['GET'])
def get_attack_alerts():
    """Get recent attack alerts."""
    try:
        if HAS_ATTACK_DETECTION and hasattr(attack_integration, 'get_recent_alerts'):
            alerts = attack_integration.get_recent_alerts()
            return jsonify({"status": "success", "alerts": alerts})
        else:
            # Filter security events for attacks
            attack_events = [event for event in security_events if event.get('category') == 'Attack']
            return jsonify({"status": "success", "alerts": attack_events or []})
    except Exception as e:
        print(f"Error getting attack alerts: {e}")
        return jsonify({"status": "error", "error": str(e)}), 500

# Route to simulate an attack
@app.route('/api/attacks/simulate', methods=['POST'])
def simulate_attack():
    """Simulate an attack for testing."""
    try:
        data = request.json
        attack_type = data.get('type', 'dos')
        target = data.get('target', '127.0.0.1')
        duration = data.get('duration', 5)
        
        # Create a security event for the simulated attack
        attack_name = {
            'dos': 'Denial of Service',
            'scan': 'Port Scan', 
            'brute': 'Brute Force',
            'injection': 'SQL Injection',
            'xss': 'Cross-Site Scripting',
            'portscan': 'Port Scan',
            'bruteforce': 'Brute Force',
            'ddos': 'Denial of Service',
            'malicious_port': 'Malicious Port Access'
        }.get(attack_type, 'Unknown Attack')
        
        add_security_event(
            'Attack', 
            f"Simulated {attack_name} attack",
            f"Target: {target}, Duration: {duration}s", 
            'warning'
        )
        
        # Try to use the attack simulator if available
        if HAS_ATTACK_DETECTION and hasattr(attack_integration, 'simulate_attack'):
            result = attack_integration.simulate_attack(attack_type, target_ip=target, duration=duration)
            if isinstance(result, dict) and "status" in result:
                return jsonify(result)
            return jsonify({
                "status": "success",
                "message": f"Started {attack_name} attack simulation against {target} for {duration} seconds"
            })
        
        # Otherwise, just return success
        return jsonify({
            "status": "success",
            "message": f"Simulated {attack_name} attack on {target}",
            "alert_generated": True
        })
    except Exception as e:
        print(f"Error simulating attack: {e}")
        return jsonify({"status": "error", "error": str(e)}), 500

# Route to get attack signatures
@app.route('/api/attacks/signatures', methods=['GET'])
def get_attack_signatures():
    """Get available attack signatures."""
    try:
        if HAS_ATTACK_DETECTION and hasattr(attack_signatures, 'get_signatures'):
            signatures = attack_signatures.get_signatures()
            return jsonify({"status": "success", "signatures": signatures})
        else:
            # Fallback to mock data if not available
            mock_signatures = [
                {"id": "dos_tcp_flood", "name": "TCP Flood", "description": "TCP SYN flood attack", "severity": "high"},
                {"id": "scan_port", "name": "Port Scan", "description": "Port scanning activity", "severity": "medium"},
                {"id": "brute_force", "name": "Brute Force", "description": "Repeated login attempts", "severity": "high"},
                {"id": "webshell", "name": "Web Shell", "description": "Web shell detection", "severity": "critical"},
                {"id": "suspicious_process", "name": "Suspicious Process", "description": "Potentially malicious process", "severity": "medium"}
            ]
            return jsonify({"status": "success", "signatures": mock_signatures})
    except Exception as e:
        print(f"Error getting attack signatures: {e}")
        return jsonify({"status": "error", "error": str(e)}), 500

# Function to continuously update clients with new data
def background_updates():
    """Thread function to continuously update clients with system data."""
    
    print("Starting background monitoring thread...")
    
    # Start the attack monitoring if available
    if HAS_ATTACK_DETECTION:
        attack_integration.start()
        # Register our callback to handle alerts
        attack_integration.register_callback(handle_attack_alerts)
        print("Attack detection monitoring started")
    
    # Start network analyzer if available
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
        
    # Start multiprocessing monitor if available and enabled
    if USE_MULTIPROCESSING:
        multiprocessing_monitor.start()
        print("Multiprocessing monitor started")
    
    # Schedule regular security scans
    last_scan_time = time.time() - 300  # Schedule first scan immediately
    
    while True:
        try:
            current_time = time.time()
            
            # Get all current metrics and data
            try:
                # Get system metrics
                metrics = get_system_metrics()
                socketio.emit('system-metrics', metrics)
                
                # Get process list
                processes = get_processes()
                socketio.emit('processes', processes)
                
                # Get network connections
                connections = get_network_connections()
                socketio.emit('network-connections', connections)
                
                # Emit security events (these are updated elsewhere)
                socketio.emit('security-events', security_events)
                
                # Log that we're sending updates (less frequently to avoid log spam)
                if current_time % 60 < 5:  # Log roughly once a minute
                    connected_clients = len(socketio.server.eio.sockets)
                    print(f"Sending data updates to {connected_clients} connected clients")
            except Exception as data_error:
                print(f"Error generating or sending data: {data_error}")
            
            # Run security scan every 5 minutes
            if current_time - last_scan_time > 300:  # 5 minutes
                print("Scheduling periodic security scan...")
                # Run in a separate thread to avoid blocking
                scan_thread = threading.Thread(target=perform_security_scan)
                scan_thread.daemon = True
                scan_thread.start()
                last_scan_time = current_time
            
            # Additional security checks
            check_system_security()
            
            # Sleep for a few seconds
            time.sleep(5)
            
        except Exception as e:
            print(f"Error in background update thread: {e}")
            time.sleep(5)

# Perform various security checks
def check_system_security():
    # Check CPU usage spikes (potential malware)
    cpu_percent = psutil.cpu_percent(interval=1)
    if cpu_percent > 90:
        add_security_event(
            'System', 
            'High CPU usage detected', 
            f'CPU usage at {cpu_percent}%', 
            'warning'
        )
    
    # Check for unusual network traffic volume
    net_io = psutil.net_io_counters()
    bytes_sent, bytes_recv = net_io.bytes_sent, net_io.bytes_recv
    
    # These would typically be compared against baseline metrics
    if bytes_sent > 1000000 or bytes_recv > 1000000:  # 1MB threshold example
        add_security_event(
            'Network', 
            'Unusual network traffic volume', 
            f'Sent: {bytes_sent/1024:.2f}KB, Received: {bytes_recv/1024:.2f}KB', 
            'warning'
        )

# Socket.IO connection event
@socketio.on('connect')
def handle_connect():
    print('Client connected')
    # Send initial data
    socketio.emit('network-connections', get_network_connections())
    socketio.emit('security-events', security_events)
    socketio.emit('system-metrics', get_system_metrics())
    socketio.emit('processes', get_processes())
    
    # Log successful connection
    print(f"Sent initial data to client")

# Socket.IO disconnection event
@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

# Socket.IO event for requesting initial data
@socketio.on('getInitialData')
def handle_get_initial_data():
    print('Client requested initial data')
    # Send all data to client
    socketio.emit('network-connections', get_network_connections())
    socketio.emit('security-events', security_events)
    socketio.emit('system-metrics', get_system_metrics())
    socketio.emit('processes', get_processes())
    
    # Log successful data send
    print(f"Sent initial data to client upon request")

# Function to get system metrics
def get_system_metrics():
    # If using multiprocessing, get metrics from there
    if USE_MULTIPROCESSING:
        metrics = multiprocessing_monitor.get_metrics()
        if metrics:
            return metrics
    
    # Fallback to original implementation
    try:
        # Get CPU usage (across all cores)
        cpu_percent = psutil.cpu_percent(interval=0.1)
        
        # Get memory usage
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        
        # Get disk I/O
        disk_io = psutil.disk_io_counters()
        disk_io_percent = 0
        if hasattr(disk_io, 'read_bytes') and hasattr(disk_io, 'write_bytes'):
            # This is a very simplified calculation - in reality would track over time
            disk_io_percent = min(100, (disk_io.read_bytes + disk_io.write_bytes) / (1024 * 1024 * 100))
        
        # Get network I/O
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

# Function to get processes
def get_processes():
    # If using multiprocessing, get processes from there
    if USE_MULTIPROCESSING:
        processes = multiprocessing_monitor.get_processes()
        if processes:
            return processes
            
    # Fallback to original implementation
    try:
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'username', 'memory_info', 'cpu_percent', 'status']):
            try:
                # Get process info
                proc_info = proc.info
                
                # Skip system processes with no name
                if not proc_info['name']:
                    continue
                
                # Calculate memory in MB
                memory_mb = proc_info['memory_info'].rss / (1024 * 1024) if proc_info['memory_info'] else 0
                
                # Update CPU usage
                cpu_percent = proc.cpu_percent(interval=0.1)
                
                # Determine if process is suspicious
                is_suspicious = False
                reason = ""
                
                # Check against list of suspicious process names
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
                
                # If process is suspicious, create security event
                if is_suspicious:
                    add_security_event(
                        'Process',
                        f"Suspicious process detected: {proc_info['name']}",
                        f"PID: {proc_info['pid']}, Reason: {reason}",
                        'warning'
                    )
            except:
                # Skip processes we can't access
                pass
                
        return processes
    except Exception as e:
        print(f"Error getting processes: {e}")
        return []

# API endpoint for system metrics
@app.route('/api/system/metrics', methods=['GET'])
def system_metrics():
    return jsonify(get_system_metrics())

# API endpoint for processes
@app.route('/api/processes', methods=['GET'])
def processes():
    return jsonify(get_processes())

# Raw WebSocket endpoint using Flask-Sock
@sock.route('/ws')
def raw_websocket(ws):
    """Handle raw WebSocket connections"""
    print('Raw WebSocket client connected')
    
    try:
        # Create a smaller, safer data object to send
        # First send network connections
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
        
        # Wait a bit between sends to avoid overwhelming the socket
        time.sleep(0.2)
        
        # Send security events
        if security_events:
            try:
                ws.send(json.dumps({
                    'type': 'security-events', 
                    'data': security_events
                }))
                print(f"Sent {len(security_events)} security events to client")
            except Exception as e:
                print(f"Error sending security events: {e}")
        
        # Wait a bit between sends
        time.sleep(0.2)
        
        # Send system metrics
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
        
        # Wait a bit between sends
        time.sleep(0.2)
        
        # Send processes
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
    
    # WebSocket message handler loop
    try:
        while True:
            try:
                # Wait for client messages
                message = ws.receive(timeout=30)  # Add timeout to avoid blocking forever
                
                if message is None:
                    # Timeout or client disconnected
                    print("WebSocket receive timeout or client disconnected")
                    break
                    
                # Process message
                try:
                    data = json.loads(message)
                    message_type = data.get('type')
                    
                    if message_type == 'getInitialData':
                        # Send network connections
                        ws.send(json.dumps({
                            'type': 'network-connections', 
                            'data': get_network_connections()
                        }))
                        
                        # Send security events
                        ws.send(json.dumps({
                            'type': 'security-events', 
                            'data': security_events
                        }))
                        
                        # Send system metrics
                        ws.send(json.dumps({
                            'type': 'system-metrics',
                            'data': get_system_metrics()
                        }))
                        
                        # Send processes
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

# Add WebSocket test page
@app.route('/wstest')
def wstest():
    return render_template_string('''
        <!DOCTYPE html>
        <html>
        <head>
            <title>WebSocket Test</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 2em; }
                #status { font-weight: bold; }
                #messages { border: 1px solid #ccc; padding: 1em; height: 300px; overflow-y: auto; margin-top: 1em; }
            </style>
        </head>
        <body>
            <h1>Windows IDS Backend - Raw WebSocket Test</h1>
            <p>Status: <span id="status">Disconnected</span></p>
            <button id="connect">Connect</button>
            <button id="disconnect">Disconnect</button>
            <button id="request-data">Request Data</button>
            <div id="messages"></div>
            
            <script>
                const statusEl = document.getElementById('status');
                const messagesEl = document.getElementById('messages');
                
                let ws = null;
                
                function connect() {
                    statusEl.textContent = 'Connecting...';
                    
                    // Connect to the WebSocket server
                    ws = new WebSocket('ws://' + window.location.host + '/ws');
                    
                    ws.onopen = () => {
                        statusEl.textContent = 'Connected';
                        logMessage('Connected to server');
                    };
                    
                    ws.onclose = (event) => {
                        statusEl.textContent = 'Disconnected';
                        logMessage(`Disconnected from server: code=${event.code}, reason=${event.reason}`);
                        ws = null;
                    };
                    
                    ws.onerror = (error) => {
                        logMessage('WebSocket error: ' + error);
                    };
                    
                    ws.onmessage = (event) => {
                        try {
                            const message = JSON.parse(event.data);
                            
                            switch (message.type) {
                                case 'network-connections':
                                    logMessage(`Received ${message.data.length} network connections`);
                                    break;
                                case 'security-events':
                                    logMessage(`Received ${message.data.length} security events`);
                                    break;
                                case 'system-metrics':
                                    logMessage(`Received system metrics: CPU ${message.data.cpu_percent}%, Memory ${message.data.memory_percent}%`);
                                    break;
                                case 'processes':
                                    logMessage(`Received ${message.data.length} processes`);
                                    break;
                                default:
                                    logMessage(`Received unknown message type: ${message.type}`);
                            }
                        } catch (e) {
                            logMessage('Error processing message: ' + e);
                        }
                    };
                }
                
                function disconnect() {
                    if (ws) {
                        ws.close();
                        ws = null;
                    }
                }
                
                function requestData() {
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: 'getInitialData' }));
                        logMessage('Requested initial data');
                    } else {
                        logMessage('Not connected, cannot request data');
                    }
                }
                
                function logMessage(message) {
                    const item = document.createElement('div');
                    item.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
                    messagesEl.appendChild(item);
                    messagesEl.scrollTop = messagesEl.scrollHeight;
                }
                
                document.getElementById('connect').addEventListener('click', connect);
                document.getElementById('disconnect').addEventListener('click', disconnect);
                document.getElementById('request-data').addEventListener('click', requestData);
            </script>
        </body>
        </html>
    ''')

# Add the combined API endpoint right after the other API endpoints

# API endpoint for all data combined (faster updates)
@app.route('/api/combined-data', methods=['GET'])
def combined_data():
    """Combined endpoint that returns all data at once to reduce HTTP overhead"""
    try:
        # Get system metrics
        metrics = get_system_metrics()
        
        # Get connections
        connections = []
        if USE_MULTIPROCESSING:
            # Get from multiprocessing but limit to most recent
            all_connections = multiprocessing_monitor.get_network_connections()
            connections = all_connections[:20] if all_connections else []
        elif HAS_NETWORK_ANALYZER and network_analyzer_data:
            # Get from network analyzer
            connections = extract_connections(network_analyzer_data)[:20]
        else:
            # Get from default implementation
            connections = get_network_connections()[:20]
        
        # Always include all data types, but limit the amount of data returned
        # for better performance
        return jsonify({
            'metrics': metrics,
            'connections': connections,
            'processes': get_processes()[:50],  # Limit to top 50 processes
            'events': security_events[-30:],    # Return only the 30 most recent events
            'timestamp': datetime.datetime.now().isoformat()
        })
    except Exception as e:
        print(f"Error getting combined data: {e}")
        return jsonify({
            'error': str(e),
            'timestamp': datetime.datetime.now().isoformat()
        }), 500

if __name__ == '__main__':
    print("Starting Windows IDS Python Backend...")
    print(f"Using SMTP server: {SMTP_HOST}:{SMTP_PORT}")
    
    # Start the multiprocessing monitor if available
    if USE_MULTIPROCESSING:
        print("Starting multiprocessing monitor...")
        multiprocessing_monitor.start()
    
    # Start the external network analyzer if available
    if HAS_NETWORK_ANALYZER:
        print("Starting external network analyzer...")
        network_analyzer.start_analyzer(handle_network_analyzer_data)
    
    # Perform initial security scan
    scan_thread = threading.Thread(target=perform_security_scan)
    scan_thread.daemon = True
    scan_thread.start()
    
    # Start the background thread for updates
    update_thread = threading.Thread(target=background_updates, daemon=True)
    update_thread.start()
    
    # Run the application with eventlet to support both Socket.IO and raw WebSockets
    print("Server running on http://0.0.0.0:5000")
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True) 