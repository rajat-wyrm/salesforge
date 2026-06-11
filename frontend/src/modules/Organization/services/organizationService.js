import { api } from "@/lib/api";

const mapToFrontendFormat = (org) => ({
  id: org.id,
  _id: org.id,
  name: org.name,
  website: org.website || "",
  region: org.region || "Global",
  type: org.type || "Startup",
  contactName: org.contactName || "",
  created: org.createdAt,
  createdAt: org.createdAt,
});

const mapToBackendFormat = (formData) => ({
  name: formData.name,
  website: formData.website,
  region: formData.region,
  type: formData.type,
  contactName: formData.contactName,
});

const unwrap = (resp) => {
  const body = resp.data;
  if (body && typeof body === "object" && "success" in body) {
    if (!body.success) throw new Error(body.message || "Request failed");
    return body.data;
  }
  return body;
};

const OrganizationService = {
  getOrganizations: async (params = {}) => {
    try {
      const data = unwrap(await api.get("/organizations", { params }));
      return (Array.isArray(data) ? data : data?.items || []).map(mapToFrontendFormat);
    } catch (error) {
      console.error("API Error: Failed to fetch organizations.", error);
      throw error;
    }
  },

  getOrganizationDetails: async (id) => {
    try {
      const data = unwrap(await api.get(`/organizations/${id}`));
      return mapToFrontendFormat(data);
    } catch (error) {
      console.error(`API Error: Failed to fetch details for organization ${id}.`, error);
      throw error;
    }
  },

  createOrganization: async (orgData) => {
    try {
      const data = unwrap(await api.post("/organizations", mapToBackendFormat(orgData)));
      return mapToFrontendFormat(data);
    } catch (error) {
      console.error("API Error: Failed to create organization.", error);
      throw error;
    }
  },

  updateOrganization: async (id, orgData) => {
    try {
      const data = unwrap(await api.patch(`/organizations/${id}`, mapToBackendFormat(orgData)));
      return mapToFrontendFormat(data);
    } catch (error) {
      console.error(`API Error: Failed to update organization ${id}.`, error);
      throw error;
    }
  },

  deleteOrganization: async (id) => {
    try {
      await api.delete(`/organizations/${id}`);
      return true;
    } catch (error) {
      console.error(`API Error: Failed to delete organization ${id}.`, error);
      throw error;
    }
  },
};

export default OrganizationService;
