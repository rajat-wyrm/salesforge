const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { recordActivity } = require("../services/leadActivityService");
const slugify = require("../utils/slugify");

// Lightweight CSV parser that handles quoted fields, escaped quotes, and embedded newlines.
const parseCSV = (text) => {
  const rows = [];
  let cur = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cur.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      cur.push(field);
      rows.push(cur);
      cur = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field.length || cur.length) {
    cur.push(field);
    rows.push(cur);
  }
  return rows.filter((row) => row.some((c) => c && c.trim() !== ""));
};

const toCSV = (rows) =>
  rows
    .map((row) =>
      row
        .map((cell) => {
          if (cell === null || cell === undefined) return "";
          const str = String(cell);
          if (/[",\n\r]/.test(str)) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(","),
    )
    .join("\n");

const importLeads = asyncHandler(async (req, res) => {
  if (!req.body?.csv) throw new AppError("CSV content is required in the 'csv' field.", 400);
  const rows = parseCSV(req.body.csv);
  if (rows.length < 2) throw new AppError("CSV must include a header row and at least one data row.", 400);
  const [header, ...body] = rows;
  const normalized = header.map((h) => slugify(h).replace(/-/g, "_"));
  const required = ["name", "email"];
  for (const col of required) {
    if (!normalized.includes(col)) throw new AppError(`CSV is missing required column: ${col}`, 400);
  }
  const results = { created: 0, updated: 0, failed: 0, errors: [] };
  for (let i = 0; i < body.length; i += 1) {
    const row = body[i];
    if (!row || row.every((c) => !c || !c.trim())) continue;
    const data = {};
    normalized.forEach((col, idx) => {
      data[col] = row[idx]?.trim() || null;
    });
    if (!data.name || !data.email) {
      results.failed += 1;
      results.errors.push({ row: i + 2, error: "Missing name or email" });
      continue;
    }
    try {
      const existing = await prisma.lead.findUnique({ where: { email: data.email.toLowerCase() } });
      if (existing) {
        await prisma.lead.update({
          where: { id: existing.id },
          data: {
            name: data.name,
            phone: data.phone || existing.phone,
            domain: data.domain || existing.domain,
            companyName: data.company_name || existing.companyName,
            jobTitle: data.job_title || existing.jobTitle,
            status: data.status || existing.status,
            source: "import",
            orgId: existing.orgId || req.orgId,
          },
        });
        results.updated += 1;
      } else {
        const lead = await prisma.lead.create({
          data: {
            name: data.name,
            email: data.email.toLowerCase(),
            phone: data.phone || null,
            domain: data.domain || null,
            companyName: data.company_name || null,
            jobTitle: data.job_title || null,
            status: data.status || "new",
            source: "import",
            orgId: req.orgId,
            addedById: req.user.id,
          },
        });
        await recordActivity({
          leadId: lead.id,
          userId: req.user.id,
          orgId: req.orgId,
          type: "CREATED",
          title: `${req.user.name} imported this lead from CSV`,
        });
        results.created += 1;
      }
    } catch (error) {
      results.failed += 1;
      results.errors.push({ row: i + 2, error: error.message });
    }
  }
  return response.success(res, results);
});

const exportLeads = asyncHandler(async (req, res) => {
  const { status, source } = req.query;
  const where = { orgId: req.orgId };
  if (status) where.status = status;
  if (source) where.source = source;
  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { addedBy: { select: { name: true, email: true } } },
  });
  const rows = [
    ["name", "email", "phone", "domain", "company", "job_title", "status", "source", "score", "owner", "created_at"],
    ...leads.map((l) => [
      l.name,
      l.email,
      l.phone || "",
      l.domain || "",
      l.companyName || "",
      l.jobTitle || "",
      l.status,
      l.source,
      l.score,
      l.addedBy?.name || "",
      l.createdAt.toISOString(),
    ]),
  ];
  const csv = toCSV(rows);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="leads-${Date.now()}.csv"`);
  res.send(csv);
});

module.exports = { importLeads, exportLeads, parseCSV, toCSV };
