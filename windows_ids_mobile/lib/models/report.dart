class Report {
  final String id;
  final String title;
  final String description;
  final String createdAt;
  final ReportType type;
  final String fileUrl;
  final int fileSize;
  final String fileType;
  final bool isDownloaded;
  final List<String> tags;

  Report({
    required this.id,
    required this.title,
    required this.description,
    required this.createdAt,
    required this.type,
    required this.fileUrl,
    required this.fileSize,
    required this.fileType,
    this.isDownloaded = false,
    this.tags = const [],
  });

  factory Report.fromJson(Map<String, dynamic> json) {
    return Report(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      createdAt: json['createdAt'] ?? DateTime.now().toIso8601String(),
      type: ReportType.values.firstWhere(
        (e) => e.toString().split('.').last == json['type'],
        orElse: () => ReportType.security,
      ),
      fileUrl: json['fileUrl'] ?? '',
      fileSize: json['fileSize'] ?? 0,
      fileType: json['fileType'] ?? 'pdf',
      isDownloaded: json['isDownloaded'] ?? false,
      tags: json['tags'] != null ? List<String>.from(json['tags']) : const [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'createdAt': createdAt,
      'type': type.toString().split('.').last,
      'fileUrl': fileUrl,
      'fileSize': fileSize,
      'fileType': fileType,
      'isDownloaded': isDownloaded,
      'tags': tags,
    };
  }

  String get formattedFileSize {
    if (fileSize < 1024) {
      return '$fileSize B';
    } else if (fileSize < 1024 * 1024) {
      return '${(fileSize / 1024).toStringAsFixed(1)} KB';
    } else if (fileSize < 1024 * 1024 * 1024) {
      return '${(fileSize / (1024 * 1024)).toStringAsFixed(1)} MB';
    } else {
      return '${(fileSize / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
    }
  }
}

enum ReportType {
  security,
  performance,
  network,
  system,
  threats,
  custom,
} 