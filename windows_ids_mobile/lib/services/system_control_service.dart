import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/system_action.dart';

class SystemControlService {
  static const String _baseUrlKey = 'api_url';
  static const String _defaultBaseUrl = 'http://192.168.1.1:3000';
  
  // Singleton pattern
  static final SystemControlService _instance = SystemControlService._internal();
  
  factory SystemControlService() {
    return _instance;
  }
  
  SystemControlService._internal();
  
  Future<String> _getBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_baseUrlKey) ?? _defaultBaseUrl;
  }

  Future<bool> sleepSystem({int delaySeconds = 0, bool force = false}) async {
    return _performSystemAction('sleep', delaySeconds, force);
  }
  
  Future<bool> hibernateSystem({int delaySeconds = 0, bool force = false}) async {
    return _performSystemAction('hibernate', delaySeconds, force);
  }
  
  Future<bool> shutdownSystem({int delaySeconds = 0, bool force = false}) async {
    return _performSystemAction('shutdown', delaySeconds, force);
  }
  
  Future<bool> restartSystem({int delaySeconds = 0, bool force = false}) async {
    return _performSystemAction('restart', delaySeconds, force);
  }
  
  Future<bool> lockScreen() async {
    return _performSystemAction('lockScreen', 0, false);
  }
  
  Future<bool> blockNetworkTraffic() async {
    return _performSystemAction('blockTraffic', 0, false);
  }
  
  Future<bool> resumeNetworkTraffic() async {
    return _performSystemAction('resumeTraffic', 0, false);
  }
  
  Future<bool> disableNetwork() async {
    return _performSystemAction('disableNetwork', 0, false);
  }
  
  Future<bool> enableNetwork() async {
    return _performSystemAction('enableNetwork', 0, false);
  }
  
  Future<bool> emergencyResponse(String threatId, String responseType) async {
    try {
      final baseUrl = await _getBaseUrl();
      final response = await http.post(
        Uri.parse('$baseUrl/api/system/emergency-response'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'threatId': threatId,
          'responseType': responseType,
        }),
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        return true;
      } else {
        throw Exception('Failed to execute emergency response: ${response.statusCode}');
      }
    } catch (e) {
      print('Emergency response failed: $e');
      throw Exception('Network error: $e');
    }
  }
  
  Future<bool> _performSystemAction(String action, int delaySeconds, bool force) async {
    try {
      final baseUrl = await _getBaseUrl();
      final response = await http.post(
        Uri.parse('$baseUrl/api/system/action'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'action': action,
          'delaySeconds': delaySeconds,
          'force': force,
        }),
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        return true;
      } else {
        throw Exception('Failed to perform system action: ${response.statusCode}');
      }
    } catch (e) {
      print('System action failed: $e');
      throw Exception('Network error: $e');
    }
  }
  
  Future<List<SystemAction>> getRecentActions() async {
    try {
      final baseUrl = await _getBaseUrl();
      final response = await http.get(
        Uri.parse('$baseUrl/api/system/actions'),
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((item) => SystemAction.fromJson(item)).toList();
      }
      
      return _getMockActions();
    } catch (e) {
      print('Failed to fetch recent actions: $e');
      return _getMockActions();
    }
  }
  
  List<SystemAction> _getMockActions() {
    return [
      SystemAction(
        id: 'action-1',
        action: 'blockTraffic',
        timestamp: DateTime.now().subtract(const Duration(minutes: 30)),
        status: 'completed',
        result: 'Blocked network traffic successfully',
        force: false,
      ),
      SystemAction(
        id: 'action-2',
        action: 'lockScreen',
        timestamp: DateTime.now().subtract(const Duration(hours: 2)),
        status: 'completed',
        result: 'Screen locked successfully',
        force: false,
      ),
      SystemAction(
        id: 'action-3',
        action: 'restart',
        timestamp: DateTime.now().subtract(const Duration(days: 1)),
        status: 'failed',
        result: 'User cancelled the restart',
        delaySeconds: 60,
        force: false,
      ),
    ];
  }
} 