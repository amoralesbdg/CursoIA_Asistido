const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Mini Jira API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: '/openapi.yaml',
          dom_id: '#swagger-ui',
        });
      };
    </script>
  </body>
</html>`;

export function GET() {
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
