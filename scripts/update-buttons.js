const fs = require('fs');
const path = require('path');

const srcDir = 'd:/OJT files/clerk-auth-app/src';
const pagesDir = path.join(srcDir, 'pages');
const compDir = path.join(srcDir, 'components');
const filesToProcess = [];

function walk(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            filesToProcess.push(fullPath);
        }
    });
}

walk(pagesDir);
walk(compDir);

filesToProcess.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Remove old button styles to force usage of our variants
    // 1. Convert <button> to <Button>.
    content = content.replace(/<button([^>]*)>/g, '<Button$1>');
    content = content.replace(/<\/button>/g, '</Button>');

    // Make sure Button is imported
    if (!content.includes('import { Button } ') && !content.includes('import { Button }')) {
        // Skip some system components if they don't use Button
        if (content.includes('<Button')) {
            content = "import { Button } from \"@/components/ui/button\"\n" + content;
        }
    }

    // Replace specific button stylings with variants.
    // Replace indigo primary buttons
    content = content.replace(/className=(["'])[^"']*bg-indigo-600[^"']*["']/g, 'variant="default"');
    
    // Replace slate outline tracking buttons (Export CSV, Filter)
    content = content.replace(/className=(["'])[^"']*border-slate-200[^"']*bg-white[^"']*["']/g, 'variant="outlineNeutral"');
    
    // Replace generic <Button variant="outline" ... className="... border-slate-200">
    content = content.replace(/variant="outline"\s+className=(["'])[^"']*border-slate-200[^"']*["']/g, 'variant="outlineNeutral"');
    content = content.replace(/variant='outline'\s+className=(["'])[^"']*border-slate-200[^"']*["']/g, 'variant="outlineNeutral"');

    // Remove any straggler 'variant="outline"' next to 'variant="outlineNeutral"'
    content = content.replace(/variant="outline"\s+variant="outlineNeutral"/g, 'variant="outlineNeutral"');
    content = content.replace(/variant="outlineNeutral"\s+variant="outline"/g, 'variant="outlineNeutral"');

    // Remove sizes from buttons - size is handled by variants, drop unneeded classes if we replaced them.
    // For specific things like "h-9 w-9 p-0" -> "icon"
    content = content.replace(/className=(["'])[^"']*\bh-9\s+w-9\s+p-0[^"']*["']/g, 'size="icon"');

    // In Contacts and other files, Button might be imported twice if we blindly prepended.
    // Let's deduplicate imports.
    const importRegex = /^import\s+\{\s*Button\s*\}\s+from\s+["']@\/components\/ui\/button["'];?\s*$/gm;
    let match;
    let importCount = 0;
    while ((match = importRegex.exec(content)) !== null) {
        importCount++;
    }
    if (importCount > 1) {
        // Keep the first one, remove the others
        let foundFirst = false;
        content = content.replace(importRegex, (m) => {
            if (!foundFirst) {
                foundFirst = true;
                return m;
            }
            return '';
        });
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated: ' + filePath);
    }
});
