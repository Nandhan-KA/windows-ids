import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/alert.dart';
import '../models/threat.dart';
import '../utils/config.dart';

class IDSService {
  static const String _baseUrlKey = 'api_url';
  static const String _defaultBaseUrl = 'http://192.168.1.1:3000';
  
  // Singleton pattern
  static final IDSService _instance = IDSService._internal();
  
  factory IDSService() {
    return _instance;
  }
  
  IDSService._internal();
  
  Future<String> _getBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_baseUrlKey) ?? _defaultBaseUrl;
  }
  
  Future<bool> checkConnection() async {
    try {
      final baseUrl = await _getBaseUrl();
      final response = await http.get(
        Uri.parse('$baseUrl/api/status'),
      ).timeout(const Duration(seconds: 5));
      
      return response.statusCode == 200;
    } catch (e) {
      print('Connection check failed: $e');
      return false;
    }
  }
  
  Future<String> getSystemStatus() async {
    try {
      final baseUrl = await _getBaseUrl();
      final response = await http.get(
        Uri.parse('$baseUrl/api/system/status'),
      ).timeout(const Duration(seconds: 5));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['status'] ?? 'Unknown';
      }
      return 'Unknown';
    } catch (e) {
      print('Failed to get system status: $e');
      return 'Offline';
    }
  }
  
  Future<List<Alert>> getAlerts() async {
    try {
      final baseUrl = await _getBaseUrl();
      final response = await http.get(
        Uri.parse('$baseUrl/api/alerts'),
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((item) => Alert.fromJson(item)).toList();
      }
      
      // Return mock data if server request fails or for development
      return _getMockAlerts();
    } catch (e) {
      print('Failed to fetch alerts: $e');
      return _getMockAlerts();
    }
  }
  
  Future<List<Threat>> getThreats() async {
    try {
      final baseUrl = await _getBaseUrl();
      final response = await http.get(
        Uri.parse('$baseUrl/api/threats'),
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((item) => Threat.fromJson(item)).toList();
      }
      
      // Return mock data if server request fails or for development
      return _getMockThreats();
    } catch (e) {
      print('Failed to fetch threats: $e');
      return _getMockThreats();
    }
  }
  
  Future<void> blockThreat(String threatId) async {
    try {
      final baseUrl = await _getBaseUrl();
      final response = await http.post(
        Uri.parse('$baseUrl/api/threats/$threatId/block'),
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
      final baseUrl = await _getBaseUrl();
      final response = await http.post(
        Uri.parse('$baseUrl/api/threats/$threatId/ignore'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 5));
      
      if (response.statusCode != 200) {
        throw Exception('Failed to ignore threat: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }
  
  Future<void> markThreatAsResolved(String threatId) async {
    try {
      final baseUrl = await _getBaseUrl();
      final response = await http.post(
        Uri.parse('$baseUrl/api/threats/$threatId/resolve'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 5));
      
      if (response.statusCode != 200) {
        throw Exception('Failed to resolve threat: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }
  
  // Mock data for testing
  List<Alert> _getMockAlerts() {
    return [
      Alert(
        id: 'alert-1',
        title: 'Brute Force Detection',
        message: 'Multiple failed login attempts detected from IP 192.168.1.105',
        timestamp: DateTime.now().subtract(const Duration(minutes: 5)),
        priority: 'high',
        isRead: false,
        category: 'security',
        metadata: {
          'sourceIp': '192.168.1.105',
          'targetService': 'SSH',
          'attemptCount': 28
        },
      ),
      Alert(
        id: 'alert-2',
        title: 'Suspicious Network Activity',
        message: 'Unusual outbound traffic detected to known malicious IP',
        timestamp: DateTime.now().subtract(const Duration(hours: 2)),
        priority: 'medium',
        isRead: true,
        category: 'network',
        metadata: {
          'sourceProcess': 'unknown.exe',
          'destinationIp': '45.132.192.12',
          'port': 8080
        },
      ),
      Alert(
        id: 'alert-3',
        title: 'System Resource Spike',
        message: 'CPU usage exceeded 95% for more than 10 minutes',
        timestamp: DateTime.now().subtract(const Duration(days: 1)),
        priority: 'low',
        isRead: false,
        category: 'system',
        metadata: {
          'cpuUsage': '97%',
          'topProcess': 'chrome.exe',
          'duration': '15 minutes'
        },
      ),
    ];
  }
  
  List<Threat> _getMockThreats() {
    return [
      Threat(
        id: 'threat-1',
        title: 'Brute Force Attack',
        type: 'Brute Force',
        source: '192.168.1.105',
        timestamp: DateTime.now().subtract(const Duration(minutes: 15)),
        severity: 'High',
        status: 'Active',
        description: 'Multiple failed login attempts detected from a single IP address targeting the administrator account.',
        affectedSystems: ['Authentication Service', 'SSH Server'],
        mitigationSteps: [
          'Block source IP address',
          'Enable account lockout policy',
          'Implement multi-factor authentication'
        ],
        ipAddress: '192.168.1.105',
        port: 22,
        process: 'sshd',
        details: {
          'attemptCount': 48,
          'targetUser': 'admin',
          'sourceCountry': 'Unknown'
        },
      ),
      Threat(
        id: 'threat-2',
        title: 'Malware Detection',
        type: 'Malware',
        source: 'email.exe',
        timestamp: DateTime.now().subtract(const Duration(hours: 3)),
        severity: 'Critical',
        status: 'Blocked',
        description: 'Malicious executable detected attempting to establish connection with known command and control server.',
        affectedSystems: ['Endpoint', 'Network'],
        mitigationSteps: [
          'Isolate affected system',
          'Scan system with anti-malware',
          'Update security definitions'
        ],
        process: 'email.exe',
        ipAddress: '185.143.22.132',
        port: 8080,
        details: {
          'malwareType': 'Trojan',
          'signatureId': 'MAL-2021-11424',
          'registryModifications': true
        },
      ),
      Threat(
        id: 'threat-3',
        title: 'DDoS Attack',
        type: 'DDoS',
        source: 'Multiple',
        timestamp: DateTime.now().subtract(const Duration(hours: 6)),
        severity: 'Medium',
        status: 'Active',
        description: 'Distributed denial of service attack detected targeting web server.',
        affectedSystems: ['Web Server', 'Firewall'],
        mitigationSteps: [
          'Enable DDoS protection on firewall',
          'Implement rate limiting',
          'Contact ISP for upstream filtering'
        ],
        details: {
          'attackType': 'SYN Flood',
          'packetRate': '15,000 pps',
          'bandwidth': '1.2 Gbps'
        },
      ),
      Threat(
        id: 'threat-4',
        title: 'Suspicious File Activity',
        type: 'Ransomware',
        source: 'unknown_process.exe',
        timestamp: DateTime.now().subtract(const Duration(days: 1)),
        severity: 'Low',
        status: 'Investigating',
        description: 'Process attempting to encrypt files with known ransomware patterns.',
        affectedSystems: ['File System'],
        mitigationSteps: [
          'Terminate suspicious process',
          'Restore from backup if necessary',
          'Scan for additional malware presence'
        ],
        process: 'unknown_process.exe',
        details: {
          'fileCount': 23,
          'fileTypes': ['.docx', '.xlsx', '.pdf'],
          'encryptionAttempted': true
        },
      ),
    ];
  }
} 