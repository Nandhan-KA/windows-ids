enum SystemActionType {
  sleep,
  hibernate,
  shutdown,
  restart,
  lockScreen,
  blockTraffic,
  resumeTraffic,
  disableNetwork,
  enableNetwork,
}

class SystemAction {
  final String id;
  final String action;
  final DateTime timestamp;
  final String status;
  final String? result;
  final int? delaySeconds;
  final bool force;
  
  SystemAction({
    required this.id,
    required this.action,
    required this.timestamp,
    required this.status,
    this.result,
    this.delaySeconds = 0,
    this.force = false,
  });
  
  factory SystemAction.fromJson(Map<String, dynamic> json) {
    return SystemAction(
      id: json['id'],
      action: json['action'],
      timestamp: DateTime.parse(json['timestamp']),
      status: json['status'],
      result: json['result'],
      delaySeconds: json['delaySeconds'] ?? 0,
      force: json['force'] ?? false,
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'action': action,
      'timestamp': timestamp.toIso8601String(),
      'status': status,
      'result': result,
      'delaySeconds': delaySeconds,
      'force': force,
    };
  }

  String get displayName {
    switch (action) {
      case 'sleep':
        return 'Sleep';
      case 'hibernate':
        return 'Hibernate';
      case 'shutdown':
        return 'Shutdown';
      case 'restart':
        return 'Restart';
      case 'lockScreen':
        return 'Lock Screen';
      case 'blockTraffic':
        return 'Block Network Traffic';
      case 'resumeTraffic':
        return 'Resume Network Traffic';
      case 'disableNetwork':
        return 'Disable Network';
      case 'enableNetwork':
        return 'Enable Network';
      default:
        return 'Unknown Action';
    }
  }

  String get description {
    switch (action) {
      case 'sleep':
        return 'Put the computer to sleep mode';
      case 'hibernate':
        return 'Hibernate the computer to save power';
      case 'shutdown':
        return 'Shut down the computer';
      case 'restart':
        return 'Restart the computer';
      case 'lockScreen':
        return 'Lock the computer screen';
      case 'blockTraffic':
        return 'Block all network traffic to prevent attack spread';
      case 'resumeTraffic':
        return 'Resume normal network traffic';
      case 'disableNetwork':
        return 'Disable all network interfaces';
      case 'enableNetwork':
        return 'Enable all network interfaces';
      default:
        return 'No description available';
    }
  }

  String get actionConfirmPrompt {
    String basePrompt = 'Are you sure you want to ${displayName.toLowerCase()} the system';
    if (delaySeconds != null && delaySeconds! > 0) {
      basePrompt += ' after $delaySeconds seconds';
    }
    basePrompt += '?';
    
    if (force) {
      basePrompt += ' This will force the action even if there are unsaved changes.';
    }
    
    return basePrompt;
  }
} 