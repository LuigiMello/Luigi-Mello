'use client';
import { useEffect, useState } from 'react';
import styles from './GitHubWindow.module.css';

const USERNAME = 'LuigiMello';
const PROFILE_URL = `https://github.com/${USERNAME}`;

interface GhUser {
  avatar_url: string;
  name: string | null;
  login: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
}

interface GhRepo {
  id: number;
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  html_url: string;
}

export default function GitHubWindow({ onClose }: { onClose: () => void }) {
  const [user, setUser] = useState<GhUser | null>(null);
  const [repos, setRepos] = useState<GhRepo[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [userRes, reposRes] = await Promise.all([
          fetch(`https://api.github.com/users/${USERNAME}`),
          fetch(`https://api.github.com/users/${USERNAME}/repos?sort=updated&per_page=4`),
        ]);
        if (!userRes.ok || !reposRes.ok) throw new Error('fetch failed');
        const userData: GhUser = await userRes.json();
        const reposData: GhRepo[] = await reposRes.json();
        if (!cancelled) {
          setUser(userData);
          setRepos(reposData);
          setStatus('ready');
        }
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={styles.overlay}>
      <div className={styles.window}>
        <div className={styles.titleBar}>
          <span className={styles.titleText}>GitHub</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>

        <div className={styles.body}>
          {status === 'loading' && (
            <div className={styles.state}>
              <span className={styles.spinner} />
              <span>Carregando perfil…</span>
            </div>
          )}

          {status === 'error' && (
            <div className={styles.state}>
              <span>Não foi possível carregar o perfil agora.</span>
              <a
                className={styles.fallbackLink}
                href={PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir github.com/{USERNAME} ↗
              </a>
            </div>
          )}

          {status === 'ready' && user && (
            <>
              <div className={styles.profileRow}>
                <img src={user.avatar_url} alt={user.login} className={styles.avatar} />
                <div className={styles.identity}>
                  <span className={styles.displayName}>{user.name ?? user.login}</span>
                  <span className={styles.handle}>@{user.login}</span>
                </div>
              </div>

              {user.bio && <p className={styles.bio}>{user.bio}</p>}

              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span className={styles.statNum}>{user.public_repos}</span>
                  <span className={styles.statLbl}>repositórios</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statNum}>{user.followers}</span>
                  <span className={styles.statLbl}>seguidores</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statNum}>{user.following}</span>
                  <span className={styles.statLbl}>seguindo</span>
                </div>
              </div>

              {repos.length > 0 && (
                <div className={styles.repoList}>
                  {repos.map((repo) => (
                    <a
                      key={repo.id}
                      className={styles.repoRow}
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className={styles.repoName}>{repo.name}</span>
                      {repo.description && (
                        <span className={styles.repoDesc}>{repo.description}</span>
                      )}
                      <span className={styles.repoMeta}>
                        {repo.language && <span>{repo.language}</span>}
                        <span>★ {repo.stargazers_count}</span>
                      </span>
                    </a>
                  ))}
                </div>
              )}

              <a
                className={styles.viewProfile}
                href={PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver perfil completo ↗
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
