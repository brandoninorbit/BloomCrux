/**
 * Server-safe Not Found page.
 * No Firebase imports, no client-only code.
 */
export default function NotFound() {
  return (
    <div style={{padding: 24}}>
      <h1 style={{fontSize: 24, fontWeight: 700}}>Page not found</h1>
      <p>Sorry, we couldnt find that page.</p>
    </div>
  );
}
