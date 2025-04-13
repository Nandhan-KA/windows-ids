import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SettingsProvider with ChangeNotifier {
  bool _isDarkMode = false;
  bool _notificationsEnabled = true;
  bool _soundEnabled = true;
  String _serverIp = '192.168.1.100';
  String _serverPort = '5000';
  int _refreshInterval = 30; // in seconds
  bool _autoConnectOnStart = true;
  
  bool get isDarkMode => _isDarkMode;
  bool get notificationsEnabled => _notificationsEnabled;
  bool get soundEnabled => _soundEnabled;
  String get serverIp => _serverIp;
  String get serverPort => _serverPort;
  int get refreshInterval => _refreshInterval;
  bool get autoConnectOnStart => _autoConnectOnStart;
  
  SettingsProvider() {
    _loadSettings();
  }
  
  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    
    _isDarkMode = prefs.getBool('dark_mode') ?? false;
    _notificationsEnabled = prefs.getBool('notifications_enabled') ?? true;
    _soundEnabled = prefs.getBool('sound_enabled') ?? true;
    _serverIp = prefs.getString('local_ip') ?? '192.168.1.100';
    _serverPort = prefs.getString('port') ?? '5000';
    _refreshInterval = prefs.getInt('refresh_interval') ?? 30;
    _autoConnectOnStart = prefs.getBool('auto_connect_on_start') ?? true;
    
    notifyListeners();
  }
  
  Future<void> setDarkMode(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('dark_mode', value);
    _isDarkMode = value;
    notifyListeners();
  }
  
  Future<void> setNotificationsEnabled(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('notifications_enabled', value);
    _notificationsEnabled = value;
    notifyListeners();
  }
  
  Future<void> setSoundEnabled(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('sound_enabled', value);
    _soundEnabled = value;
    notifyListeners();
  }
  
  Future<void> setServerIp(String value) async {
    if (value.isEmpty) return;
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('local_ip', value);
    _serverIp = value;
    notifyListeners();
  }
  
  Future<void> setServerPort(String value) async {
    if (value.isEmpty) return;
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('port', value);
    _serverPort = value;
    notifyListeners();
  }
  
  Future<void> setRefreshInterval(int value) async {
    if (value < 5) value = 5; // Minimum 5 seconds
    if (value > 300) value = 300; // Maximum 5 minutes
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('refresh_interval', value);
    _refreshInterval = value;
    notifyListeners();
  }
  
  Future<void> setAutoConnectOnStart(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('auto_connect_on_start', value);
    _autoConnectOnStart = value;
    notifyListeners();
  }
  
  Future<void> resetToDefaults() async {
    final prefs = await SharedPreferences.getInstance();
    
    await prefs.setBool('dark_mode', false);
    await prefs.setBool('notifications_enabled', true);
    await prefs.setBool('sound_enabled', true);
    await prefs.setString('local_ip', '192.168.1.100');
    await prefs.setString('port', '5000');
    await prefs.setInt('refresh_interval', 30);
    await prefs.setBool('auto_connect_on_start', true);
    
    _isDarkMode = false;
    _notificationsEnabled = true;
    _soundEnabled = true;
    _serverIp = '192.168.1.100';
    _serverPort = '5000';
    _refreshInterval = 30;
    _autoConnectOnStart = true;
    
    notifyListeners();
  }
} 