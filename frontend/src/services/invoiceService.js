import api from './api';

const getInvoices = async () => {
  const response = await api.get('/invoices');
  return response.data;
};

const createInvoice = async (invoiceData) => {
  const response = await api.post('/invoices', invoiceData);
  return response.data;
};

const updateInvoice = async (id, data) => {
  const response = await api.put(`/invoices/${id}`, data);
  return response.data;
};

const invoiceService = {
  getInvoices,
  createInvoice,
  updateInvoice
};

export default invoiceService;
