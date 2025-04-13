class Threat {
  final String id;
  final String title;
  final String type;
  final String source;
  final DateTime timestamp;
  final String severity;
  final String status;
  final String description;
  final List<String> affectedSystems;
  final List<String> mitigationSteps;
  final String? ipAddress;
  final int? port;
  final String? process;
  final Map<String, dynamic> details;
  
  Threat({
    required this.id,
    required this.title,
    required this.type,
    required this.source,
    required this.timestamp,
    required this.severity,
    required this.status,
    required this.description,
    required this.affectedSystems,
    required this.mitigationSteps,
    this.ipAddress,
    this.port,
    this.process,
    required this.details,
  });
  
  factory Threat.fromJson(Map<String, dynamic> json) {
    return Threat(
      id: json['id'],
      title: json['title'] ?? json['name'] ?? 'Unknown Threat',
      type: json['type'],
      source: json['source'],
      timestamp: DateTime.parse(json['timestamp'] ?? json['detectedAt']),
      severity: json['severity'],
      status: json['status'],
      description: json['description'],
      affectedSystems: List<String>.from(json['affectedSystems'] ?? []),
      mitigationSteps: List<String>.from(json['mitigationSteps'] ?? []),
      ipAddress: json['ipAddress'] ?? json['source'],
      port: json['port'],
      process: json['process'],
      details: json['details'] ?? {},
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'type': type,
      'source': source,
      'timestamp': timestamp.toIso8601String(),
      'severity': severity,
      'status': status,
      'description': description,
      'affectedSystems': affectedSystems,
      'mitigationSteps': mitigationSteps,
      'ipAddress': ipAddress,
      'port': port,
      'process': process,
      'details': details,
    };
  }
  
  Threat copyWith({
    String? id,
    String? title,
    String? type,
    String? source,
    DateTime? timestamp,
    String? severity,
    String? status,
    String? description,
    List<String>? affectedSystems,
    List<String>? mitigationSteps,
    String? ipAddress,
    int? port,
    String? process,
    Map<String, dynamic>? details,
  }) {
    return Threat(
      id: id ?? this.id,
      title: title ?? this.title,
      type: type ?? this.type,
      source: source ?? this.source,
      timestamp: timestamp ?? this.timestamp,
      severity: severity ?? this.severity,
      status: status ?? this.status,
      description: description ?? this.description,
      affectedSystems: affectedSystems ?? this.affectedSystems,
      mitigationSteps: mitigationSteps ?? this.mitigationSteps,
      ipAddress: ipAddress ?? this.ipAddress,
      port: port ?? this.port,
      process: process ?? this.process,
      details: details ?? this.details,
    );
  }
  
  // Get color for severity
  String get severityColor {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'FF0000'; // Red
      case 'high':
        return 'FF6600'; // Orange
      case 'medium':
        return 'FFCC00'; // Yellow
      case 'low':
        return '00CC00'; // Green
      default:
        return '999999'; // Gray
    }
  }
  
  // Get risk score based on severity
  int get riskScore {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 100;
      case 'high':
        return 75;
      case 'medium':
        return 50;
      case 'low':
        return 25;
      default:
        return 0;
    }
  }
} 