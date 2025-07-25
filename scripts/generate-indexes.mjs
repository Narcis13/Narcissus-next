// scripts/generate-indexes.mjs
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

// Using posix paths for import statements ensures it works across OS (Windows/Mac/Linux)
const { posix } = path;

const projectRoot = process.cwd();
// Adjusted path for your `src` directory structure
const enginePath = posix.join(projectRoot, 'src', 'lib', 'flow-engine');

async function generateIndex(directory, pattern, variableName, fileExtension) {
    const dirPath = posix.join(enginePath, directory);
    const indexPath = posix.join(dirPath, `index.${fileExtension}`);

    const files = await glob(pattern, { cwd: dirPath, posix: true });

    let importStatements = `// This file is auto-generated by scripts/generate-indexes.mjs. Do not edit.\n\n`;
    let exportArray = `\nconst ${variableName} = [\n`;

    files.forEach((file, index) => {
        const importName = `${directory.slice(0, -1)}${index}`; // e.g., node0, automation1
        const importPath = `./${file}`;
        importStatements += `import ${importName} from '${importPath}';\n`;
        exportArray += `    ${importName},\n`;
    });

    exportArray += '];\n\n';
    const exportStatement = `export default ${variableName};\n`;

    const content = `${importStatements}${exportArray}${exportStatement}`;

    await fs.writeFile(indexPath, content, 'utf8');
    console.log(`✅ Generated index for ${directory} at ${indexPath}`);
}

async function main() {
    console.log('Generating static indexes for flow engine...');
    await generateIndex('nodes', '**/*.node.js', 'allNodes', 'js');
    await generateIndex('automations', '**/*.trigger.js', 'allTriggers', 'js');
    console.log('Done.');
}

main().catch(console.error);