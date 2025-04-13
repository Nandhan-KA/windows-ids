import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:windows_ids_mobile/models/alert.dart';
import 'package:windows_ids_mobile/models/threat.dart';
import 'package:windows_ids_mobile/models/report.dart';
import 'package:windows_ids_mobile/models/system_action.dart';
import 'package:windows_ids_mobile/utils/config.dart';

class ApiService {
  static const String _localIpKey = 'local_ip';
  static const String _portKey = 'port';
  
  late String _baseUrl;
  late String _wsUrl;
  io.Socket? _socket;
  
  // Singleton instance
  static final ApiService _instance = ApiService._internal();
  
  factory ApiService() {
    return _instance;
  }
  
  ApiService._internal();
  
  // Initialize the service with the server IP and port
  Future<void> initialize() async {
    final prefs = await SharedPreferences.getInstance();
    final ip = prefs.getString(_localIpKey) ?? '192.168.1.100';
    final port = prefs.getString(_portKey) ?? '5000';
    
    _baseUrl = 'http://$ip:$port/api';
    _wsUrl = 'http://$ip:$port';
    
    _setupSocketConnection();
  }
  
  // Update the server connection settings
  Future<void> updateServerSettings(String ip, String port) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_localIpKey, ip);
    await prefs.setString(_portKey, port);
    
    _baseUrl = 'http://$ip:$port/api';
    _wsUrl = 'http://$ip:$port';
    
    // Disconnect and reconnect socket with new settings
    _socket?.disconnect();
    _setupSocketConnection();
  }
  
  // Setup WebSocket connection
  void _setupSocketConnection() {
    _socket = io.io(_wsUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': true,
    });
    
    _socket?.onConnect((_) {
      print('Connected to WebSocket');
    });
    
    _socket?.onDisconnect((_) {
      print('Disconnected from WebSocket');
    });
    
    _socket?.onError((error) {
      print('Socket Error: $error');
    });
  }
  
  // Subscribe to real-time threat updates
  void subscribeToThreats(Function(Threat) onThreatReceived) {
    _socket?.on('simulated-attack', (data) {
      try {
        final threat = Threat.fromJson(data);
        onThreatReceived(threat);
      } catch (e) {
        print('Error parsing threat: $e');
      }
    });
  }
  
  // Subscribe to real-time alert updates
  void subscribeToAlerts(Function(Alert) onAlertReceived) {
    _socket?.on('attack-alert', (data) {
      try {
        final alert = Alert.fromJson(data);
        onAlertReceived(alert);
      } catch (e) {
        print('Error parsing alert: $e');
      }
    });
  }
  
  // Check if server is reachable
  Future<bool> checkServerConnection() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/status'))
          .timeout(const Duration(seconds: 5));
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
  
  // Get all threats
  Future<List<Threat>> getThreats() async {
    try {
      // First try to fetch from the server
      try {
        final response = await http.get(Uri.parse('$_baseUrl/threats'))
            .timeout(const Duration(seconds: 5));
        
        if (response.statusCode == 200) {
          final List<dynamic> data = json.decode(response.body);
          return data.map((item) => Threat.fromJson(item)).toList();
        }
      } catch (e) {
        print('Error fetching threats from server: $e');
      }
      
      // If server request fails, use mock data
      return _getMockThreats();
    } catch (e) {
      print('Error getting threats: $e');
      return [];
    }
  }
  
  // Get all alerts
  Future<List<Alert>> getAlerts() async {
    try {
      // First try to fetch from the server
      try {
        final response = await http.get(Uri.parse('$_baseUrl/attacks/alerts'))
            .timeout(const Duration(seconds: 5));
        
        if (response.statusCode == 200) {
          final Map<String, dynamic> data = json.decode(response.body);
          if (data['status'] == 'success' && data['alerts'] != null) {
            final List<dynamic> alerts = data['alerts'];
            return alerts.map((item) => Alert.fromJson(item)).toList();
          }
        }
      } catch (e) {
        print('Error fetching alerts from server: $e');
      }
      
      // If server request fails, use mock data
      return _getMockAlerts();
    } catch (e) {
      print('Error getting alerts: $e');
      return [];
    }
  }
  
  // Get all reports
  Future<List<Report>> getReports() async {
    try {
      // First try to fetch from the server
      try {
        final response = await http.get(Uri.parse('$_baseUrl/reports'))
            .timeout(const Duration(seconds: 5));
        
        if (response.statusCode == 200) {
          final List<dynamic> data = json.decode(response.body);
          return data.map((item) => Report.fromJson(item)).toList();
        }
      } catch (e) {
        print('Error fetching reports from server: $e');
      }
      
      // If server request fails, use mock data
      return _getMockReports();
    } catch (e) {
      print('Error getting reports: $e');
      return [];
    }
  }
  
  // Perform system action
  Future<bool> performSystemAction(SystemAction action) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/system/action'),
        headers: <String, String>{
          'Content-Type': 'application/json',
        },
        body: json.encode(action.toJson()),
      ).timeout(const Duration(seconds: 10));
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error performing system action: $e');
      return false;
    }
  }
  
  // Download report
  Future<String?> downloadReport(Report report) async {
    try {
      final response = await http.get(Uri.parse(report.fileUrl))
          .timeout(const Duration(seconds: 30));
      
      if (response.statusCode == 200) {
        // Save the file locally
        final directory = Directory('/storage/emulated/0/Download');
        if (!await directory.exists()) {
          await directory.create(recursive: true);
        }
        
        final file = File('${directory.path}/${report.title}.${report.fileType}');
        await file.writeAsBytes(response.bodyBytes);
        
        return file.path;
      }
      return null;
    } catch (e) {
      print('Error downloading report: $e');
      return null;
    }
  }
  
  // Mock data for testing without server
  List<Threat> _getMockThreats() {
    return [
      Threat(
        id: 'sim-1',
        name: 'Brute Force Attack Detected',
        source: '192.168.1.105',
        target: 'System',
        severity: 'high',
        status: 'active',
        detectedAt: DateTime.now().subtract(const Duration(minutes: 5)).toIso8601String(),
        type: 'Brute Force',
        description: 'Multiple failed login attempts detected from single source',
        simulated: true,
        affectedSystems: ['Authentication Service', 'Firewall'],
        techniques: ['Dictionary Attack', 'Password Spraying'],
        mitigationSteps: ['Enable account lockout policy', 'Implement multi-factor authentication'],
      ),
      Threat(
        id: 'sim-2',
        name: 'Port Scan Attack Detected',
        source: '192.168.1.120',
        target: 'System',
        severity: 'medium',
        status: 'active',
        detectedAt: DateTime.now().subtract(const Duration(minutes: 15)).toIso8601String(),
        type: 'Port Scan',
        description: 'Systematic scan of multiple ports detected',
        simulated: true,
        affectedSystems: ['Firewall'],
        techniques: ['TCP SYN Scan'],
        mitigationSteps: ['Block source IP at firewall'],
      ),
      Threat(
        id: 'sim-3',
        name: 'DDoS Attack Detected',
        source: '192.168.1.150',
        target: 'System',
        severity: 'critical',
        status: 'blocked',
        detectedAt: DateTime.now().subtract(const Duration(hours: 1)).toIso8601String(),
        type: 'DDoS',
        description: 'Unusual traffic pattern consistent with distributed denial of service',
        simulated: true,
        affectedSystems: ['Web Server', 'Firewall', 'Network'],
        techniques: ['SYN Flood', 'HTTP Flood'],
        mitigationSteps: ['Enable traffic rate limiting', 'Divert traffic through cleaning centers'],
        networkTraffic: 325,
      ),
    ];
  }
  
  List<Alert> _getMockAlerts() {
    return [
      Alert(
        id: 'alert-1',
        timestamp: DateTime.now().subtract(const Duration(minutes: 10)).toIso8601String(),
        signature: 'Brute Force Attack',
        description: 'Multiple failed login attempts detected',
        severity: 'high',
        connection: Connection(
          remoteIp: '192.168.1.105',
          remotePort: '12345',
          localIp: '192.168.1.100',
          localPort: '22',
          protocol: 'TCP',
        ),
        details: 'Multiple failed login attempts detected from single source',
        status: 'active',
        actions: ['block', 'quarantine', 'investigate', 'resolve'],
      ),
      Alert(
        id: 'alert-2',
        timestamp: DateTime.now().subtract(const Duration(minutes: 30)).toIso8601String(),
        signature: 'Port Scan Detection',
        description: 'Systematic scan of multiple ports',
        severity: 'medium',
        connection: Connection(
          remoteIp: '192.168.1.120',
          remotePort: '54321',
          localIp: '192.168.1.100',
          protocol: 'TCP',
        ),
        details: 'Sequential scanning of multiple ports detected',
        status: 'investigating',
        actions: ['block', 'resolve'],
      ),
      Alert(
        id: 'alert-3',
        timestamp: DateTime.now().subtract(const Duration(hours: 2)).toIso8601String(),
        signature: 'Malware Communication',
        description: 'Connection to known malware C&C server',
        severity: 'critical',
        connection: Connection(
          remoteIp: '192.168.1.130',
          remotePort: '8080',
          localIp: '192.168.1.100',
          localPort: '49152',
          protocol: 'TCP',
        ),
        details: 'Connection to known malware command and control server detected',
        status: 'blocked',
        actions: ['resolve'],
      ),
    ];
  }
  
  List<Report> _getMockReports() {
    return [
      Report(
        id: 'report-1',
        title: 'Security Threat Report',
        description: 'Weekly summary of security threats and incidents',
        createdAt: DateTime.now().subtract(const Duration(days: 1)).toIso8601String(),
        type: ReportType.security,
        fileUrl: 'http://example.com/reports/security-report.pdf',
        fileSize: 1024 * 1024 * 2, // 2 MB
        fileType: 'pdf',
        tags: ['weekly', 'security', 'threats'],
      ),
      Report(
        id: 'report-2',
        title: 'Network Traffic Analysis',
        description: 'Analysis of network traffic patterns and anomalies',
        createdAt: DateTime.now().subtract(const Duration(days: 3)).toIso8601String(),
        type: ReportType.network,
        fileUrl: 'http://example.com/reports/network-analysis.pdf',
        fileSize: 1024 * 1024 * 5, // 5 MB
        fileType: 'pdf',
        tags: ['network', 'traffic', 'analysis'],
      ),
      Report(
        id: 'report-3',
        title: 'System Performance Report',
        description: 'Monthly system performance and resource utilization report',
        createdAt: DateTime.now().subtract(const Duration(days: 7)).toIso8601String(),
        type: ReportType.performance,
        fileUrl: 'http://example.com/reports/performance-report.pdf',
        fileSize: 1024 * 1024 * 1, // 1 MB
        fileType: 'pdf',
        tags: ['monthly', 'performance', 'system'],
      ),
    ];
  }

  Future<List<Threat>> fetchThreats() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/api/threats'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => Threat.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load threats: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<void> blockThreat(String threatId) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/api/threats/$threatId/block'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode != 200) {
        throw Exception('Failed to block threat: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<void> ignoreThreat(String threatId) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/api/threats/$threatId/ignore'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode != 200) {
        throw Exception('Failed to ignore threat: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<void> markAsResolved(String threatId) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/api/threats/$threatId/resolve'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode != 200) {
        throw Exception('Failed to resolve threat: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<String> generateThreatReport() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/api/reports/generate'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        return json.decode(response.body)['reportUrl'] ?? '';
      } else {
        throw Exception('Failed to generate report: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<void> controlSystem(String action) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/api/system/control'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'action': action}),
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode != 200) {
        throw Exception('Failed to execute system action: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }
} 