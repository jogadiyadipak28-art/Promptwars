const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, 'src', 'components');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    let filepath = path.join(dir, file);
    let stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      walk(filepath, callback);
    } else if (filepath.endsWith('.jsx')) {
      callback(filepath);
    }
  });
}

const replacements = [
  { from: /\btext-gray-500\b/g, to: 'text-gray-400' },
  { from: /\bplaceholder-gray-500\b/g, to: 'placeholder-gray-400' }
];

let filesModified = 0;

walk(directory, (filepath) => {
  let content = fs.readFileSync(filepath, 'utf8');
  let newContent = content;

  replacements.forEach(({ from, to }) => {
    newContent = newContent.replace(from, to);
  });

  // Fix SustainabilityPanel input manually in this script
  if (filepath.endsWith('SustainabilityPanel.jsx')) {
    newContent = newContent.replace(
      '<input\n            className="input flex-1"',
      '<input\n            aria-label="Question"\n            className="input flex-1"'
    );
  }

  if (content !== newContent) {
    fs.writeFileSync(filepath, newContent, 'utf8');
    filesModified++;
    console.log(`Updated ${path.basename(filepath)}`);
  }
});

console.log(`Done! Modified ${filesModified} files.`);
