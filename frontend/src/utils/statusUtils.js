// Material Request Status Utilities
export const MATERIAL_STATUS = {
  PENDING_ENGINEER_APPROVAL: 'PENDING ENGINEER APPROVAL',
  PENDING_CONTRACTOR_APPROVAL: 'PENDING CONTRACTOR APPROVAL',
  ENGINEER_APPROVED: 'ENGINEER APPROVED',
  ENGINEER_REJECTED: 'ENGINEER REJECTED',
  CONTRACTOR_APPROVED: 'CONTRACTOR APPROVED',
  CONTRACTOR_REJECTED: 'CONTRACTOR REJECTED',
  PURCHASED: 'PURCHASED',
  DELIVERED: 'DELIVERED'
};

export const getStatusDisplay = (status) => {
  return MATERIAL_STATUS[status] || status?.replace(/_/g, ' ') || status;
};

export const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'ENGINEER_APPROVED':
    case 'CONTRACTOR_APPROVED':
      return 'bg-green-100 text-green-800';
    case 'ENGINEER_REJECTED':
    case 'CONTRACTOR_REJECTED':
      return 'bg-red-100 text-red-800';
    case 'DELIVERED':
      return 'bg-blue-100 text-blue-800';
    case 'PURCHASED':
      return 'bg-purple-100 text-purple-800';
    case 'PENDING_CONTRACTOR_APPROVAL':
      return 'bg-orange-100 text-orange-800';
    case 'PENDING_ENGINEER_APPROVAL':
    default:
      return 'bg-yellow-100 text-yellow-800';
  }
};

export const canEngineerReview = (status) => {
  return status === 'PENDING_ENGINEER_APPROVAL';
};

export const canContractorReview = (status) => {
  return status === 'ENGINEER_APPROVED';
};

export const canContractorUpdateStatus = (status) => {
  return status === 'CONTRACTOR_APPROVED';
};
