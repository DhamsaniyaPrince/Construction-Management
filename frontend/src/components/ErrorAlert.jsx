const ErrorAlert = ({ message, onClose }) => (
  <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 flex items-center justify-between">
    <p className="text-sm text-red-800">{message}</p>
    {onClose && (
      <button
        onClick={onClose}
        className="text-red-600 hover:text-red-800 ml-4"
        aria-label="Close"
      >
        ×
      </button>
    )}
  </div>
);

export default ErrorAlert;



