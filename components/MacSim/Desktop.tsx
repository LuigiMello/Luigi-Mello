'use client';
import { useState } from 'react';
import styles from './Desktop.module.css';
import DiscordWindow from './DiscordWindow';
import BraveWindow from './BraveWindow';
import GitHubWindow from './GitHubWindow';
import SpaceBackground from './SpaceBackground';
import {
  DevToolIcon,
  NotebookIcon,
  TerminalIcon,
  TrashIcon,
  LaunchpadIcon,
  PowerIcon,
  WifiIcon,
  VolumeIcon,
  BatteryIcon,
} from './icons';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

type AppId = 'brave' | 'discord' | 'github' | null;

const idleDockBefore = [{ key: 'spotify', img: `${BASE}/icones/spotify.png`, label: 'Spotify' }];

const idleDockAfter = [
  { key: 'code', img: `${BASE}/icones/vscode.png`, label: 'VS Code' },
  { key: 'devtool', Icon: DevToolIcon, label: 'IntelliJ IDEA' },
  { key: 'notebook', Icon: NotebookIcon, label: 'Notas' },
  { key: 'terminal', Icon: TerminalIcon, label: 'Terminal' },
];

function capitalize(s: string) {
  const lower = s.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export default function Desktop({
  now,
  onLock,
  portfolioContent,
}: {
  now: Date | null;
  onLock: () => void;
  portfolioContent: React.ReactNode;
}) {
  const [openApp, setOpenApp] = useState<AppId>(null);
  const [bounce, setBounce] = useState<string | null>(null);

  const bump = (key: string) => {
    setBounce(key);
    setTimeout(() => setBounce(null), 500);
  };

  // Desktop only mounts after the lock/login screens, well after the
  // client-side effect in MacSim has set a real Date — this fallback just
  // keeps the types honest without ever actually being hit.
  const clock = now ?? new Date();
  const menuDate = capitalize(
    clock.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
  );
  const menuTime = clock.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={styles.desktop}>
      <SpaceBackground />

      {/* Menu bar */}
      <div className={styles.menuBar}>
        <div className={styles.menuLeft}>
          <span className={styles.menuBrand}>Luigi Mello</span>
        </div>
        <div className={styles.menuRight}>
          <span className={styles.menuClock}>
            {menuDate} &nbsp; {menuTime}
          </span>
          <span className={styles.menuIcon}><WifiIcon /></span>
          <span className={styles.menuIcon}><VolumeIcon /></span>
          <span className={styles.menuIcon}><BatteryIcon /></span>
          <button className={styles.powerBtn} onClick={onLock} title="Bloquear tela" aria-label="Bloquear tela">
            <PowerIcon />
          </button>
        </div>
      </div>

      {/* Windows */}
      {openApp === 'discord' && <DiscordWindow onClose={() => setOpenApp(null)} />}
      {openApp === 'brave' && <BraveWindow onClose={() => setOpenApp(null)}>{portfolioContent}</BraveWindow>}
      {openApp === 'github' && <GitHubWindow onClose={() => setOpenApp(null)} />}

      {/* Dock */}
      <div className={styles.dock}>
        <button
          className={`${styles.dockIcon} ${bounce === 'brave' ? styles.bounce : ''}`}
          onClick={() => setOpenApp('brave')}
          title="Brave"
        >
          <img src={`${BASE}/icones/brave.png`} alt="Brave" />
        </button>
        <button
          className={`${styles.dockIcon} ${bounce === 'discord' ? styles.bounce : ''}`}
          onClick={() => setOpenApp('discord')}
          title="Discord"
        >
          <img src={`${BASE}/icones/discord.png`} alt="Discord" />
        </button>

        {idleDockBefore.map(({ key, img, label }) => (
          <button
            key={key}
            className={`${styles.dockIcon} ${bounce === key ? styles.bounce : ''}`}
            onClick={() => bump(key)}
            title={label}
          >
            <img src={img} alt={label} />
          </button>
        ))}

        <button
          className={`${styles.dockIcon} ${bounce === 'github' ? styles.bounce : ''}`}
          onClick={() => setOpenApp('github')}
          title="GitHub"
        >
          <img src={`${BASE}/icones/git.png`} alt="GitHub" />
        </button>

        {idleDockAfter.map(({ key, Icon, img, label }) => (
          <button
            key={key}
            className={`${styles.dockIcon} ${bounce === key ? styles.bounce : ''}`}
            onClick={() => bump(key)}
            title={label}
          >
            {img ? <img src={img} alt={label} /> : Icon && <Icon />}
          </button>
        ))}

        <span className={styles.dockDivider} />

        <button
          className={`${styles.dockIcon} ${bounce === 'trash' ? styles.bounce : ''}`}
          onClick={() => bump('trash')}
          title="Lixeira"
        >
          <TrashIcon />
        </button>
        <button
          className={`${styles.dockIcon} ${bounce === 'launch' ? styles.bounce : ''}`}
          onClick={() => bump('launch')}
          title="Launchpad"
        >
          <LaunchpadIcon />
        </button>
      </div>
    </div>
  );
}
