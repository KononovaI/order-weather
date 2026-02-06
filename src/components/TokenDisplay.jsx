/**
 * TokenDisplay Component
 * Shows the user's current token balance.
 */

function TokenDisplay({ tokens }) {
  return (
    <div className="tokens-display">
      <h3>Current balance (tokens): {tokens}</h3>
    </div>
  );
}

export default TokenDisplay;
