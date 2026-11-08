import { translations, type Language } from '@/context/translations';
import { SKILLS } from '@/lib/skillsData';

export type Lang = Language;
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const EMAIL = 'luigileitenski@gmail.com';

export const CHANNELS = [
  { key: 'email', label: 'E-mail', handle: EMAIL, href: `mailto:${EMAIL}` },
  { key: 'whatsapp', label: 'WhatsApp', handle: '(41) 99209-6564', href: 'https://wa.me/5541992096564' },
  { key: 'instagram', label: 'Instagram', handle: '@oluigilucio', href: 'https://www.instagram.com/oluigilucio/' },
  { key: 'linkedin', label: 'LinkedIn', handle: '/in/luigimello', href: 'https://www.linkedin.com/in/luigimello/' },
  { key: 'youtube', label: 'YouTube', handle: '@oluigimello', href: 'https://youtube.com/@oluigimello' },
] as const;

/** Visual assets for each project, keyed by the project name used in translations. */
const PROJECT_ASSETS: Record<
  string,
  { shots: string[]; logo?: string; tagline: Record<Lang, string>; category: Record<Lang, string>; bg?: string }
> = {
  Cifra: {
    shots: ['/magazine/cifra-1.jpg'],
    category: { pt: 'Finanças pessoais', en: 'Personal finance' },
    tagline: { pt: 'Seu dinheiro, organizado de verdade.', en: 'Your money, truly organized.' },
  },
  Achou: {
    shots: ['/magazine/achou-1.jpg', '/magazine/achou-2.jpg'],
    category: { pt: 'Marketplace', en: 'Marketplace' },
    tagline: { pt: 'Compre e venda sem complicação.', en: 'Buy and sell, hassle-free.' },
  },
  CoPrompt: {
    shots: ['/magazine/coprompt-1.jpg', '/magazine/coprompt-2.jpg'],
    category: { pt: 'Catálogo de prompts de IA', en: 'AI prompt catalog' },
    tagline: { pt: 'Copie a ideia. Revele o rosto.', en: 'Copy the idea. Reveal the face.' },
  },
  Mirtillo: {
    shots: ['/magazine/mirtillo-1.jpg', '/magazine/mirtillo-2.jpg'],
    category: { pt: 'Plataforma de infoprodutos', en: 'Infoproduct platform' },
    tagline: { pt: 'Sua plataforma de produtos digitais.', en: 'Your digital products platform.' },
  },
  'Viral Studio': {
    shots: [],
    logo: '/projects/viralstudio.png',
    bg: '#ff6d00',
    category: { pt: 'Criação de conteúdo', en: 'Content creation' },
    tagline: { pt: 'Conteúdo feito para viralizar.', en: 'Content built to go viral.' },
  },
  'Mercedes-Benz': {
    shots: ['/magazine/mercedes-1.jpg', '/magazine/mercedes-2.jpg'],
    category: { pt: 'Landing page 3D', en: '3D landing page' },
    tagline: { pt: 'The best or nothing.', en: 'The best or nothing.' },
  },
  TAITTOO: {
    shots: ['/magazine/taittoo-1.jpg', '/magazine/taittoo-2.jpg'],
    category: { pt: 'IA para tatuagens', en: 'AI for tattoos' },
    tagline: { pt: 'Sua tatuagem começa aqui.', en: 'Your tattoo starts here.' },
  },
  'Fast Race': {
    shots: ['/magazine/fastrace-1.jpg', '/magazine/fastrace-2.jpg'],
    category: { pt: 'Corrida solidária', en: 'Charity race' },
    tagline: { pt: 'Corra a sua distância.', en: 'Run your distance.' },
  },
};

export interface Project {
  name: string;
  description: string;
  tags: string[];
  github: string;
  demo: string;
  color: string;
  shots: string[];
  logo?: string;
  bg?: string;
  tagline: string;
  category: string;
}

export function getProjects(lang: Lang): Project[] {
  return translations[lang].projects.items.map((p) => {
    const a = PROJECT_ASSETS[p.name] ?? { shots: [p.image], tagline: { pt: '', en: '' }, category: { pt: '', en: '' } };
    return {
      name: p.name,
      description: p.description,
      tags: p.tags,
      github: p.github,
      demo: p.demo,
      color: p.color,
      shots: a.shots,
      logo: a.logo,
      bg: a.bg,
      tagline: a.tagline[lang],
      category: a.category[lang],
    };
  });
}

export const IMAGE_URLS: string[] = Array.from(
  new Set([
    '/avatar.jpg',
    '/mello.jpg',
    ...Object.values(PROJECT_ASSETS).flatMap((a) => [...a.shots, ...(a.logo ? [a.logo] : [])]),
  ]),
);

export { SKILLS, translations };

/* ── Magazine page plan ─────────────────────────────────────────────── */

export type SectionKey = 'about' | 'projects' | 'skills' | 'services' | 'contact';
export const SECTIONS: SectionKey[] = ['about', 'projects', 'skills', 'services', 'contact'];

export type PageSpec =
  | { kind: 'cover' }
  | { kind: 'contents' }
  | { kind: 'letter' }
  | { kind: 'divider'; section: SectionKey }
  | { kind: 'aboutCover' }
  | { kind: 'profile' }
  | { kind: 'facts' }
  | { kind: 'grid' }
  | { kind: 'shot'; project: number }
  | { kind: 'feature'; project: number }
  | { kind: 'skills' }
  | { kind: 'services' }
  | { kind: 'contact' }
  | { kind: 'thanks' }
  | { kind: 'insideBack' }
  | { kind: 'backCover' };

const PROJECT_COUNT = translations.pt.projects.items.length;

/*
 * Spread s shows page 2s-1 on the left and 2s on the right. Every section opens
 * on a left-hand page that carries only its title; each project keeps its
 * screenshot (left) and feature (right) together on one spread.
 */
export const PAGES: PageSpec[] = [
  { kind: 'cover' },
  { kind: 'contents' },
  { kind: 'letter' },
  { kind: 'divider', section: 'about' },
  { kind: 'aboutCover' },
  { kind: 'profile' },
  { kind: 'facts' },
  { kind: 'divider', section: 'projects' },
  { kind: 'grid' },
  ...Array.from({ length: PROJECT_COUNT }, (_, i) => [
    { kind: 'shot' as const, project: i },
    { kind: 'feature' as const, project: i },
  ]).flat(),
  { kind: 'divider', section: 'skills' },
  { kind: 'skills' },
  { kind: 'divider', section: 'services' },
  { kind: 'services' },
  { kind: 'divider', section: 'contact' },
  { kind: 'contact' },
  { kind: 'thanks' },
  { kind: 'insideBack' },
  { kind: 'backCover' },
];

if (PAGES.length % 2 !== 0) throw new Error('The magazine needs an even number of pages');

/** Leaves are sheets of paper: leaf k carries page 2k (front) and 2k+1 (back). */
export const LEAF_COUNT = PAGES.length / 2;
/** Highest spread the reader can open to (left = 2s-1, right = 2s). */
export const MAX_SPREAD = LEAF_COUNT - 1;

/** First page of a kind; `key` narrows it to a project index or a section. */
export const pageOf = (kind: PageSpec['kind'], key?: number | SectionKey) =>
  PAGES.findIndex(
    (p) =>
      p.kind === kind &&
      (key === undefined || ('project' in p && p.project === key) || ('section' in p && p.section === key)),
  );

/** The project shown on a spread, or -1. */
export function spreadProject(spread: number) {
  for (const p of [PAGES[spread * 2 - 1], PAGES[spread * 2]]) {
    if (p && (p.kind === 'shot' || p.kind === 'feature')) return p.project;
  }
  return -1;
}

/** Short name of a single page, for the reading panel on compact screens. */
export function pageLabel(page: number, lang: Lang) {
  const ui = UI[lang];
  const p = PAGES[page];
  if (!p) return '';
  switch (p.kind) {
    case 'contents':
      return ui.contentsTitle;
    case 'letter':
      return ui.letterKicker;
    case 'divider':
      return ui.sections[p.section];
    case 'aboutCover':
    case 'profile':
    case 'facts':
      return ui.sections.about;
    case 'grid':
      return ui.sections.projects;
    case 'shot':
    case 'feature':
      return getProjects(lang)[p.project].name;
    case 'skills':
      return ui.sections.skills;
    case 'services':
      return ui.sections.services;
    case 'contact':
      return ui.sections.contact;
    default:
      return ui.sections.end;
  }
}

/** Short name of what a spread is about, for the controls under the magazine. */
export function spreadLabel(spread: number, lang: Lang) {
  const ui = UI[lang];
  const pages = [PAGES[spread * 2 - 1], PAGES[spread * 2]].filter(Boolean);
  const project = spreadProject(spread);
  if (project >= 0) return getProjects(lang)[project].name;
  const named: [PageSpec['kind'], string][] = [
    ['contents', ui.contentsTitle],
    ['letter', ui.letterKicker],
    ['aboutCover', ui.sections.about],
    ['profile', ui.sections.about],
    ['facts', ui.sections.about],
    ['grid', ui.sections.projects],
    ['skills', ui.sections.skills],
    ['services', ui.sections.services],
    ['contact', ui.sections.contact],
    ['thanks', ui.sections.end],
  ];
  for (const [kind, label] of named) if (pages.some((p) => p.kind === kind)) return label;
  const opener = pages.find((p) => p.kind === 'divider');
  return opener && 'section' in opener ? ui.sections[opener.section] : '';
}

export const spreadOfPage = (page: number) => Math.max(1, Math.ceil(page / 2));

/* ── Interface copy ─────────────────────────────────────────────────── */

export const UI = {
  pt: {
    brand: 'luigi mello',
    heroTitle: ['Portfólio interativo', 'que você pode explorar'],
    heroSub: 'Clique na revista ou role o mouse para abrir. Role ou clique nas páginas para folhear e passe o mouse para vê-las em movimento.',
    getInTouch: 'Fale comigo',
    loading: 'Arrumando a mesa',
    prev: 'Anterior',
    next: 'Próxima',
    close: 'Fechar',
    visit: 'Ver site',
    code: 'Código',
    keys: 'scroll ou ← → folhear · esc fechar',
    heroSubTouch: 'Toque na revista para abrir. Toque ou deslize nas páginas para folhear.',
    sections: {
      about: 'Sobre mim',
      projects: 'Projetos',
      skills: 'Arsenal técnico',
      services: 'Serviços',
      contact: 'Contato',
      end: 'Fim',
    },
    sectionWord: 'Seção',
    edition: 'Portfólio · Edição 2026',
    running: 'LUIGI MELLO · PORTFÓLIO 2026',
    contentsTitle: 'Sumário',
    contentsIntro: 'Uma edição sobre código, design e produtos digitais que eu construí do zero.',
    groups: { editorial: 'Editorial', work: 'Projetos', end: 'Serviços & contato' },
    aboutLabel: 'Perfil · Nº 01',
    hello: 'Olá, eu sou',
    available: 'Disponível para Freelance & CLT',
    projectLabel: 'Projeto',
    skillsTitle: ['Ferramentas', 'do dia a dia'],
    beyond: { label: 'Além do código', items: ['Inglês avançado', 'Gestão & administração de negócios', 'Foco no cliente & resolução de problemas'] },
    skillsIntro: 'As ferramentas que uso todos os dias para tirar ideias do papel.',
    servicesTitle: ['Como posso', 'ajudar'],
    contactTitle: ['Vamos', 'trabalhar', 'juntos?'],
    contactIntro: 'Estou disponível para novos projetos, colaborações e oportunidades.',
    warranty: ['GARANTIA', 'VITALÍCIA'],
    thanks: 'Obrigado por folhear.',
    colophon: 'Feito à mão com Three.js, GSAP & Next.js',
    price: 'Grátis para recrutadores',
    privateBuild: 'Projeto privado',
    readText: 'Ler texto',
    hideText: 'Ocultar',
    pageWord: 'Pág.',
    letterKicker: 'Carta do editor',
    letterTitle: 'Bem-vindo à edição 2026.',
    letterBody: [
      'Nas próximas páginas você conhece quem eu sou, folheia os projetos que construí do zero, de um painel de finanças pessoais a um marketplace completo, vê as ferramentas que uso todos os dias e descobre como posso ajudar no seu próximo projeto.',
      'Puxe uma cadeira, pegue um café e boa leitura.',
    ],
    signoff: 'Com carinho,',
    profileKicker: 'Perfil',
    profileTitle: ['Quem é', 'Luigi Mello'],
    quote: 'O bom código vai além de funcionar: ele deve ser limpo, eficiente e escalável.',
    factsTitle: 'Ficha técnica',
    facts: [
      ['Nome', 'Luigi Mello'],
      ['Função', 'Full-Stack Developer'],
      ['Foco', 'Frontend · Soluções com IA'],
      ['Também', 'Solutions Engineer'],
      ['Base', 'Gestão & administração de negócios'],
      ['Experiência', '1 ano de engenharia de software'],
      ['Abordagem', 'Foco no cliente & resolução de problemas'],
      ['Idiomas', 'Português · Inglês avançado'],
      ['Disponível', 'Freelance & CLT'],
    ],
    numbersTitle: 'Em números',
    illustration: 'O editor, em versão desenho.',
    gridKicker: 'Índice de projetos',
    gridTitle: ['Projetos', 'selecionados'],
    gridHint: 'Clique em um projeto para ver mais',
    seeMore: 'Ver mais',
    allProjects: 'Todos os projetos',
    backToIndex: '← Todos os projetos',
    githubLink: '↗ código no GitHub',
    contentsHint: 'Clique em um item para ir direto à página',
    thanksSub: 'Até a próxima edição.',
    thanksCta: 'Vamos conversar?',
  },
  en: {
    brand: 'luigi mello',
    heroTitle: ['Interactive portfolio', 'that you can explore'],
    heroSub: 'Click the magazine or scroll to open it. Scroll or click the pages to flip through and hover to see them in motion.',
    getInTouch: 'Get in touch',
    loading: 'Setting the table',
    prev: 'Previous',
    next: 'Next',
    close: 'Close',
    visit: 'Visit site',
    code: 'Code',
    keys: 'scroll or ← → flip · esc close',
    heroSubTouch: 'Tap the magazine to open it. Tap or swipe the pages to flip through.',
    sections: {
      about: 'About me',
      projects: 'Projects',
      skills: 'Tech arsenal',
      services: 'Services',
      contact: 'Contact',
      end: 'The end',
    },
    sectionWord: 'Section',
    edition: 'Portfolio · 2026 Edition',
    running: 'LUIGI MELLO · PORTFOLIO 2026',
    contentsTitle: 'Contents',
    contentsIntro: 'An issue about code, design and the digital products I built from scratch.',
    groups: { editorial: 'Editorial', work: 'Projects', end: 'Services & contact' },
    aboutLabel: 'Profile · No. 01',
    hello: "Hi, I'm",
    available: 'Available for Freelance & Full-time',
    projectLabel: 'Project',
    skillsTitle: ['Everyday', 'toolkit'],
    beyond: { label: 'Beyond code', items: ['Advanced English', 'Business & administration background', 'Customer-centric problem solving'] },
    skillsIntro: 'The tools I use every day to take ideas off the paper.',
    servicesTitle: ['How I can', 'help'],
    contactTitle: ["Let's", 'work', 'together?'],
    contactIntro: 'I am available for new projects, collaborations and opportunities.',
    warranty: ['LIFETIME', 'WARRANTY'],
    thanks: 'Thanks for reading.',
    colophon: 'Handmade with Three.js, GSAP & Next.js',
    price: 'Free for recruiters',
    privateBuild: 'Private build',
    readText: 'Read text',
    hideText: 'Hide',
    pageWord: 'Page',
    letterKicker: "Editor's letter",
    letterTitle: 'Welcome to the 2026 issue.',
    letterBody: [
      "In the next pages you'll meet me, flip through the projects I built from scratch, from a personal finance dashboard to a full marketplace, see the tools I use every day and find out how I can help with your next project.",
      'Pull up a chair, grab a coffee and enjoy the read.',
    ],
    signoff: 'Warmly,',
    profileKicker: 'Profile',
    profileTitle: ['Who is', 'Luigi Mello'],
    quote: 'Good code goes beyond working: it should be clean, efficient and scalable.',
    factsTitle: 'Fact sheet',
    facts: [
      ['Name', 'Luigi Mello'],
      ['Role', 'Full-Stack Developer'],
      ['Focus', 'Frontend · AI solutions'],
      ['Also', 'Solutions Engineer'],
      ['Background', 'Business & administration'],
      ['Experience', '1 year of software engineering'],
      ['Approach', 'Customer-centric problem solving'],
      ['Languages', 'Portuguese · Advanced English'],
      ['Available', 'Freelance & full-time'],
    ],
    numbersTitle: 'By the numbers',
    illustration: 'The editor, drawn.',
    gridKicker: 'Project index',
    gridTitle: ['Selected', 'work'],
    gridHint: 'Click a project to see more',
    seeMore: 'See more',
    allProjects: 'All projects',
    backToIndex: '← All projects',
    githubLink: '↗ code on GitHub',
    contentsHint: 'Click an entry to jump to its page',
    thanksSub: 'See you in the next issue.',
    thanksCta: "Let's talk?",
  },
};

export type UiCopy = (typeof UI)['pt'];
