import mongoose from 'mongoose';

const testResultSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    module: { type: String, required: true, index: true },
    testType: { type: String, required: true },
    inputSummary: { type: String, default: '' },
    result: { type: mongoose.Schema.Types.Mixed, required: true },
    riskLevel: { type: String, enum: ['info', 'low', 'medium', 'high', 'critical'], default: 'info' },
    premiumInsights: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

export const TestResult = mongoose.model('TestResult', testResultSchema, 'tests');
