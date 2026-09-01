const TOKEN_RE =
  /(\/\/.*$)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|\b(const|export|true|false|return|default|interface|type|import|from)\b|(\b\d+(?:\.\d+)?\+?\b)|([{}[\]():,;.])/gm;

export function highlight(line: string, key: string | number) {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(line))) {
    if (m.index > lastIndex) {
      nodes.push(<span key={`${key}-${i++}`}>{line.slice(lastIndex, m.index)}</span>);
    }
    const [full, comment, str, kw, num, punc] = m;
    let cls = 'tok-plain';
    if (comment) cls = 'tok-comment';
    else if (str) cls = 'tok-str';
    else if (kw) cls = 'tok-kw';
    else if (num) cls = 'tok-num';
    else if (punc) cls = 'tok-punc';
    nodes.push(<span key={`${key}-${i++}`} className={cls}>{full}</span>);
    lastIndex = m.index + full.length;
  }
  if (lastIndex < line.length) {
    nodes.push(<span key={`${key}-${i++}`}>{line.slice(lastIndex)}</span>);
  }
  return nodes;
}

export function propToken(text: string, key: string | number) {
  return <span key={key} className="tok-prop">{text}</span>;
}
