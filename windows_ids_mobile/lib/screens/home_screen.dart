import 'package:flutter/material.dart';
import '../widgets/status_card.dart';
import '../widgets/summary_card.dart';
import '../widgets/system_control_panel.dart';
import '../widgets/threat_activity_chart.dart';
import '../models/alert.dart';
import '../models/threat.dart';
import '../services/ids_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _isConnected = false;
  List<Alert> _alerts = [];
  List<Threat> _threats = [];
  String _systemStatus = "Unknown";
  bool _isLoading = true;
  final IDSService _idsService = IDSService();
  
  @override
  void initState() {
    super.initState();
    _loadData();
  }
  
  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
    });
    
    try {
      final isConnected = await _idsService.checkConnection();
      final alerts = await _idsService.getAlerts();
      final threats = await _idsService.getThreats();
      final status = await _idsService.getSystemStatus();
      
      setState(() {
        _isConnected = isConnected;
        _alerts = alerts;
        _threats = threats;
        _systemStatus = status;
        _isLoading = false;
      });
    } catch (e) {
      // Error handling
      setState(() {
        _isConnected = false;
        _isLoading = false;
      });
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Windows IDS Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ConnectionStatusBanner(isConnected: _isConnected),
                    const SizedBox(height: 16),
                    
                    _buildStatusSection(),
                    const SizedBox(height: 16),
                    
                    _buildSummarySection(),
                    const SizedBox(height: 16),
                    
                    ThreatActivityChart(threats: _threats),
                    const SizedBox(height: 24),
                    
                    Text(
                      'System Control',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    const SystemControlPanel(),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
      ),
    );
  }
  
  Widget _buildStatusSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'System Status',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 8),
        StatusCard(
          status: _systemStatus,
          lastUpdated: DateTime.now(),
        ),
      ],
    );
  }
  
  Widget _buildSummarySection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Security Summary',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: SummaryCard(
                title: 'Alerts',
                count: _alerts.length,
                icon: Icons.notifications,
                color: Colors.orange,
                onTap: () => _navigateToAlertsTab(),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: SummaryCard(
                title: 'Threats',
                count: _threats.length,
                icon: Icons.security,
                color: Colors.red,
                onTap: () => _navigateToThreatsTab(),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        _buildSecurityInsights(),
      ],
    );
  }
  
  Widget _buildSecurityInsights() {
    // Count active threats by severity
    final criticalCount = _threats.where((t) => 
        t.status.toLowerCase() == 'active' && 
        t.severity.toLowerCase() == 'critical').length;
        
    final highCount = _threats.where((t) => 
        t.status.toLowerCase() == 'active' && 
        t.severity.toLowerCase() == 'high').length;
    
    if (criticalCount > 0 || highCount > 0) {
      return Card(
        elevation: 0,
        color: Colors.red.shade50,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: Colors.red.shade200),
        ),
        child: Padding(
          padding: const EdgeInsets.all(12.0),
          child: Row(
            children: [
              Icon(Icons.warning_amber, color: Colors.red.shade700),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Active Threats Require Attention',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.red.shade700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      criticalCount > 0
                          ? '$criticalCount critical and $highCount high severity threats detected'
                          : '$highCount high severity threats detected',
                      style: TextStyle(
                        color: Colors.red.shade700,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              TextButton(
                onPressed: _navigateToThreatsTab,
                child: const Text('View'),
              ),
            ],
          ),
        ),
      );
    }
    
    return Card(
      elevation: 0,
      color: Colors.green.shade50,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.green.shade200),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Row(
          children: [
            Icon(Icons.check_circle, color: Colors.green.shade700),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'System Secure',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.green.shade700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'No critical or high severity active threats detected',
                    style: TextStyle(
                      color: Colors.green.shade700,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  void _navigateToAlertsTab() {
    // Navigate to alerts tab
    final bottomNavBar = (context.findAncestorWidgetOfExactType<Scaffold>()?.bottomNavigationBar as NavigationBar?);
    if (bottomNavBar != null) {
      final navBarState = context.findAncestorStateOfType<State<NavigationBar>>();
      if (navBarState != null) {
        // This will work if we're directly accessing the parent widget state
        (navBarState as dynamic)._onItemTapped(1); // Index 1 is for Alerts tab
      }
    }
  }
  
  void _navigateToThreatsTab() {
    // Navigate to threats tab
    final bottomNavBar = (context.findAncestorWidgetOfExactType<Scaffold>()?.bottomNavigationBar as NavigationBar?);
    if (bottomNavBar != null) {
      final navBarState = context.findAncestorStateOfType<State<NavigationBar>>();
      if (navBarState != null) {
        // This will work if we're directly accessing the parent widget state
        (navBarState as dynamic)._onItemTapped(2); // Index 2 is for Threats tab
      }
    }
  }
}

class ConnectionStatusBanner extends StatelessWidget {
  final bool isConnected;
  
  const ConnectionStatusBanner({super.key, required this.isConnected});
  
  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
      decoration: BoxDecoration(
        color: isConnected ? Colors.green.shade100 : Colors.red.shade100,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isConnected ? Colors.green.shade400 : Colors.red.shade400,
        ),
      ),
      child: Row(
        children: [
          Icon(
            isConnected ? Icons.check_circle : Icons.error,
            color: isConnected ? Colors.green.shade700 : Colors.red.shade700,
          ),
          const SizedBox(width: 12),
          Text(
            isConnected 
                ? 'Connected to Windows IDS'
                : 'Not connected to Windows IDS',
            style: TextStyle(
              color: isConnected ? Colors.green.shade700 : Colors.red.shade700,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
} 