import React, { useState, useEffect } from "react";

const OrganizationForm = ({ orgToEdit, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    website: "",
    region: "",      // Use 'region' to match backend
    type: "",        // Use 'type' to match backend
    contactName: "", // Use 'contactName' to match backend
  });

  useEffect(() => {
    if (orgToEdit) {
      setFormData({
        name: orgToEdit.name || "",
        website: orgToEdit.website || "",
        region: orgToEdit.region || "",
        type: orgToEdit.type || "",
        contactName: orgToEdit.contactName || "",
      });
    }
  }, [orgToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Organization Name</label>
        <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Website</label>
        <input type="url" name="website" value={formData.website} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Region / Location</label>
        <input type="text" name="region" value={formData.region} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Type / Industry</label>
        <input type="text" name="type" value={formData.type} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Contact Name</label>
        <input type="text" name="contactName" value={formData.contactName} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
      </div>
      <button type="submit" className="w-full bg-teal-600 text-white py-2 rounded-md hover:bg-teal-700">
        {orgToEdit ? "Update Organization" : "Create Organization"}
      </button>
    </form>
  );
};

export default OrganizationForm;