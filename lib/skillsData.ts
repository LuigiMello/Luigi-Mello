export type SkillCat = 'frontend' | 'backend' | 'tools' | 'environment' | 'productivity' | 'ai';

export const SKILLS: { cat: SkillCat; items: string[] }[] = [
  { cat: 'frontend', items: ['HTML5', 'CSS3', 'JavaScript', 'TypeScript', 'React', 'Next.js'] },
  { cat: 'backend', items: ['Node.js', 'PHP', 'Java', 'TypeScript'] },
  { cat: 'tools', items: ['Git', 'GitHub', 'Docker', 'NPM'] },
  { cat: 'environment', items: ['VS Code', 'Windows'] },
  { cat: 'productivity', items: ['Notion', 'Canva', 'Milanote'] },
  { cat: 'ai', items: ['ChatGPT', 'Gemini', 'Claude', 'Deepseek', 'Kimi K3'] },
];
