'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/context/LanguageContext';
import { SKILLS } from '@/lib/skillsData';
import styles from './Terminal.module.css';

const CrtScene = dynamic(() => import('./CrtScene'), { ssr: false });

const COMMANDS = ['help', 'about', 'skills', 'projects', 'services', 'contact', 'whoami', 'lang', 'date', 'clear'];

type Line = { id: number; kind: 'boot' | 'cmd' | 'out' | 'err'; content: React.ReactNode };

export default function Terminal() {
  const { tr, lang, toggleLang } = useLanguage();
  const [lines, setLines] = useState<Line[]>([]);
  const [booted, setBooted] = useState(false);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // A plain counter (not mutated inside the setState updater) — React 18
  // Strict Mode invokes functional updaters twice in dev to catch impurity,
  // which turned `uid++` inside the updater into a source of duplicate keys.
  const idRef = useRef(0);

  const push = (kind: Line['kind'], content: React.ReactNode) => {
    const id = idRef.current++;
    setLines((ls) => [...ls, { id, kind, content }]);
  };

  /* ── Boot sequence ── */
  useEffect(() => {
    const boot = [
      'BIOS LM-01 v2.026 — iniciando...',
      'Verificando memória............. OK',
      'Carregando kernel................ OK',
      'Montando /home/luigi............. OK',
      'Iniciando serviços de rede........ OK',
      '',
      `luigi-mello OS [Versão 2026.09] pronto.`,
      `Digite 'help' para ver os comandos disponíveis.`,
    ];
    let cancelled = false;
    (async () => {
      for (const line of boot) {
        if (cancelled) return;
        await new Promise((r) => setTimeout(r, line ? 160 : 60));
        if (cancelled) return;
        push('boot', line);
      }
      setBooted(true);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  useEffect(() => {
    if (booted) inputRef.current?.focus();
  }, [booted]);

  /* ── Command outputs ── */
  const outputs: Record<string, () => React.ReactNode> = {
    help: () => (
      <ul className={styles.list}>
        <li><span>help</span> lista os comandos disponíveis</li>
        <li><span>about</span> quem é Luigi Mello</li>
        <li><span>skills</span> stack técnica completa</li>
        <li><span>projects</span> projetos entregues</li>
        <li><span>services</span> o que posso fazer por você</li>
        <li><span>contact</span> canais de contacto</li>
        <li><span>whoami</span> resumo de uma linha</li>
        <li><span>lang en|pt</span> troca de idioma</li>
        <li><span>date</span> data e hora atuais</li>
        <li><span>clear</span> limpa o terminal</li>
      </ul>
    ),
    about: () => (
      <div className={styles.block}>
        <p>{tr.about.p1}</p>
        <p>{tr.about.p2}</p>
        <p>{tr.about.p3}</p>
        <p>{tr.about.englishDesc}</p>
        <div className={styles.table}>
          <div><span>{tr.about.stats.technologies}</span><b>10+</b></div>
          <div><span>{tr.about.stats.projects}</span><b>10+</b></div>
          <div><span>{tr.about.stats.aiTools}</span><b>5</b></div>
        </div>
      </div>
    ),
    skills: () => (
      <div className={styles.block}>
        {SKILLS.map((group) => (
          <p key={group.cat}>
            <span className={styles.cat}>{tr.skills.categories[group.cat]}:</span>{' '}
            {group.items.join(', ')}
          </p>
        ))}
      </div>
    ),
    projects: () => (
      <div className={styles.block}>
        {tr.projects.items.map((p, i) => {
          const proj = p as typeof p & { demo?: string };
          const live = Boolean(proj.demo && proj.demo !== '#');
          return (
            <div key={p.name} className={styles.entry}>
              <p className={styles.entryTitle}>
                [{String(i + 1).padStart(2, '0')}] {p.name}
              </p>
              <p className={styles.entryDesc}>{p.description}</p>
              <p className={styles.entryMeta}>
                tags: {p.tags.join(', ')}
                {p.github !== '#' && <> · <a href={p.github} target="_blank" rel="noopener noreferrer">código</a></>}
                {live && <> · <a href={proj.demo} target="_blank" rel="noopener noreferrer">demo</a></>}
              </p>
            </div>
          );
        })}
      </div>
    ),
    services: () => (
      <div className={styles.block}>
        {tr.services.items.map((s, i) => (
          <div key={s.title} className={styles.entry}>
            <p className={styles.entryTitle}>[{String(i + 1).padStart(2, '0')}] {s.title}</p>
            <p className={styles.entryDesc}>{s.description}</p>
          </div>
        ))}
        <p className={styles.dim}>{tr.services.badge}</p>
      </div>
    ),
    contact: () => (
      <div className={styles.block}>
        <p>{tr.contact.description}</p>
        <p><span className={styles.cat}>Email:</span> <a href="mailto:luigileitenski@gmail.com">luigileitenski@gmail.com</a></p>
        <p><span className={styles.cat}>Instagram:</span> <a href="https://www.instagram.com/oluigilucio/" target="_blank" rel="noopener noreferrer">@oluigilucio</a></p>
        <p><span className={styles.cat}>YouTube:</span> <a href="https://youtube.com/@oluigimello" target="_blank" rel="noopener noreferrer">@oluigimello</a></p>
        <p><span className={styles.cat}>WhatsApp:</span> <a href="https://wa.me/5541992096564" target="_blank" rel="noopener noreferrer">(41) 99209-6564</a></p>
        <p><span className={styles.cat}>LinkedIn:</span> <a href="https://www.linkedin.com/in/luigimello/" target="_blank" rel="noopener noreferrer">luigimello</a></p>
      </div>
    ),
    whoami: () => <p>luigi-mello — {tr.hero.roles[0]}. {tr.hero.description}</p>,
    date: () => <p>{new Date().toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US')}</p>,
  };

  const run = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    push('cmd', trimmed);
    setHistory((h) => [...h, trimmed]);
    setHistIdx(null);

    const [cmd, ...args] = trimmed.toLowerCase().split(/\s+/);

    if (cmd === 'clear') {
      setLines([]);
      return;
    }
    if (cmd === 'lang') {
      const target = args[0];
      if ((target === 'en' && lang !== 'en') || (target === 'pt' && lang !== 'pt')) toggleLang();
      push('out', <p>lang → {target === 'en' ? 'en' : 'pt'}</p>);
      return;
    }
    if (cmd === 'sudo' && args.join(' ') === 'hire-me') {
      push('out', <p className={styles.cat}>permissão concedida. → veja &apos;contact&apos;.</p>);
      return;
    }
    const fn = outputs[cmd];
    if (fn) {
      push('out', fn());
    } else {
      push('err', <p>comando não encontrado: {cmd}. digite &apos;help&apos;.</p>);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      run(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!history.length) return;
      const next = histIdx === null ? history.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(next);
      setInput(history[next]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx === null) return;
      const next = histIdx + 1;
      if (next >= history.length) {
        setHistIdx(null);
        setInput('');
      } else {
        setHistIdx(next);
        setInput(history[next]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const match = COMMANDS.find((c) => c.startsWith(input.toLowerCase()));
      if (match) setInput(match);
    }
  };

  return (
    <div className={styles.crt} onClick={() => inputRef.current?.focus()}>
      <div className={styles.scanlines} aria-hidden="true" />
      <div className={styles.vignette} aria-hidden="true" />

      <div className={styles.bar}>
        <span>luigi@mello:~$</span>
        <button
          className={styles.langBtn}
          onClick={(e) => { e.stopPropagation(); toggleLang(); }}
          aria-label="Trocar idioma"
        >
          {lang === 'pt' ? 'EN' : 'PT'}
        </button>
      </div>

      <div ref={scrollRef} className={styles.screen}>
        <div className={styles.logoRow}>
          <div className={styles.logoScene}><CrtScene /></div>
          <pre className={styles.asciiName}>{`LUIGI MELLO`}</pre>
        </div>

        {lines.map((l) => (
          <div key={l.id} className={`${styles.line} ${styles[l.kind]}`}>
            {l.kind === 'cmd' ? (
              <p><span className={styles.prompt}>luigi@mello:~$</span> {l.content}</p>
            ) : (
              l.content
            )}
          </div>
        ))}

        {booted && (
          <div className={styles.inputRow}>
            <span className={styles.prompt}>luigi@mello:~$</span>
            <input
              ref={inputRef}
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              spellCheck={false}
              autoComplete="off"
              aria-label="Terminal — digite um comando"
            />
            <span className={styles.cursor} aria-hidden="true" />
          </div>
        )}
      </div>

      {booted && (
        <div className={styles.quickRow}>
          {COMMANDS.filter((c) => c !== 'clear').map((c) => (
            <button key={c} className={styles.quickBtn} onClick={() => run(c)}>
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
