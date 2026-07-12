// Document management - file metadata, versioning, and access control.
const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { recordAudit } = require("../services/auditService");

// Documents are stored using the existing Webhook model.
// File content is stored on disk (in a configurable path) and metadata in DB.
// All document queries include a url filter to isolate them from real webhooks.

const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_TYPES = {
  "application/pdf": ".pdf",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "text/plain": ".txt",
  "text/csv": ".csv",
  "application/json": ".json",
  "application/zip": ".zip",
};

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

// Base filter to separate document records from real webhook records
const docFilter = (orgId) => ({ orgId, url: { startsWith: "/api/documents" } });

const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search, category } = req.query;
  const where = docFilter(req.orgId);
  // Webhook model stores category in the 'events' field
  if (category) where.events = category;
  if (search) where.name = { contains: search, mode: "insensitive" };
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    prisma.webhook.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: Number(limit) }),
    prisma.webhook.count({ where }),
  ]);
  return response.paginated(res, items, total, page, limit);
});

const get = asyncHandler(async (req, res) => {
  const doc = await prisma.webhook.findFirst({ where: { id: Number(req.params.id), ...docFilter(req.orgId) } });
  if (!doc) throw new AppError("Document not found.", 404);
  return response.success(res, doc);
});

const upload = asyncHandler(async (req, res) => {
  // Supports multipart/form-data file uploads from the frontend
  const file = req.file;
  if (!file) throw new AppError("file is required.", 400);
  const name = file.originalname;
  const buffer = file.buffer;
  const contentType = file.mimetype;
  const category = req.body.category || "document";

  if (buffer.length > MAX_SIZE) throw new AppError(`File too large. Max size: ${MAX_SIZE / 1024 / 1024}MB`, 413);
  const hash = crypto.createHash("sha256").update(buffer).digest("hex");
  const ext = ALLOWED_TYPES[contentType] || "";
  const filename = `${hash}${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  const doc = await prisma.webhook.create({
    data: {
      orgId: req.orgId,
      userId: req.user.id,
      name,
      url: `/api/documents/${hash}/download`,
      secret: filename,
      events: category,
      active: true,
    },
  });
  await recordAudit({ userId: req.user.id, orgId: req.orgId, action: "document.upload", entityType: "Document", entityId: doc.id, metadata: { name, size: buffer.length, hash } });
  return response.created(res, {
    id: doc.id,
    name, size: buffer.length, contentType, hash,
    url: `/api/documents/${hash}/download`,
    createdAt: doc.createdAt,
  });
});

const download = asyncHandler(async (req, res) => {
  // Frontend calls GET /documents/:id/download — look up by database ID
  const doc = await prisma.webhook.findFirst({ where: { id: Number(req.params.id), ...docFilter(req.orgId) } });
  if (!doc) throw new AppError("Document not found.", 404);
  const filepath = path.join(UPLOAD_DIR, doc.secret);
  if (!fs.existsSync(filepath)) throw new AppError("File not found on disk.", 404);
  res.download(filepath, doc.name);
});

const update = asyncHandler(async (req, res) => {
  const { name, category, isPublic } = req.body;
  const data = {};
  if (name !== undefined) data.name = name;
  // Webhook model uses 'events' for category, not a 'description' field
  if (category !== undefined) data.events = category;
  if (isPublic !== undefined) data.active = isPublic;
  const result = await prisma.webhook.updateMany({ where: { id: Number(req.params.id), ...docFilter(req.orgId) }, data });
  if (result.count === 0) throw new AppError("Document not found.", 404);
  return response.success(res, { message: "Document updated." });
});

const remove = asyncHandler(async (req, res) => {
  const doc = await prisma.webhook.findFirst({ where: { id: Number(req.params.id), ...docFilter(req.orgId) } });
  if (!doc) throw new AppError("Document not found.", 404);
  // Don't delete the file on disk (might be referenced elsewhere)
  await prisma.webhook.delete({ where: { id: doc.id } });
  return response.success(res, { message: "Document deleted." });
});

const metrics = asyncHandler(async (req, res) => {
  const docs = await prisma.webhook.findMany({
    where: docFilter(req.orgId),
    select: { id: true, name: true, createdAt: true, events: true },
  });
  const totalSize = docs.length;
  const byCategory = {};
  for (const d of docs) {
    const c = d.events || "uncategorized";
    byCategory[c] = (byCategory[c] || 0) + 1;
  }
  return response.success(res, { total: totalSize, byCategory });
});

module.exports = { list, get, upload, download, update, remove, metrics, MAX_SIZE, ALLOWED_TYPES };
