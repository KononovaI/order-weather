/**
 * ErrorAlert Component
 * Provides a standardized way to display errors to the user.
 */
import { ERROR_MESSAGES } from '../constants/errorMessages';

function ErrorAlert({ type, message, onDismiss }) {
  // If no message is provided, try to get the default for the type
  const errorType = type || 'api';
  const info = ERROR_MESSAGES[errorType] || { title: 'Error', message: 'An unexpected error occurred.', icon: '❌' };
  
  const displayMessage = message || info.message;

  return (
    <div className="error-alert" role="alert">
      <div className="error-alert-icon">{info.icon}</div>
      <div className="error-alert-content">
        <strong>{info.title}</strong>
        <p>{displayMessage}</p>
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
