import 'package:flutter/material.dart';
import '../models/threat.dart';
import '../services/ids_service.dart';
import '../widgets/threat_card.dart';
import 'threat_detail_screen.dart';
import '../utils/app_theme.dart';

class ThreatsScreen extends StatefulWidget {
  const ThreatsScreen({super.key});

  @override
  State<ThreatsScreen> createState() => _ThreatsScreenState();
}

class _ThreatsScreenState extends State<ThreatsScreen> {
  final IDSService _idsService = IDSService();
  List<Threat> _threats = [];
  List<Threat> _filteredThreats = [];
  bool _isLoading = true;
  String? _errorMessage;
  String _searchQuery = '';
  String _severityFilter = 'All';

  @override
  void initState() {
    super.initState();
    _loadThreats();
  }

  Future<void> _loadThreats() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final threats = await _idsService.getThreats();
      setState(() {
        _threats = threats;
        _applyFilters();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to load threats: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  void _applyFilters() {
    setState(() {
      _filteredThreats = _threats.where((threat) {
        // Apply search filter
        final matchesSearch = threat.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            threat.source.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            threat.type.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            threat.description.toLowerCase().contains(_searchQuery.toLowerCase());
        
        // Apply severity filter
        final matchesSeverity = _severityFilter == 'All' || threat.severity.toLowerCase() == _severityFilter.toLowerCase();
        
        return matchesSearch && matchesSeverity;
      }).toList();
    });
  }

  void _showThreatDetails(Threat threat) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ThreatDetailScreen(threat: threat),
      ),
    );

    // If the threat was blocked or action was taken, refresh the list
    if (result == true) {
      _loadThreats();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Threats'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadThreats,
          ),
        ],
      ),
      body: Column(
        children: [
          _buildFilterBar(),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _loadThreats,
              child: _buildContent(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterBar() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          TextField(
            decoration: const InputDecoration(
              hintText: 'Search threats...',
              prefixIcon: Icon(Icons.search),
              border: OutlineInputBorder(),
            ),
            onChanged: (value) {
              setState(() {
                _searchQuery = value;
                _applyFilters();
              });
            },
          ),
          const SizedBox(height: 8),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilterChip('All'),
                _buildFilterChip('Critical'),
                _buildFilterChip('High'),
                _buildFilterChip('Medium'),
                _buildFilterChip('Low'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String severity) {
    final isSelected = _severityFilter == severity;
    
    return Padding(
      padding: const EdgeInsets.only(right: 8.0),
      child: FilterChip(
        label: Text(severity),
        selected: isSelected,
        onSelected: (selected) {
          setState(() {
            _severityFilter = selected ? severity : 'All';
            _applyFilters();
          });
        },
        backgroundColor: Colors.grey[200],
        selectedColor: _getSeverityColor(severity).withOpacity(0.2),
      ),
    );
  }

  Color _getSeverityColor(String severity) {
    switch (severity.toLowerCase()) {
      case 'critical':
        return AppTheme.criticalSeverityColor;
      case 'high':
        return AppTheme.highSeverityColor;
      case 'medium':
        return AppTheme.mediumSeverityColor;
      case 'low':
        return AppTheme.lowSeverityColor;
      default:
        return Colors.grey;
    }
  }

  Widget _buildContent() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: 16),
            Text(_errorMessage!, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadThreats,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_filteredThreats.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.security, size: 48, color: Colors.grey),
            const SizedBox(height: 16),
            Text(
              _threats.isEmpty 
                  ? 'No threats found' 
                  : 'No threats match your filters',
              style: const TextStyle(fontSize: 18, color: Colors.grey),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _filteredThreats.length,
      itemBuilder: (context, index) {
        final threat = _filteredThreats[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 12.0),
          child: GestureDetector(
            onTap: () => _showThreatDetails(threat),
            child: ThreatCard(threat: threat),
          ),
        );
      },
    );
  }
} 