const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const ts = require('typescript');

function scriptComments(source, file) {
  const kind = /\.(?:tsx|jsx)$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, kind);
  const offsets = new Set();
  const regex = [];
  const jsxText = [];
  const visit = (node) => {
    if (ts.isRegularExpressionLiteral(node)) regex.push([node.getStart(tree), node.end]);
    if (ts.isJsxText(node)) jsxText.push([node.pos, node.end]);
    for (const range of ts.getLeadingCommentRanges(source, node.pos) ?? []) offsets.add(range.pos);
    for (const range of ts.getTrailingCommentRanges(source, node.end) ?? []) offsets.add(range.pos);
    ts.forEachChild(node, visit);
  };
  visit(tree);
  for (const pos of offsets) if (jsxText.some(([start, end]) => pos >= start && pos < end)) offsets.delete(pos);
  const masked = source.split('');
  for (const [start, end] of jsxText) for (let i = start; i < end; i++) if (masked[i] !== '\n') masked[i] = ' ';
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, kind, masked.join(''));
  for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan()) {
    if (token !== ts.SyntaxKind.SingleLineCommentTrivia && token !== ts.SyntaxKind.MultiLineCommentTrivia) continue;
    const pos = scanner.getTokenPos();
    if (!regex.some(([start, end]) => pos >= start && pos < end)) offsets.add(pos);
  }
  return [...offsets];
}

function cssComments(source) {
  const offsets = [];
  let quote = '';
  for (let i = 0; i < source.length; i++) {
    if (quote) {
      if (source[i] === '\\') i++;
      else if (source[i] === quote) quote = '';
    } else if (source[i] === '"' || source[i] === "'") {
      quote = source[i];
    } else if (source.slice(i, i + 2) === '/*') {
      offsets.push(i);
      i = source.indexOf('*/', i + 2);
      if (i < 0) break;
      i++;
    }
  }
  return offsets;
}

const files = execFileSync('git', ['ls-files', '-z']).toString().split('\0').filter(Boolean);
const failures = [];

for (const file of files) {
  if (file !== '.githooks/pre-push' && !/\.(?:ts|tsx|js|jsx|mjs|cjs|css|html|ya?ml|sh|py)$/.test(file)) continue;
  if (!fs.existsSync(file)) continue;
  const source = fs.readFileSync(file, 'utf8');
  const offsets = [];
  if (file.endsWith('.css')) {
    offsets.push(...cssComments(source));
  } else if (/\.(?:yaml|yml)$/.test(file)) {
    let scalarIndent = null;
    for (const match of source.matchAll(/^[^\n]*$/gm)) {
      const indent = match[0].match(/^\s*/)[0].length;
      if (scalarIndent !== null && (match[0].trim() === '' || indent > scalarIndent)) continue;
      scalarIndent = null;
      let quote = '';
      for (let i = 0; i < match[0].length; i++) {
        const c = match[0][i];
        if (quote) {
          if (c === quote) quote = '';
        } else if (c === '"' || c === "'") {
          quote = c;
        } else if (c === '#' && (i === 0 || /\s/.test(match[0][i - 1]))) {
          offsets.push(match.index + i);
          break;
        }
      }
      if (/(?:[:]|^\s*-)\s*[|>][+-]?\s*(?:#.*)?$/.test(match[0])) scalarIndent = indent;
    }
  } else if (file.endsWith('.html')) {
    const parsed = JSON.parse(execFileSync('python3', ['scripts/html-regions.py', file]));
    offsets.push(...parsed.comments);
    for (const script of parsed.scripts) offsets.push(...scriptComments(script.source, file).map((pos) => script.offset + pos));
    for (const style of parsed.styles) offsets.push(...cssComments(style.source).map((pos) => style.offset + pos));
  } else if (file.endsWith('.py')) {
    const code = "import io,json,sys,tokenize\ns=sys.stdin.read()\nprint(json.dumps([t.start[0] for t in tokenize.generate_tokens(io.StringIO(s).readline) if t.type==tokenize.COMMENT and not (t.start[0]==1 and t.string.startswith('#!'))]))";
    const lines = JSON.parse(execFileSync('python3', ['-c', code], { input: source }));
    for (const line of lines) offsets.push(source.split('\n').slice(0, line - 1).reduce((n, part) => n + part.length + 1, 0));
  } else if (file.endsWith('.sh') || file === '.githooks/pre-push') {
    for (const match of source.matchAll(/^[^\n]*$/gm)) {
      let quote = '';
      for (let i = 0; i < match[0].length; i++) {
        const char = match[0][i];
        if (quote) {
          if (char === quote) quote = '';
        } else if (char === '"' || char === "'") {
          quote = char;
        } else if (char === '#' && (i === 0 || /\s/.test(match[0][i - 1]))) {
          if (!(match.index === 0 && i === 0 && source.startsWith('#!'))) offsets.push(match.index + i);
          break;
        }
      }
    }
  } else {
    offsets.push(...scriptComments(source, file));
  }
  for (const offset of offsets) {
    const line = source.slice(0, offset).split('\n').length;
    failures.push(`${file}:${line}`);
  }
}

if (failures.length) {
  console.error(`Comments are forbidden (baseline: 0):\n${[...new Set(failures)].join('\n')}`);
  process.exitCode = 1;
} else {
  console.log('Comment lint passed (baseline: 0).');
}
