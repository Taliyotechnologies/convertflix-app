const mongoose = require('mongoose');

const FileRecordSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    type: { type: String, enum: ['image', 'video', 'audio', 'pdf', 'document'], required: true },
    size: { type: Number, required: true },
    status: { type: String, enum: ['completed', 'processing', 'failed'], required: true, index: true },
    uploadedBy: { type: String, default: 'anonymous', index: true },
    uploadedAt: { type: Date, required: true, index: true },
    convertedAt: { type: Date },
    originalFormat: { type: String, required: true },
    convertedFormat: { type: String },
    compressionRatio: { type: Number }, // 0..1 (outputSize / inputSize)
  },
  { collection: 'file_records' }
);

module.exports = mongoose.models.FileRecord || mongoose.model('FileRecord', FileRecordSchema);
