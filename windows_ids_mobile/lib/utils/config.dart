import 'package:shared_preferences/shared_preferences.dart';

class Config {
  static const String _apiUrlKey = 'api_url';
  static const String _defaultApiUrl = 'http://192.168.1.1:3000'; // Default local API URL
  
  // Get the API URL from SharedPreferences or use default
  Future<String> getApiUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_apiUrlKey) ?? _defaultApiUrl;
  }
  
  // Save API URL to SharedPreferences
  Future<bool> setApiUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.setString(_apiUrlKey, url);
  }
  
  // Reset API URL to default
  Future<bool> resetApiUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.setString(_apiUrlKey, _defaultApiUrl);
  }
} 