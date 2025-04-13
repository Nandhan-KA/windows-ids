import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:windows_ids_mobile/models/threat.dart';
import 'package:windows_ids_mobile/services/api_service.dart';

class ThreatsProvider with ChangeNotifier {
  final ApiService _apiService;
  List<Threat> _threats = [];
  bool _isLoading = false;
  String? _error;
  
  ThreatsProvider(this._apiService) {
    fetchThreats();
  }
  
  List<Threat> get threats => _threats;
  bool get isLoading => _isLoading;
  String? get error => _error;
  
  Future<void> fetchThreats() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final threats = await _apiService.fetchThreats();
      _threats = threats;
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  void addThreat(Threat threat) {
    if (!_threats.any((t) => t.id == threat.id)) {
      _threats.add(threat);
      notifyListeners();
    }
  }
  
  Future<void> blockThreat(String threatId) async {
    final index = _threats.indexWhere((t) => t.id == threatId);
    if (index == -1) return;
    
    try {
      await _apiService.blockThreat(threatId);
      
      final updatedThreat = _threats[index].copyWith(
        status: 'Blocked',
      );
      
      _threats[index] = updatedThreat;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }
  
  Future<void> ignoreThreat(String threatId) async {
    final index = _threats.indexWhere((t) => t.id == threatId);
    if (index == -1) return;
    
    try {
      await _apiService.ignoreThreat(threatId);
      
      final updatedThreat = _threats[index].copyWith(
        status: 'Ignored',
      );
      
      _threats[index] = updatedThreat;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }
  
  Future<void> markAsResolved(String threatId) async {
    final index = _threats.indexWhere((t) => t.id == threatId);
    if (index == -1) return;
    
    try {
      await _apiService.markThreatAsResolved(threatId);
      
      final updatedThreat = _threats[index].copyWith(
        status: 'Resolved',
      );
      
      _threats[index] = updatedThreat;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }
  
  List<Threat> getThreatsFiltered({
    String? status,
    String? severity,
    String? type,
    String? searchQuery,
  }) {
    return _threats.where((threat) {
      bool statusMatch = status == null || threat.status == status;
      bool severityMatch = severity == null || threat.severity == severity;
      bool typeMatch = type == null || threat.type == type;
      bool searchMatch = searchQuery == null || searchQuery.isEmpty || 
          threat.description.toLowerCase().contains(searchQuery.toLowerCase()) ||
          threat.source.toLowerCase().contains(searchQuery.toLowerCase());
      
      return statusMatch && severityMatch && typeMatch && searchMatch;
    }).toList();
  }
  
  int getActiveThreatCount() {
    return _threats.where((t) => t.status == 'Active').length;
  }
  
  int getBlockedThreatCount() {
    return _threats.where((t) => t.status == 'Blocked').length;
  }
  
  void handleWebSocketThreatUpdate(dynamic data) {
    if (data is String) {
      try {
        final jsonData = jsonDecode(data);
        final threat = Threat.fromJson(jsonData);
        
        final index = _threats.indexWhere((t) => t.id == threat.id);
        if (index == -1) {
          _threats.add(threat);
        } else {
          _threats[index] = threat;
        }
        
        notifyListeners();
      } catch (e) {
        print('Error handling WebSocket threat update: $e');
      }
    }
  }
  
  void clearError() {
    _error = null;
    notifyListeners();
  }
} 