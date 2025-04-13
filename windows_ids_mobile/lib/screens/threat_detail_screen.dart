import 'package:flutter/material.dart';
import '../models/threat.dart';
import '../services/ids_service.dart';

class ThreatDetailScreen extends StatefulWidget {
  final Threat threat;

  const ThreatDetailScreen({super.key, required this.threat});

  @override
  State<ThreatDetailScreen> createState() => _ThreatDetailScreenState();
}

class _ThreatDetailScreenState extends State<ThreatDetailScreen> {
  final IDSService _idsService = IDSService();
  bool _isBlocking = false;
  String? _blockingError;

  Color _getSeverityColor() {
    switch (widget.threat.severity) {
      case 'Critical':
        return Colors.red;
      case 'High':
        return Colors.orange;
      case 'Medium':
        return Colors.amber;
      case 'Low':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  IconData _getThreatTypeIcon() {
    switch (widget.threat.type.toLowerCase()) {
      case 'malware':
        return Icons.bug_report;
      case 'brute force':
        return Icons.password;
      case 'ddos':
        return Icons.cloud_off;
      case 'phishing':
        return Icons.phishing;
      case 'ransomware':
        return Icons.lock;
      case 'sql injection':
        return Icons.data_object;
      case 'xss':
        return Icons.code;
      default:
        return Icons.security;
    }
  }

  Future<void> _blockThreat() async {
    setState(() {
      _isBlocking = true;
      _blockingError = null;
    });

    try {
      await _idsService.blockThreat(widget.threat.id);
      if (mounted) {
        setState(() {
          _isBlocking = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Threat blocked successfully')),
        );
        Navigator.pop(context, true); // Return true to indicate successful blocking
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isBlocking = false;
          _blockingError = e.toString();
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to block threat: ${e.toString()}')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Threat Details'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            const SizedBox(height: 24),
            _buildDetailSection('Description', widget.threat.description),
            _buildDetailSection('Affected Components', widget.threat.affectedSystems.join(', ')),
            _buildDetailSection('Source', widget.threat.source),
            _buildDetailSection('Timestamp', _formatTimestamp(widget.threat.timestamp)),
            _buildDetailSection('IP Address', widget.threat.ipAddress ?? 'N/A'),
            _buildDetailSection('Port', widget.threat.port?.toString() ?? 'N/A'),
            _buildDetailSection('Process', widget.threat.process ?? 'N/A'),
            _buildDetailSection('Status', widget.threat.status),
            const SizedBox(height: 24),
            _buildMitigationSection(),
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomBar(),
    );
  }

  Widget _buildHeader() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: _getSeverityColor(), width: 2),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(_getThreatTypeIcon(), color: _getSeverityColor(), size: 32),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.threat.title,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        widget.threat.type,
                        style: TextStyle(
                          color: Colors.grey[700],
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildSeverityBadge(),
                _buildRiskScoreBadge(),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSeverityBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: _getSeverityColor().withOpacity(0.2),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _getSeverityColor()),
      ),
      child: Text(
        widget.threat.severity,
        style: TextStyle(
          color: _getSeverityColor(),
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildRiskScoreBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          const Icon(Icons.analytics, size: 16),
          const SizedBox(width: 4),
          Text(
            'Risk Score: ${widget.threat.riskScore}',
            style: const TextStyle(
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailSection(String title, String content) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.grey,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            content,
            style: const TextStyle(fontSize: 16),
          ),
        ],
      ),
    );
  }

  Widget _buildMitigationSection() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Recommended Mitigation',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ...widget.threat.mitigationSteps.map((step) => _buildMitigationStep(step)),
          ],
        ),
      ),
    );
  }

  Widget _buildMitigationStep(String step) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.check_circle, color: Colors.green, size: 20),
          const SizedBox(width: 8),
          Expanded(child: Text(step)),
        ],
      ),
    );
  }

  Widget _buildBottomBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.3),
            spreadRadius: 1,
            blurRadius: 5,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: ElevatedButton(
              onPressed: widget.threat.status == 'Blocked' || _isBlocking ? null : _blockThreat,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              child: _isBlocking
                  ? const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        ),
                        SizedBox(width: 8),
                        Text('Blocking...'),
                      ],
                    )
                  : Text(widget.threat.status == 'Blocked' ? 'Blocked' : 'Block Threat'),
            ),
          ),
        ],
      ),
    );
  }

  String _formatTimestamp(DateTime timestamp) {
    return '${timestamp.day}/${timestamp.month}/${timestamp.year} ${timestamp.hour}:${timestamp.minute.toString().padLeft(2, '0')}';
  }
} 