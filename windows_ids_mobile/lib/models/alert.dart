class Alert {
  final String id;
  final String title;
  final String message;
  final DateTime timestamp;
  final String priority;
  final bool isRead;
  final String category;
  final Map<String, dynamic> metadata;

  Alert({
    required this.id,
    required this.title,
    required this.message,
    required this.timestamp,
    required this.priority,
    required this.isRead,
    required this.category,
    required this.metadata,
  });

  factory Alert.fromJson(Map<String, dynamic> json) {
    return Alert(
      id: json['id'],
      title: json['title'],
      message: json['message'],
      timestamp: DateTime.parse(json['timestamp']),
      priority: json['priority'],
      isRead: json['isRead'] ?? false,
      category: json['category'] ?? 'general',
      metadata: json['metadata'] ?? {},
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'message': message,
      'timestamp': timestamp.toIso8601String(),
      'priority': priority,
      'isRead': isRead,
      'category': category,
      'metadata': metadata,
    };
  }

  Alert copyWith({
    String? id,
    String? title,
    String? message,
    DateTime? timestamp,
    String? priority,
    bool? isRead,
    String? category,
    Map<String, dynamic>? metadata,
  }) {
    return Alert(
      id: id ?? this.id,
      title: title ?? this.title,
      message: message ?? this.message,
      timestamp: timestamp ?? this.timestamp,
      priority: priority ?? this.priority,
      isRead: isRead ?? this.isRead,
      category: category ?? this.category,
      metadata: metadata ?? this.metadata,
    );
  }
}

class Connection {
  final String remoteIp;
  final String? remotePort;
  final String? localIp;
  final String? localPort;
  final String? protocol;

  Connection({
    required this.remoteIp,
    this.remotePort,
    this.localIp,
    this.localPort,
    this.protocol,
  });

  factory Connection.fromJson(Map<String, dynamic> json) {
    return Connection(
      remoteIp: json['remote_ip'] ?? '',
      remotePort: json['remote_port'],
      localIp: json['local_ip'],
      localPort: json['local_port'],
      protocol: json['protocol'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'remote_ip': remoteIp,
      'remote_port': remotePort,
      'local_ip': localIp,
      'local_port': localPort,
      'protocol': protocol,
    };
  }
} 