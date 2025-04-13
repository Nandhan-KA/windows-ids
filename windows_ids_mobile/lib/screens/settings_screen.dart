import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/app_theme.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  static const String _apiUrlKey = 'api_url';
  static const String _defaultApiUrl = 'http://192.168.1.1:3000';
  
  final TextEditingController _apiUrlController = TextEditingController();
  bool _isDarkMode = false;
  bool _isNotificationsEnabled = true;
  bool _isLoading = false;
  String? _error;
  
  @override
  void initState() {
    super.initState();
    _loadSettings();
  }
  
  @override
  void dispose() {
    _apiUrlController.dispose();
    super.dispose();
  }
  
  Future<void> _loadSettings() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    
    try {
      final prefs = await SharedPreferences.getInstance();
      
      setState(() {
        _apiUrlController.text = prefs.getString(_apiUrlKey) ?? _defaultApiUrl;
        _isNotificationsEnabled = prefs.getBool('notifications_enabled') ?? true;
        _isDarkMode = Theme.of(context).brightness == Brightness.dark;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load settings: $e';
        _isLoading = false;
      });
    }
  }
  
  Future<void> _saveSettings() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_apiUrlKey, _apiUrlController.text);
      await prefs.setBool('notifications_enabled', _isNotificationsEnabled);
      
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Settings saved successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Failed to save settings: $e';
          _isLoading = false;
        });
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_error != null) _buildErrorBanner(),
                  
                  _buildSection(
                    'Connection Settings',
                    [
                      _buildTextField(
                        'API URL',
                        'Enter the API endpoint URL',
                        _apiUrlController,
                        keyboardType: TextInputType.url,
                      ),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: _testConnection,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                          foregroundColor: AppTheme.primaryColor,
                        ),
                        child: const Text('Test Connection'),
                      ),
                    ],
                  ),
                  
                  _buildSection(
                    'Appearance',
                    [
                      SwitchListTile(
                        title: const Text('Dark Mode'),
                        subtitle: const Text('Use dark theme'),
                        value: _isDarkMode,
                        onChanged: (value) {
                          setState(() {
                            _isDarkMode = value;
                          });
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'This would change the theme. Currently tied to system settings.',
                              ),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                  
                  _buildSection(
                    'Notifications',
                    [
                      SwitchListTile(
                        title: const Text('Enable Notifications'),
                        subtitle: const Text('Receive alerts about security events'),
                        value: _isNotificationsEnabled,
                        onChanged: (value) {
                          setState(() {
                            _isNotificationsEnabled = value;
                          });
                        },
                      ),
                    ],
                  ),
                  
                  _buildSection(
                    'About',
                    [
                      const ListTile(
                        title: Text('Version'),
                        subtitle: Text('1.0.0'),
                        leading: Icon(Icons.info_outline),
                      ),
                      ListTile(
                        title: const Text('Source Code'),
                        subtitle: const Text('View on GitHub'),
                        leading: const Icon(Icons.code),
                        onTap: () {
                          // Open GitHub repository
                        },
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _saveSettings,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      child: const Text('Save Settings'),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
  
  Widget _buildErrorBanner() {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.red.shade200),
      ),
      child: Row(
        children: [
          Icon(Icons.error, color: Colors.red.shade700, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              _error!,
              style: TextStyle(
                color: Colors.red.shade700,
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Card(
          elevation: 2,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: children,
            ),
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }
  
  Widget _buildTextField(
    String label,
    String hint,
    TextEditingController controller, {
    TextInputType keyboardType = TextInputType.text,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        border: const OutlineInputBorder(),
      ),
    );
  }
  
  Future<void> _testConnection() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    
    try {
      // Add actual connection test logic
      await Future.delayed(const Duration(seconds: 2)); // Simulating API call
      
      final success = true; // Replace with actual connection test result
      
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              success
                  ? 'Connection successful'
                  : 'Connection failed. Please check the URL and try again.',
            ),
            backgroundColor: success ? Colors.green : Colors.red,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Connection test failed: $e';
          _isLoading = false;
        });
      }
    }
  }
} 