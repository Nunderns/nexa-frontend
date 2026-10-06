import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage, usersApi } from '../services/api';
import { CommentCard } from '../components/CommentCard';
import { PostCard } from '../components/PostCard';
import type { Comment, Post, User } from '../types';

const PAGE_SIZE = 10;
const OVERVIEW_PREVIEW = 3;

/**
 * Tabs whose endpoints do not exist yet. The UI shows a neutral empty state
 * rather than technical detail; the backend work each one needs is recorded
 * here for whoever implements it.
 *
 *   saved    -> no SavedPost model, no GET /users/:id/saved
 *   history  -> no PostView model, views are not tracked
 *   hidden   -> Post has no isHidden column
 *   upvoted  -> PostVote stores the vote but there is no endpoint listing a
 *               user's votes (only GET /votes/post/:postId for a known post)
 *   downvoted-> same as upvoted
 *
 * Empty-state copy for those tabs lives in UNSUPPORTED_TABS below.
 */
type TabId = 'overview' | 'posts' | 'comments' | 'saved' | 'history' | 'hidden' | 'upvoted' | 'downvoted';

interface TabDefinition {
  id: TabId;
  label: string;
}

const TABS: TabDefinition[] = [
  { id: 'overview', label: 'Visão geral' },
  { id: 'posts', label: 'Posts' },
  { id: 'comments', label: 'Comentários' },
  { id: 'saved', label: 'Salvo' },
  { id: 'history', label: 'Histórico' },
  { id: 'hidden', label: 'Ocultado' },
  { id: 'upvoted', label: 'Upvotes' },
  { id: 'downvoted', label: 'Downvotes' },
];

/** Short, non-technical copy for the tabs the API cannot serve yet. */
const UNSUPPORTED_TABS: Record<string, { title: string; body: string }> = {
  saved: {
    title: 'Nenhum post salvo',
    body: 'Os posts que você salvar aparecem aqui.',
  },
  history: {
    title: 'Sem histórico',
    body: 'Os posts que você visualizar aparecem aqui.',
  },
  hidden: {
    title: 'Nenhum post ocultado',
    body: 'Os posts que você ocultar aparecem aqui.',
  },
  upvoted: {
    title: 'Nenhum voto positivo',
    body: 'Os posts em que você votar aparecem aqui.',
  },
  downvoted: {
    title: 'Nenhum voto negativo',
    body: 'Os posts em que você votar aparecem aqui.',
  },
};

function isSupported(id: TabId): boolean {
  return id === 'overview' || id === 'posts' || id === 'comments';
}

/**
 * The signed-in user's own profile: account details plus a tabbed view of
 * their activity.
 */
export function ProfilePage() {
  const { user: sessionUser } = useAuth();
  const [tab, setTab] = useState<TabId>('overview');

  const [profile, setProfile] = useState<User | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const userId = sessionUser?.id;

  // Hooks stay unconditional: an early return above them would change the hook
  // count between renders and crash when the session is cleared in place.
  const loadProfile = useCallback(async () => {
    if (!userId) {
      return;
    }
    setLoadingProfile(true);
    try {
      setProfile(await usersApi.getById(userId));
    } catch {
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  if (!userId) {
    return (
      <div className="home-shell">
        <ProfileHeader />
        <div className="home-layout">
          <main className="home-main">
            <p className="form-error">Você precisa estar logado para ver seu perfil.</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="home-shell">
      <ProfileHeader />

      <div className="home-layout">
        <main className="home-main">
          {loadingProfile ? (
            <ProfileSkeleton />
          ) : profile ? (
            <ProfileCard profile={profile} />
          ) : (
            <div className="feed-empty">
              <h2>Perfil indisponível</h2>
              <p>Não conseguimos carregar seus dados agora.</p>
              <button className="btn btn-primary" onClick={() => void loadProfile()}>
                Tentar de novo
              </button>
            </div>
          )}

          <ProfileTabBar active={tab} onSelect={setTab} />

          {tab === 'overview' && <OverviewTab userId={userId} profile={profile} />}
          {tab === 'posts' && <PostsTab userId={userId} />}
          {tab === 'comments' && <CommentsTab userId={userId} />}
          {!isSupported(tab) && <UnsupportedTab tab={tab} />}
        </main>
      </div>
    </div>
  );
}

function ProfileTabBar({
  active,
  onSelect,
}: {
  active: TabId;
  onSelect: (tab: TabId) => void;
}) {
  return (
    <div className="tab-bar" role="tablist" aria-label="Seções do perfil">
      {TABS.map((definition) => (
        <button
          key={definition.id}
          type="button"
          role="tab"
          id={`tab-${definition.id}`}
          aria-selected={active === definition.id}
          aria-controls={`panel-${definition.id}`}
          className={`tab ${active === definition.id ? 'active' : ''} ${
            isSupported(definition.id) ? '' : 'tab-disabled'
          }`}
          onClick={() => onSelect(definition.id)}
        >
          {definition.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Overview is a composition of the two lists the API does serve, so both
 * requests run together and each preview shows its own loading state.
 */
function OverviewTab({ userId, profile }: { userId: number; profile: User | null }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [postTotal, setPostTotal] = useState(0);
  const [commentTotal, setCommentTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [postResponse, commentResponse] = await Promise.all([
          usersApi.getPosts(userId, 1, OVERVIEW_PREVIEW),
          usersApi.getComments(userId, 1, OVERVIEW_PREVIEW),
        ]);
        if (cancelled) {
          return;
        }
        setPosts(postResponse.data);
        setPostTotal(postResponse.total);
        setComments(commentResponse.data);
        setCommentTotal(commentResponse.total);
      } catch {
        if (!cancelled) {
          setPosts([]);
          setComments([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview" className="tab-panel">
      {profile && (
        <dl className="profile-stats profile-stats-overview">
          <div className="profile-stat">
            <dt>Posts</dt>
            <dd>{loading ? '—' : postTotal}</dd>
          </div>
          <div className="profile-stat">
            <dt>Comentários</dt>
            <dd>{loading ? '—' : commentTotal}</dd>
          </div>
          <div className="profile-stat">
            <dt>Karma</dt>
            <dd>{formatCount(profile.karma)}</dd>
          </div>
        </dl>
      )}

      <section className="overview-section">
        <header className="overview-section-header">
          <h2 className="feed-heading">Atividade recente</h2>
        </header>

        {loading ? (
          <PostListSkeleton />
        ) : posts.length === 0 && comments.length === 0 ? (
          <div className="feed-empty">
            <h2>Nada publicado ainda</h2>
            <p>Suas postagens e comentários aparecem aqui.</p>
            <Link to="/home" className="btn btn-primary">
              Ir para o feed
            </Link>
          </div>
        ) : (
          <>
            {posts.length > 0 && (
              <>
                <h3 className="overview-subheading">Últimas postagens</h3>
                <ul className="post-list">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </ul>
              </>
            )}

            {comments.length > 0 && (
              <>
                <h3 className="overview-subheading">Últimos comentários</h3>
                <ul className="post-list">
                  {comments.map((comment) => (
                    <CommentCard key={comment.id} comment={comment} />
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function PostsTab({ userId }: { userId: number }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await usersApi.getPosts(userId, page, PAGE_SIZE);
        if (cancelled) {
          return;
        }
        setPosts((current) => (page === 1 ? response.data : [...current, ...response.data]));
        setTotal(response.total);
        setTotalPages(response.totalPages);
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'Não foi possível carregar suas postagens.'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [userId, page]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const response = await usersApi.getPosts(userId, page + 1, PAGE_SIZE);
      setPosts((current) => [...current, ...response.data]);
      setTotal(response.total);
      setTotalPages(response.totalPages);
      setPage(response.page);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Não foi possível carregar mais postagens.'));
    } finally {
      setLoadingMore(false);
    }
  };

  const hasMore = page < totalPages && posts.length < total;

  return (
    <div role="tabpanel" id="panel-posts" aria-labelledby="tab-posts" className="tab-panel">
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <PostListSkeleton />
      ) : posts.length === 0 ? (
        <div className="feed-empty">
          <h2>Você ainda não publicou nada</h2>
          <p>Quando você publicar algo, aparece aqui.</p>
          <Link to="/home" className="btn btn-primary">
            Ir para o feed
          </Link>
        </div>
      ) : (
        <>
          <ul className="post-list">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </ul>

          {hasMore && (
            <div className="load-more">
              <button className="btn" onClick={() => void handleLoadMore()} disabled={loadingMore}>
                {loadingMore ? 'Carregando...' : 'Carregar mais'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CommentsTab({ userId }: { userId: number }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await usersApi.getComments(userId, page, PAGE_SIZE);
        if (cancelled) {
          return;
        }
        setComments((current) =>
          page === 1 ? response.data : [...current, ...response.data],
        );
        setTotal(response.total);
        setTotalPages(response.totalPages);
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'Não foi possível carregar seus comentários.'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [userId, page]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const response = await usersApi.getComments(userId, page + 1, PAGE_SIZE);
      setComments((current) => [...current, ...response.data]);
      setTotal(response.total);
      setTotalPages(response.totalPages);
      setPage(response.page);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Não foi possível carregar mais comentários.'));
    } finally {
      setLoadingMore(false);
    }
  };

  const hasMore = page < totalPages && comments.length < total;

  return (
    <div role="tabpanel" id="panel-comments" aria-labelledby="tab-comments" className="tab-panel">
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <CommentListSkeleton />
      ) : comments.length === 0 ? (
        <div className="feed-empty">
          <h2>Nenhum comentário ainda</h2>
          <p>Seus comentários em postagens aparecem aqui.</p>
          <Link to="/home" className="btn btn-primary">
            Ir para o feed
          </Link>
        </div>
      ) : (
        <>
          <ul className="post-list">
            {comments.map((comment) => (
              <CommentCard key={comment.id} comment={comment} />
            ))}
          </ul>

          {hasMore && (
            <div className="load-more">
              <button className="btn" onClick={() => void handleLoadMore()} disabled={loadingMore}>
                {loadingMore ? 'Carregando...' : 'Carregar mais'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function UnsupportedTab({ tab }: { tab: TabId }) {
  const copy = UNSUPPORTED_TABS[tab];

  return (
    <div
      role="tabpanel"
      id={`panel-${tab}`}
      aria-labelledby={`tab-${tab}`}
      className="tab-panel"
    >
      <div className="feed-empty">
        <h2>{copy.title}</h2>
        <p>{copy.body}</p>
      </div>
    </div>
  );
}

function ProfileCard({ profile }: { profile: User }) {
  return (
    <section className="profile-card">
      <header className="profile-card-header">
        {profile.avatarUrl ? (
          <img className="profile-avatar" src={profile.avatarUrl} alt="" />
        ) : (
          <span className="profile-avatar profile-avatar-fallback" aria-hidden="true">
            {profile.displayName.charAt(0).toUpperCase()}
          </span>
        )}

        <div className="profile-identity">
          <h1 className="profile-name">{profile.displayName}</h1>
          <p className="profile-handle">u/{profile.username}</p>
          <p className="profile-joined">Entrou em {formatDate(profile.createdAt)}</p>
        </div>
      </header>

      {profile.bio && <p className="profile-bio">{profile.bio}</p>}

      <dl className="profile-stats">
        <div className="profile-stat">
          <dt>Karma</dt>
          <dd>{formatCount(profile.karma)}</dd>
        </div>
        <div className="profile-stat">
          <dt>Email</dt>
          <dd className="profile-stat-email">{profile.email}</dd>
        </div>
        <div className="profile-stat">
          <dt>Status</dt>
          <dd className="profile-stat-status">{profile.isActive ? 'Ativo' : 'Inativo'}</dd>
        </div>
      </dl>
    </section>
  );
}

function ProfileHeader() {
  const { user, signOut } = useAuth();

  return (
    <header className="home-header">
      <div className="home-header-inner">
        <Link className="brand" to="/home">
          <svg className="brand-mark" width="28" height="28" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="5" />
            <path d="M32 16L32 48M16 32L48 32" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          </svg>
          <span className="brand-name">Nexa</span>
        </Link>

        <div className="user-menu">
          <span className="avatar" aria-hidden="true">
            {(user?.username ?? '?').charAt(0).toUpperCase()}
          </span>
          <span className="user-menu-name">u/{user?.username ?? 'guest'}</span>
          <button type="button" className="btn" onClick={() => void signOut()}>
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}

function ProfileSkeleton() {
  return (
    <section className="profile-card" aria-busy="true">
      <header className="profile-card-header">
        <div className="profile-avatar-skeleton" />
        <div className="profile-identity">
          <div className="skeleton-line skeleton-line-md" />
          <div className="skeleton-line skeleton-line-sm" />
        </div>
      </header>
    </section>
  );
}

function PostListSkeleton() {
  return (
    <ul className="post-list" aria-busy="true" aria-label="Carregando">
      {[0, 1, 2].map((index) => (
        <li key={index} className="post-card skeleton">
          <div className="post-vote" />
          <div className="post-content">
            <div className="skeleton-line skeleton-line-sm" />
            <div className="skeleton-line skeleton-line-lg" />
            <div className="skeleton-line skeleton-line-md" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function CommentListSkeleton() {
  return (
    <ul className="post-list" aria-busy="true" aria-label="Carregando comentários">
      {[0, 1, 2].map((index) => (
        <li key={index} className="comment-card">
          <div className="comment-card-body">
            <div className="skeleton-line skeleton-line-sm" />
            <div className="skeleton-line skeleton-line-lg" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return 'recentemente';
  }
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function formatCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return String(value);
}