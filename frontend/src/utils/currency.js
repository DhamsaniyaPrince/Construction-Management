// Indian Rupee formatting utility
export const formatINR = (amount) => {
  if (!amount || amount === 0) return '₹0';
  
  // Convert to number if it's a string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return '₹0';
  
  // Format using Indian numbering system
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return formatter.format(numAmount);
};

// Simple INR formatting for when Intl is not available or for custom formatting
export const formatINRSimple = (amount) => {
  if (!amount || amount === 0) return '₹0';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return '₹0';
  
  // Convert to string and add commas
  let amountStr = numAmount.toString();
  let afterPoint = '';
  
  // Handle decimal part
  if (amountStr.includes('.')) {
    afterPoint = amountStr.substring(amountStr.indexOf('.'));
    amountStr = amountStr.substring(0, amountStr.indexOf('.'));
  }
  
  // Add commas according to Indian numbering system
  let lastThree = amountStr.substring(amountStr.length - 3);
  let otherNumbers = amountStr.substring(0, amountStr.length - 3);
  
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  
  let result = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  
  return '₹' + result + afterPoint;
};

export default formatINR;
