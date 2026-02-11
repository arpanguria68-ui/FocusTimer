const fs = require('fs');
const path = require('path');

// Get the dist directory path
const distDir = path.resolve(__dirname, '../dist');

// Read the main index.html to extract asset references
const indexHtmlPath = path.join(distDir, 'index.html');

try {
  if (!fs.existsSync(indexHtmlPath)) {
    console.warn('⚠️ Warning: dist/index.html not found. Skipping asset fix. Make sure to run "vite build" first.');
    process.exit(0);
  }

  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');

  // Extract script and link tags from index.html and fix paths
  const scriptMatches = indexHtml.match(/<script[^>]*src="[^"]*"[^>]*><\/script>/g) || [];
  const linkMatches = indexHtml.match(/<link[^>]*href="[^"]*"[^>]*>/g) || [];

  // Fix absolute paths to relative paths for Chrome extension
  const fixedScripts = scriptMatches.map(script => script.replace(/src="\/assets\//g, 'src="./assets/'));
  const fixedLinks = linkMatches.map(link => link.replace(/href="\/assets\//g, 'href="./assets/'));

  // Create the asset references HTML
  const assetReferences = [...fixedScripts, ...fixedLinks].join('\n    ');

  // Template for the HTML files
  const createHtmlTemplate = (title, route) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    ${assetReferences}
</head>
<body>
    <div id="root" data-route="${route}"></div>
</body>
</html>`;

  // Update dashboard.html
  const dashboardHtmlPath = path.join(distDir, 'dashboard.html');
  const dashboardHtml = createHtmlTemplate('Focus Timer - Dashboard', 'dashboard');
  fs.writeFileSync(dashboardHtmlPath, dashboardHtml);

  // Update fullapp.html
  const fullappHtmlPath = path.join(distDir, 'fullapp.html');
  const fullappHtml = createHtmlTemplate('Focus Timer - Full App', 'fullapp');
  fs.writeFileSync(fullappHtmlPath, fullappHtml);

  // Update smile-popup.html
  const smilePopupHtmlPath = path.join(distDir, 'smile-popup.html');
  const smilePopupHtml = createHtmlTemplate('Focus Timer - Celebration!', 'smile-popup');
  fs.writeFileSync(smilePopupHtmlPath, smilePopupHtml);

  console.log('✅ Extension HTML files updated with correct asset references');
  console.log('📁 Updated files:');
  console.log('  - dashboard.html');
  console.log('  - fullapp.html');
  console.log('  - smile-popup.html');

} catch (error) {
  console.error('❌ Error fixing extension assets:', error);
  process.exit(1);
}
