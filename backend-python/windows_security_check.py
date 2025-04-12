"""
Windows Security Check Module
This module provides security checks for Windows systems.
"""

import os
import sys
import subprocess
import socket
import re
import psutil
import win32api
import win32con
import win32security
import win32net
import win32netcon
import wmi
from datetime import datetime
import platform

def get_firewall_status():
    """Check if Windows Firewall is enabled"""
    try:
        # Run PowerShell command to get firewall status
        cmd = "powershell -Command \"Get-NetFirewallProfile | Select-Object Name, Enabled | Format-Table -AutoSize\""
        result = subprocess.run(cmd, capture_output=True, text=True, shell=True)
        
        return {
            'status': 'success',
            'data': result.stdout,
            'enabled': 'True' in result.stdout
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }

def get_running_services():
    """Get list of running services"""
    try:
        # Using WMI to get running services
        c = wmi.WMI()
        services = []
        
        for service in c.Win32_Service(State="Running"):
            services.append({
                'name': service.Name,
                'display_name': service.DisplayName,
                'start_mode': service.StartMode,
                'status': service.Status,
                'path': service.PathName
            })
            
        return {
            'status': 'success',
            'count': len(services),
            'services': services
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }

def check_suspicious_processes():
    """Check for potentially suspicious processes"""
    suspicious_processes = []
    
    try:
        # Using psutil to get processes
        for proc in psutil.process_iter(['pid', 'name', 'username', 'cmdline']):
            try:
                process_info = proc.info
                
                # Check for processes with no name
                if not process_info['name']:
                    suspicious_processes.append({
                        'pid': process_info['pid'],
                        'name': 'Unknown',
                        'reason': 'Unnamed process',
                        'cmdline': process_info.get('cmdline', [])
                    })
                    continue
                    
                # Check for common names used by malware
                suspicious_names = ['netcat', 'nc.exe', 'mimikatz', 'psexec', 'bloodhound']
                for name in suspicious_names:
                    if name.lower() in process_info['name'].lower():
                        suspicious_processes.append({
                            'pid': process_info['pid'],
                            'name': process_info['name'],
                            'reason': f'Potentially malicious name: {name}',
                            'cmdline': process_info.get('cmdline', [])
                        })
                        break
                        
                # Check for processes running from temp directories
                if process_info.get('cmdline'):
                    cmdline = ' '.join(process_info['cmdline']).lower()
                    if '\\temp\\' in cmdline or '\\tmp\\' in cmdline:
                        suspicious_processes.append({
                            'pid': process_info['pid'],
                            'name': process_info['name'],
                            'reason': 'Running from temp directory',
                            'cmdline': process_info.get('cmdline', [])
                        })
                    
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                pass
                
        return {
            'status': 'success',
            'count': len(suspicious_processes),
            'processes': suspicious_processes
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }

def check_users_and_groups():
    """Get information about users and groups"""
    try:
        # Get users
        users = []
        resume = 0
        while True:
            user_list, total, resume = win32net.NetUserEnum(
                None, 1, win32netcon.FILTER_NORMAL_ACCOUNT, resume
            )
            users.extend(user_list)
            if not resume:
                break
                
        # Get admin group members
        admins = []
        try:
            admin_group = win32net.NetLocalGroupGetMembers(None, "Administrators", 1)
            for admin in admin_group:
                admins.append(admin['name'])
        except:
            pass
            
        return {
            'status': 'success',
            'users': users,
            'admin_users': admins,
            'user_count': len(users),
            'admin_count': len(admins)
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }

def check_scheduled_tasks():
    """Check scheduled tasks"""
    try:
        cmd = "powershell -Command \"Get-ScheduledTask | Where-Object {$_.State -eq 'Ready'} | Select-Object TaskName, TaskPath | Format-Table -AutoSize\""
        result = subprocess.run(cmd, capture_output=True, text=True, shell=True)
        
        # Count tasks
        tasks = [line for line in result.stdout.split('\n') if line.strip() and not line.startswith('TaskName')]
        
        return {
            'status': 'success',
            'count': len(tasks),
            'output': result.stdout
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }

def check_listening_ports():
    """Check for listening ports"""
    try:
        listening_ports = []
        
        for conn in psutil.net_connections(kind='inet'):
            if conn.status == 'LISTEN':
                try:
                    process = psutil.Process(conn.pid)
                    listening_ports.append({
                        'port': conn.laddr.port,
                        'address': conn.laddr.ip,
                        'pid': conn.pid,
                        'process_name': process.name(),
                        'cmdline': process.cmdline()
                    })
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    listening_ports.append({
                        'port': conn.laddr.port,
                        'address': conn.laddr.ip,
                        'pid': conn.pid,
                        'process_name': 'Unknown',
                        'cmdline': []
                    })
        
        return {
            'status': 'success',
            'count': len(listening_ports),
            'ports': listening_ports
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }

def run_security_scan():
    """Run a comprehensive security scan and return results"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    return {
        'timestamp': timestamp,
        'hostname': socket.gethostname(),
        'ip_address': socket.gethostbyname(socket.gethostname()),
        'firewall': get_firewall_status(),
        'services': get_running_services(),
        'suspicious_processes': check_suspicious_processes(),
        'users': check_users_and_groups(),
        'scheduled_tasks': check_scheduled_tasks(),
        'listening_ports': check_listening_ports()
    }

# Suspicious process names that might indicate malware
SUSPICIOUS_PROCESS_NAMES = [
    "cryptominer", "miner", "xmrig", "systemupgrade",
    "system32.exe", "winlogin.exe", "svchost32.exe"
]

# Suspicious process behaviors
def is_process_suspicious(proc):
    try:
        # Check name against suspicious list
        if any(susp in proc.name().lower() for susp in SUSPICIOUS_PROCESS_NAMES):
            return True, f"Matches known suspicious name"
        
        # Check CPU usage (high CPU usage may indicate cryptomining)
        if proc.cpu_percent(interval=0.1) > 90:
            return True, f"High CPU usage: {proc.cpu_percent()}%"
        
        # Check for unusual network connections
        connections = proc.connections()
        suspicious_ports = [4444, 31337, 8545, 8080]
        for conn in connections:
            if hasattr(conn, 'raddr') and conn.raddr:
                if conn.raddr.port in suspicious_ports:
                    return True, f"Connected to suspicious port {conn.raddr.port}"
        
        return False, ""
    except:
        return False, ""

# Get suspicious processes
def get_suspicious_processes():
    suspicious = []
    
    try:
        for proc in psutil.process_iter(['pid', 'name', 'username']):
            try:
                is_suspicious, reason = is_process_suspicious(proc)
                if is_suspicious:
                    suspicious.append({
                        'pid': proc.pid,
                        'name': proc.name(),
                        'reason': reason
                    })
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                pass
        
        return suspicious
    except Exception as e:
        print(f"Error checking processes: {e}")
        return []

# Check Windows Firewall status
def check_firewall_status():
    try:
        if platform.system() != "Windows":
            return {"status": "error", "message": "Not running on Windows"}
        
        # Run the Windows firewall command
        result = subprocess.run(
            ["netsh", "advfirewall", "show", "allprofiles"], 
            capture_output=True, 
            text=True
        )
        
        if result.returncode != 0:
            return {"status": "error", "message": "Failed to check firewall status"}
        
        # Parse the output to determine if firewall is on
        output = result.stdout.lower()
        domain_state = "on" in output.split("domain profile")[1].split("state")[1].split("\n")[0]
        private_state = "on" in output.split("private profile")[1].split("state")[1].split("\n")[0]
        public_state = "on" in output.split("public profile")[1].split("state")[1].split("\n")[0]
        
        all_enabled = domain_state and private_state and public_state
        some_enabled = domain_state or private_state or public_state
        
        return {
            "status": "success",
            "enabled": all_enabled,
            "partially_enabled": some_enabled and not all_enabled,
            "profiles": {
                "domain": domain_state,
                "private": private_state,
                "public": public_state
            }
        }
    except Exception as e:
        print(f"Error checking firewall: {e}")
        return {"status": "error", "message": str(e)}

# Check for admin users
def check_admin_users():
    try:
        if platform.system() != "Windows":
            return {"status": "error", "message": "Not running on Windows"}
        
        # Run the net localgroup administrators command
        result = subprocess.run(
            ["net", "localgroup", "administrators"], 
            capture_output=True, 
            text=True
        )
        
        if result.returncode != 0:
            return {"status": "error", "message": "Failed to check admin users"}
        
        # Parse the output to get admin users
        output = result.stdout
        lines = output.split('\n')
        admin_users = []
        
        record = False
        for line in lines:
            if "---" in line:
                record = True
                continue
            if "The command completed" in line:
                record = False
            if record and line.strip():
                admin_users.append(line.strip())
        
        return {
            "status": "success",
            "admin_count": len(admin_users),
            "admin_users": admin_users
        }
    except Exception as e:
        print(f"Error checking admin users: {e}")
        return {"status": "error", "message": str(e)}

# Check system uptime
def check_system_uptime():
    try:
        boot_time = datetime.fromtimestamp(psutil.boot_time())
        uptime = datetime.now() - boot_time
        
        return {
            "status": "success",
            "boot_time": boot_time.isoformat(),
            "uptime_seconds": uptime.total_seconds(),
            "uptime_days": uptime.total_seconds() / (60 * 60 * 24)
        }
    except Exception as e:
        print(f"Error checking uptime: {e}")
        return {"status": "error", "message": str(e)}

# Run all security checks
def run_security_scan():
    print("Running Windows security scan...")
    
    # Collect security information
    scan_results = {
        "timestamp": datetime.now().isoformat(),
        "hostname": socket.gethostname(),
        "ip_address": socket.gethostbyname(socket.gethostname())
    }
    
    # Get suspicious processes
    suspicious_processes = get_suspicious_processes()
    scan_results["suspicious_processes"] = {
        "status": "success",
        "count": len(suspicious_processes),
        "processes": suspicious_processes
    }
    
    # Check firewall status
    scan_results["firewall"] = check_firewall_status()
    
    # Check admin users
    scan_results["users"] = check_admin_users()
    
    # Check system uptime
    scan_results["uptime"] = check_system_uptime()
    
    print(f"Security scan complete. Found {len(suspicious_processes)} suspicious processes.")
    return scan_results

if __name__ == "__main__":
    # Check if running with admin rights
    try:
        is_admin = os.getuid() == 0
    except AttributeError:
        is_admin = ctypes.windll.shell32.IsUserAnAdmin() != 0
        
    if not is_admin:
        print("Warning: This script should be run with administrator privileges for best results.")
        
    # Run the scan
    results = run_security_scan()
    
    # Print summary
    print(f"Security scan completed at {results['timestamp']}")
    print(f"Hostname: {results['hostname']}")
    print(f"IP Address: {results['ip_address']}")
    print(f"Firewall enabled: {results['firewall'].get('enabled', 'Unknown')}")
    print(f"Running services: {results['services'].get('count', 'Unknown')}")
    print(f"Suspicious processes: {results['suspicious_processes'].get('count', 'Unknown')}")
    print(f"Users: {results['users'].get('user_count', 'Unknown')} (Admins: {results['users'].get('admin_count', 'Unknown')})")
    print(f"Scheduled tasks: {results['scheduled_tasks'].get('count', 'Unknown')}")
    print(f"Listening ports: {results['listening_ports'].get('count', 'Unknown')}")
    
    # If suspicious processes were found, print details
    if results['suspicious_processes'].get('count', 0) > 0:
        print("\nSuspicious processes found:")
        for proc in results['suspicious_processes'].get('processes', []):
            print(f"  PID {proc['pid']}: {proc['name']} - {proc['reason']}")
            
    # If many listening ports, show warning
    if results['listening_ports'].get('count', 0) > 20:
        print("\nWarning: Large number of listening ports detected. This could indicate a security issue.") 