'use client';
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { SKILLS } from '@/lib/skillsData';
import { useChiptune, getGenre } from './useChiptune';
import styles from './SpotifyWindow.module.css';

const CAT_COLORS: Record<string, string> = {
  frontend: '#2b1df7',
  backend: '#e63030',
  tools: '#f59e0b',
  environment: '#00adef',
  productivity: '#7b2ff7',
  ai: '#1ed760',
};

type Track = {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  duration: string;
  link?: string;
  seed: number;
};

export default function SpotifyWindow({ onClose }: { onClose: () => void }) {
  const { tr, lang } = useLanguage();
  const [playlist, setPlaylist] = useState<'projects' | 'skills'>('projects');
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const projectTracks: Track[] = tr.projects.items.map((p, i) => {
    const proj = p as typeof p & { demo?: string };
    const link = proj.demo && proj.demo !== '#' ? proj.demo : p.github !== '#' ? p.github : undefined;
    return {
      id: `p-${i}`,
      title: p.name,
      subtitle: p.tags.join(' • '),
      color: p.color,
      duration: `${2 + i}:${(18 + i * 7) % 60 < 10 ? '0' : ''}${(18 + i * 7) % 60}`,
      link,
      seed: i,
    };
  });

  const skillTracks: Track[] = SKILLS.map((g, i) => ({
    id: `s-${i}`,
    title: tr.skills.categories[g.cat],
    subtitle: g.items.join(', '),
    color: CAT_COLORS[g.cat] ?? '#1ed760',
    duration: `${3 + i}:${(10 + i * 11) % 60 < 10 ? '0' : ''}${(10 + i * 11) % 60}`,
    seed: i + 100,
  }));

  const tracks = playlist === 'projects' ? projectTracks : skillTracks;
  const track = tracks[current] ?? tracks[0];

  useEffect(() => {
    setCurrent(0);
    setProgress(0);
  }, [playlist]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (playing) {
      timerRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            setCurrent((c) => (c + 1) % tracks.length);
            return 0;
          }
          return p + 1.1;
        });
      }, 220);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, current, tracks.length]);

  const selectTrack = (i: number) => {
    setCurrent(i);
    setProgress(0);
    setPlaying(true);
  };

  // No licensed audio files here — instead each track gets its own tiny
  // procedural beat (Web Audio drum + bass synth), so play/pause actually plays
  // something, and each genre (funk/pop/rock/lo-fi/eletrônica) sounds distinct.
  const genre = track ? getGenre(track.seed) : undefined;
  useChiptune(track?.seed ?? 0, playing);

  return (
    <div className={styles.overlay}>
      <div className={styles.window}>
        <div className={styles.titleBar}>
          <div className={styles.traffic}>
            <button className={`${styles.dot} ${styles.red}`} onClick={onClose} aria-label="Fechar" />
            <span className={`${styles.dot} ${styles.yellow}`} />
            <span className={`${styles.dot} ${styles.green}`} />
          </div>
          <span className={styles.title}>Spotify — Luigi Mello Radio</span>
        </div>

        <div className={styles.body}>
          <aside className={styles.sidebar}>
            <div className={styles.brand}>
              <span className={styles.brandDot} />
              LuigiFM
            </div>
            <button
              className={`${styles.playlistBtn} ${playlist === 'projects' ? styles.playlistBtnActive : ''}`}
              onClick={() => setPlaylist('projects')}
            >
              {lang === 'pt' ? 'Playlist: Projetos' : 'Playlist: Projects'}
            </button>
            <button
              className={`${styles.playlistBtn} ${playlist === 'skills' ? styles.playlistBtnActive : ''}`}
              onClick={() => setPlaylist('skills')}
            >
              {lang === 'pt' ? 'Playlist: Habilidades' : 'Playlist: Skills'}
            </button>
            <p className={styles.sidebarNote}>
              {lang === 'pt'
                ? 'Cada faixa é um projeto real — clique para tocar, abra o link para conferir ao vivo.'
                : 'Every track is a real project — click to play, open the link to see it live.'}
            </p>
          </aside>

          <main className={styles.main}>
            <div className={styles.trackList}>
              {tracks.map((t, i) => (
                <button
                  key={t.id}
                  className={`${styles.trackRow} ${i === current ? styles.trackRowActive : ''}`}
                  onClick={() => selectTrack(i)}
                >
                  <span className={styles.trackArt} style={{ background: t.color }}>
                    {i === current && playing && <span className={styles.eq}><i /><i /><i /></span>}
                  </span>
                  <span className={styles.trackInfo}>
                    <span className={styles.trackTitle}>{t.title}</span>
                    <span className={styles.trackSubtitle}>{t.subtitle}</span>
                  </span>
                  <span className={styles.trackGenre}>
                    {getGenre(t.seed).emoji} {getGenre(t.seed).label}
                  </span>
                  <span className={styles.trackDuration}>{t.duration}</span>
                </button>
              ))}
            </div>
          </main>
        </div>

        <div className={styles.nowPlaying}>
          <div className={styles.npLeft}>
            <span className={styles.npArt} style={{ background: track?.color }} />
            <span className={styles.npInfo}>
              <span className={styles.npTitle}>{track?.title}</span>
              <span className={styles.npSubtitle}>
                {genre && `${genre.emoji} ${genre.label} · `}{track?.subtitle}
              </span>
            </span>
          </div>

          <div className={styles.npCenter}>
            <div className={styles.npControls}>
              <button
                onClick={() => selectTrack((current - 1 + tracks.length) % tracks.length)}
                aria-label="Anterior"
              >⏮</button>
              <button className={styles.playBtn} onClick={() => setPlaying((p) => !p)} aria-label="Play/Pause">
                {playing ? '⏸' : '▶'}
              </button>
              <button
                onClick={() => selectTrack((current + 1) % tracks.length)}
                aria-label="Próxima"
              >⏭</button>
            </div>
            <div className={styles.npProgressTrack}>
              <div className={styles.npProgressFill} style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className={styles.npRight}>
            {track?.link && (
              <a href={track.link} target="_blank" rel="noopener noreferrer" className={styles.npLink}>
                {lang === 'pt' ? 'Abrir ↗' : 'Open ↗'}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
