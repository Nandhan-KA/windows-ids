import 'package:flutter/material.dart';
import '../models/threat.dart';
import '../utils/app_theme.dart';
import 'package:intl/intl.dart';

class ThreatCard extends StatelessWidget {
  final Threat threat;
  final VoidCallback? onTap;

  const ThreatCard({
    super.key,
    required this.threat,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;
    
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: _getSeverityColor(isDarkMode),
          width: 1,
        ),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildThreatIcon(isDarkMode),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          threat.title,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          threat.description,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 14,
                            color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.7),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildInfoChip(
                    context, 
                    'Source: ${threat.source}',
                    Icons.public,
                    isDarkMode,
                  ),
                  _buildInfoChip(
                    context, 
                    DateFormat('MM/dd HH:mm').format(threat.timestamp),
                    Icons.access_time,
                    isDarkMode,
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildSeverityBadge(isDarkMode),
                  _buildStatusBadge(isDarkMode),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildThreatIcon(bool isDarkMode) {
    IconData iconData;
    
    switch (threat.type.toLowerCase()) {
      case 'malware':
        iconData = Icons.bug_report;
        break;
      case 'brute force':
        iconData = Icons.password;
        break;
      case 'ddos':
        iconData = Icons.cloud_off;
        break;
      case 'phishing':
        iconData = Icons.phishing;
        break;
      case 'ransomware':
        iconData = Icons.lock;
        break;
      case 'sql injection':
        iconData = Icons.data_object;
        break;
      case 'xss':
        iconData = Icons.code;
        break;
      default:
        iconData = Icons.security;
    }
    
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: _getSeverityColor(isDarkMode).withOpacity(0.1),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Icon(
        iconData,
        color: _getSeverityColor(isDarkMode),
        size: 24,
      ),
    );
  }

  Widget _buildInfoChip(BuildContext context, String label, IconData icon, bool isDarkMode) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: Theme.of(context).dividerColor,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 14,
            color: Theme.of(context).textTheme.bodySmall?.color,
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Theme.of(context).textTheme.bodySmall?.color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSeverityBadge(bool isDarkMode) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: _getSeverityColor(isDarkMode).withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: _getSeverityColor(isDarkMode),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.warning_amber,
            size: 14,
            color: _getSeverityColor(isDarkMode),
          ),
          const SizedBox(width: 4),
          Text(
            threat.severity,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: _getSeverityColor(isDarkMode),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(bool isDarkMode) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: _getStatusColor(isDarkMode).withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: _getStatusColor(isDarkMode),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            _getStatusIcon(),
            size: 14,
            color: _getStatusColor(isDarkMode),
          ),
          const SizedBox(width: 4),
          Text(
            threat.status,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: _getStatusColor(isDarkMode),
            ),
          ),
        ],
      ),
    );
  }

  Color _getSeverityColor(bool isDarkMode) {
    switch (threat.severity.toLowerCase()) {
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

  Color _getStatusColor(bool isDarkMode) {
    switch (threat.status.toLowerCase()) {
      case 'active':
        return AppTheme.activeStatusColor;
      case 'blocked':
        return AppTheme.blockedStatusColor;
      case 'investigating':
      case 'quarantined':
        return AppTheme.quarantinedStatusColor;
      case 'resolved':
        return AppTheme.resolvedStatusColor;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon() {
    switch (threat.status.toLowerCase()) {
      case 'active':
        return Icons.warning;
      case 'blocked':
        return Icons.block;
      case 'investigating':
        return Icons.search;
      case 'quarantined':
        return Icons.shield;
      case 'resolved':
        return Icons.check_circle;
      default:
        return Icons.help;
    }
  }
} 