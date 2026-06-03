import PDFDocument from 'pdfkit';
import { TestResult } from '../models/TestResult.js';

export async function listTests(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const items = await TestResult.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
}

export async function stats(req, res, next) {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const pipeline = [
      { $match: { userId: req.user._id, createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ];
    const byDay = await TestResult.aggregate(pipeline);
    const byModule = await TestResult.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: '$module', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ byDay, byModule });
  } catch (e) {
    next(e);
  }
}

export async function exportJson(req, res, next) {
  try {
    const items = await TestResult.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(500).lean();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="testro-export.json"');
    res.send(JSON.stringify({ exportedAt: new Date().toISOString(), items }, null, 2));
  } catch (e) {
    next(e);
  }
}

export async function exportPdf(req, res, next) {
  try {
    const items = await TestResult.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(80).lean();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="testro-report.pdf"');

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);
    doc.fontSize(18).text('tEStro — Authorized testing report', { underline: true });
    doc.moveDown();
    doc.fontSize(10).text('Use only on authorized systems. Educational simulation output.', { align: 'left' });
    doc.moveDown();
    doc.fontSize(11).text(`User: ${req.user.email} |  Role: ${req.user.role}`);
    doc.text(`Generated: ${new Date().toISOString()}`);
    doc.moveDown();

    items.forEach((row, idx) => {
      if (idx > 0) doc.moveDown(0.5);
      doc.fontSize(10).text(`${idx + 1}. [${row.module}] ${row.testType} — ${row.riskLevel}`, {
        continued: false,
      });
      doc.fontSize(9).fillColor('#444').text(`   ${String(row.createdAt)}`);
      doc.fillColor('#000');
    });

    doc.end();
  } catch (e) {
    next(e);
  }
}
