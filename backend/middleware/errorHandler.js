class AppError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  // Translate Prisma's machine-oriented errors into stable API responses the frontend can handle cleanly.
  if (err.code === "P2002") {
    res.status(409).json({
      success: false,
      message: "A record with the same unique value already exists.",
      fields: err.meta?.target || [],
    });
    return;
  }

  if (err.code === "P2025") {
    res.status(404).json({
      success: false,
      message: "The requested record could not be found.",
    });
    return;
  }

  if (process.env.NODE_ENV !== "test") {
    console.error("[api:error]", err);
  }

  res.status(statusCode).json({
    success: false,
    // Hide raw server errors from clients while still surfacing intentional AppError messages for 4xx cases.
    message:
      statusCode >= 500
        ? "Internal server error."
        : err.message || "Request failed.",
    details:
      process.env.NODE_ENV === "development" && err.details
        ? err.details
        : undefined,
  });
};

module.exports = {
  AppError,
  errorHandler,
  notFound,
};
