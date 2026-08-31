'use client';
import { useState } from 'react';
import styles from './Desktop.module.css';
import DiscordWindow from './DiscordWindow';
import BraveWindow from './BraveWindow';
import {
  PipetteIcon,
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

type AppId = 'brave' | 'discord' | null;

const idleDock = [
  { key: 'spotify', img: `${BASE}/icones/spotify.png`, label: 'Spotify' },
  { key: 'pipette', Icon: PipetteIcon, label: 'Color Picker' },
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
  now: Date;
  onLock: () => void;
  portfolioContent: React.ReactNode;
}) {
  const [openApp, setOpenApp] = useState<AppId>(null);
  const [bounce, setBounce] = useState<string | null>(null);

  const bump = (key: string) => {
    setBounce(key);
    setTimeout(() => setBounce(null), 500);
  };

  const menuDate = capitalize(
    now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
  );
  const menuTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={styles.desktop}>
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

        {idleDock.map(({ key, Icon, img, label }) => (
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
