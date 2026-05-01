// Soft delete helper that updates a `deletedAt` column if present.
const softDelete = (model, id) => {
  if (!model) throw new Error("Model is required");
  if (model.fields?.deletedAt) {
    return model.update({ where: { id }, data: { deletedAt: new Date() } });
  }
  return model.delete({ where: { id } });
};

module.exports = { softDelete };
