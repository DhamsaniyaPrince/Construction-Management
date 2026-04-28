import api from "./api";

export const invoiceService = {

  getInvoices: async (params = {}) => {

    const { data } = await api.get("/invoices", { params });

    console.log("Invoice API response:", data);

    return data.data ?? [];
  },

  createInvoice: async (invoiceData) => {

    const payload = {
      title: invoiceData.title,
      amount: Number(invoiceData.amount),
      project: invoiceData.projectId,
      description: invoiceData.description,
      billImageUrl: invoiceData.billImageUrl || invoiceData.imageUrl
    };

    console.log("🚀 Creating invoice payload:", payload);

    const { data } = await api.post("/invoices", payload);

    return data;
  },

  approveInvoice: async (id, status) => {
    console.log("🚀 Approving invoice:", id, "with status:", status);
    const { data } = await api.put(`/invoices/${id}/approve`, { status });
    return data;
  },

  updateInvoice: async (id, data) => {
    const response = await api.put(`/invoices/${id}`, data);
    return response.data;
  }

};
