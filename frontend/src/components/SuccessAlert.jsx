const SuccessAlert = ({ message, onClose }) => (
  <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-4 flex items-center justify-between">
    <p className="text-sm text-green-800">{message}</p>
    {onClose && (
      <button
        onClick={onClose}
        className="text-green-600 hover:text-green-800 ml-4"
        aria-label="Close"
      >
        ×
      </button>
    )}
  </div>
);

export default SuccessAlert;



