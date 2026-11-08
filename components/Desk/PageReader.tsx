'use client';
import {
  BASE,
  CHANNELS,
  EMAIL,
  PAGES,
  SECTIONS,
  SKILLS,
  UI,
  getProjects,
  pageOf,
  translations,
  type Lang,
} from './content';
import s from './PageReader.module.css';

interface Props {
  page: number;
  lang: Lang;
  /** Opens another page of the magazine. */
  onGo: (page: number) => void;
}

const ext = { target: '_blank', rel: 'noopener noreferrer' } as const;
const host = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');
const nn = (n: number) => String(n).padStart(2, '0');

/**
 * The readable version of a magazine page: the same content as the printed
 * page, set as real text so it stays legible on any screen.
 */
export default function PageReader({ page, lang, onGo }: Props) {
  const spec = PAGES[page];
  if (!spec) return null;
  const ui = UI[lang];
  const tr = translations[lang];
  const projects = getProjects(lang);

  const Entry = ({ to, title }: { to: number; title: string }) => (
    <li>
      <button className={s.entry} onClick={() => onGo(to)}>
        <span className={s.entryNum}>{nn(to)}</span>
        <span className={s.entryTitle}>{title}</span>
        <span className={s.arrow}>→</span>
      </button>
    </li>
  );

  switch (spec.kind) {
    case 'contents':
      return (
        <article className={s.page}>
          <p className={s.kicker}>{ui.edition}</p>
          <h2 className={s.title}>{ui.contentsTitle}</h2>
          <p className={s.lead}>{ui.contentsIntro}</p>
          <p className={s.label}>{ui.groups.editorial}</p>
          <ul className={s.list}>
            <Entry to={pageOf('letter')} title={ui.letterKicker} />
            <Entry to={pageOf('divider', 'about')} title={ui.sections.about} />
          </ul>
          <p className={s.label}>{ui.groups.work}</p>
          <ul className={s.list}>
            <Entry to={pageOf('grid')} title={ui.gridKicker} />
            {projects.map((p, i) => (
              <Entry key={p.name} to={pageOf('shot', i)} title={p.name} />
            ))}
          </ul>
          <p className={s.label}>{ui.groups.end}</p>
          <ul className={s.list}>
            <Entry to={pageOf('divider', 'skills')} title={ui.sections.skills} />
            <Entry to={pageOf('divider', 'services')} title={ui.sections.services} />
            <Entry to={pageOf('divider', 'contact')} title={ui.sections.contact} />
          </ul>
        </article>
      );

    case 'letter':
      return (
        <article className={s.page}>
          <p className={s.kicker}>{ui.letterKicker}</p>
          <h2 className={s.serifTitle}>{ui.letterTitle}</h2>
          <p className={s.body}>{tr.hero.description}</p>
          <p className={s.body}>{ui.letterBody[0]}</p>
          <p className={s.body}>{ui.letterBody[1]}</p>
          <p className={s.signoff}>{ui.signoff}</p>
          <p className={s.signature}>Luigi Mello</p>
        </article>
      );

    case 'divider':
      return (
        <article className={`${s.page} ${s.opener}`}>
          <p className={s.kicker}>
            {nn(SECTIONS.indexOf(spec.section) + 1)} · {ui.sectionWord}
          </p>
          <h2 className={s.openerTitle}>{ui.sections[spec.section]}</h2>
        </article>
      );

    case 'aboutCover':
      return (
        <article className={s.page}>
          <p className={s.kicker}>{ui.aboutLabel}</p>
          <p className={s.hello}>{ui.hello}</p>
          <h2 className={s.title}>Luigi Mello</h2>
          <p className={s.lead}>{tr.hero.description}</p>
          <div className={s.chips}>
            {tr.hero.roles.slice(0, 4).map((r) => (
              <span key={r} className={s.chip}>
                {r}
              </span>
            ))}
          </div>
          <p className={s.available}>
            <span className={s.dot} />
            {ui.available}
          </p>
        </article>
      );

    case 'profile':
      return (
        <article className={s.page}>
          <p className={s.kicker}>{ui.profileKicker}</p>
          <h2 className={s.title}>
            {ui.profileTitle[0]} <em>{ui.profileTitle[1]}</em>
          </h2>
          <p className={s.body}>{tr.about.p1}</p>
          <p className={s.body}>{tr.about.p2}</p>
          <blockquote className={s.quote}>
            “{ui.quote}”<cite>Luigi Mello</cite>
          </blockquote>
        </article>
      );

    case 'facts':
      return (
        <article className={s.page}>
          <p className={s.kicker}>{ui.sections.about}</p>
          <h2 className={s.title}>{ui.factsTitle}</h2>
          <dl className={s.facts}>
            {ui.facts.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <p className={s.label}>{ui.numbersTitle}</p>
          <div className={s.stats}>
            <div>
              <b>10+</b>
              <span>{tr.about.stats.projects}</span>
            </div>
            <div>
              <b>10+</b>
              <span>{tr.about.stats.technologies}</span>
            </div>
            <div>
              <b>5</b>
              <span>{tr.about.stats.aiTools}</span>
            </div>
          </div>
          <p className={s.body}>{tr.about.p3}</p>
        </article>
      );

    case 'grid':
      return (
        <article className={s.page}>
          <p className={s.kicker}>{ui.gridKicker}</p>
          <h2 className={s.title}>
            {ui.gridTitle[0]} <em>{ui.gridTitle[1]}</em>
          </h2>
          <p className={s.hint}>{ui.gridHint}</p>
          <div className={s.tiles}>
            {projects.map((p, i) => (
              <button key={p.name} className={s.tile} onClick={() => onGo(pageOf('shot', i))}>
                <span
                  className={s.tileImg}
                  style={{
                    backgroundImage: `url(${BASE}${p.shots[0] ?? p.logo})`,
                    backgroundColor: p.bg ?? '#111',
                    backgroundSize: p.shots[0] ? 'cover' : 'contain',
                  }}
                />
                <span className={s.tileNum}>{nn(i + 1)}</span>
                <span className={s.tileName}>{p.name}</span>
                <span className={s.tileCat}>{p.category}</span>
              </button>
            ))}
          </div>
        </article>
      );

    case 'shot': {
      const p = projects[spec.project];
      const live = p.demo && p.demo !== '#';
      return (
        <article className={s.page}>
          <p className={s.kicker}>
            {ui.projectLabel} {nn(spec.project + 1)} / {nn(projects.length)} · {p.category}
          </p>
          <h2 className={s.title}>{p.name}</h2>
          <p className={s.tagline}>{p.tagline}</p>
          <div className={s.shot} style={{ backgroundColor: p.bg ?? '#111' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${BASE}${p.shots[0] ?? p.logo}`} alt={p.name} loading="lazy" />
          </div>
          {live && (
            <a className={s.button} href={p.demo} {...ext}>
              {ui.visit} ↗
            </a>
          )}
        </article>
      );
    }

    case 'feature': {
      const p = projects[spec.project];
      const live = p.demo && p.demo !== '#';
      const code = p.github && p.github !== '#';
      return (
        <article className={s.page}>
          <p className={s.kicker}>
            {ui.projectLabel} {nn(spec.project + 1)} / {nn(projects.length)} · {p.category}
          </p>
          <h2 className={s.title}>{p.name}</h2>
          <p className={s.tagline}>{p.tagline}</p>
          <p className={s.body}>{p.description}</p>
          <div className={s.chips}>
            {p.tags.map((t) => (
              <span key={t} className={s.chip}>
                {t}
              </span>
            ))}
          </div>
          <div className={s.actions}>
            {live ? (
              <a className={s.button} href={p.demo} {...ext}>
                {ui.visit} ↗ <small>{host(p.demo)}</small>
              </a>
            ) : (
              <span className={s.muted}>{ui.privateBuild}</span>
            )}
            {code && (
              <a className={s.buttonGhost} href={p.github} {...ext}>
                {ui.code} ↗
              </a>
            )}
            <button className={s.buttonGhost} onClick={() => onGo(pageOf('grid'))}>
              {ui.backToIndex}
            </button>
          </div>
        </article>
      );
    }

    case 'skills':
      return (
        <article className={s.page}>
          <p className={s.kicker}>{ui.sections.skills}</p>
          <h2 className={s.title}>
            {ui.skillsTitle[0]} <em>{ui.skillsTitle[1]}</em>
          </h2>
          <p className={s.lead}>{ui.skillsIntro}</p>
          {SKILLS.map((g) => (
            <section key={g.cat} className={s.group}>
              <p className={s.label}>{tr.skills.categories[g.cat]}</p>
              <div className={s.chips}>
                {g.items.map((it) => (
                  <span key={it} className={s.chip}>
                    {it}
                  </span>
                ))}
              </div>
            </section>
          ))}
          <p className={s.label}>{ui.beyond.label}</p>
          <ul className={s.plain}>
            {ui.beyond.items.map((it) => (
              <li key={it}>{it}</li>
            ))}
          </ul>
        </article>
      );

    case 'services':
      return (
        <article className={s.page}>
          <p className={s.kicker}>{ui.sections.services}</p>
          <h2 className={s.title}>
            {ui.servicesTitle[0]} <em>{ui.servicesTitle[1]}</em>
          </h2>
          <p className={s.available}>
            <span className={s.dot} />
            {ui.available}
          </p>
          {tr.services.items.map((sv, i) => (
            <section key={sv.title} className={s.service}>
              <span className={s.serviceNum} style={{ color: sv.color }}>
                {nn(i + 1)}
              </span>
              <h3>{sv.title}</h3>
              <p>{sv.description}</p>
            </section>
          ))}
        </article>
      );

    case 'contact':
      return (
        <article className={s.page}>
          <p className={s.kicker}>{ui.sections.contact}</p>
          <h2 className={s.title}>
            {ui.contactTitle[0]} {ui.contactTitle[1]} <em>{ui.contactTitle[2]}</em>
          </h2>
          <p className={s.lead}>{ui.contactIntro}</p>
          <ul className={s.list}>
            {CHANNELS.map((c) => (
              <li key={c.key}>
                <a className={s.entry} href={c.href} {...(c.key === 'email' ? {} : ext)}>
                  <span className={s.entryLabel}>{c.label}</span>
                  <span className={s.entryTitle}>{c.handle}</span>
                  <span className={s.arrow}>↗</span>
                </a>
              </li>
            ))}
          </ul>
        </article>
      );

    case 'thanks':
      return (
        <article className={`${s.page} ${s.center}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.avatar} src={`${BASE}/mello.jpg`} alt="" loading="lazy" />
          <h2 className={s.serifTitle}>{ui.thanks}</h2>
          <p className={s.lead}>{ui.thanksSub}</p>
          <a className={s.button} href={`mailto:${EMAIL}`}>
            {ui.thanksCta} {EMAIL}
          </a>
        </article>
      );

    case 'insideBack':
      return (
        <article className={`${s.page} ${s.center}`}>
          <h2 className={s.title}>{ui.brand}</h2>
          <p className={s.muted}>{ui.colophon}</p>
          <p className={s.muted}>© 2026 Luigi Mello</p>
        </article>
      );

    default:
      return null;
  }
}
