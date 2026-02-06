/**
 * ErrorAlert Component
 * Provides a standardized way to display errors to the user.
 */

const ERROR_DETAILS = {
  network: { title: 'Connection Error', icon: '🌐' },
  api: { title: 'Service Error', icon: '⚠️' },
  validation: { title: 'Invalid Input', icon: '❌' },
  rate_limit: { title: 'Too Many Requests', icon: '⏳' },
  geolocation: { title: 'Location Error', icon: '📍' },
};

function ErrorAlert({ type, message, onDismiss }) {
  if (!message) return null;

  const details = ERROR_DETAILS[type] || { title: 'Error', icon: '❌' };

  return (
    <div className="error-alert" role="alert">
      <div className="error-alert-icon">{details.icon}</div>
      <div className="error-alert-content">
        <strong>{details.title}</strong>
        <p>{message}</p>
      </div>
      {onDismiss && (
        <button className="error-alert-close" onClick={onDismiss} aria-label="Dismiss">
          ✕
        </button>
      )}
    </div>
  );
}

export default ErrorAlert;
