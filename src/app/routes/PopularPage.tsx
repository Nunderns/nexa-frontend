import { useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageLayout } from '@/app/layouts/PageLayout';
import { LoadMoreButton } from '@/components/LoadMoreButton';
import { postsApi } from '@/features/posts/api/posts';
import { PostCard } from '@/features/posts/components/PostCard';
import { PostListSkeleton } from '@/features/posts/components/PostListSkeleton';
import { countryFlag, countryName } from '@/features/posts/utils/insights';
import {
  POPULAR_GEO_COUNTRIES,
  POPULAR_SORTS,
  POPULAR_TIME_WINDOWS,
  isPopularSort,
  parseGeo,
  parseTimeWindow,
  popularPath,
} from '@/features/posts/utils/popular';
import { useDismissable } from '@/hooks/useDismissable';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { getApiErrorMessage } from '@/lib/api-client';
import { useI18n } from '@/lib/i18n/I18nContext';

const PAGE_SIZE = 10;

/**
 * `/popular/:sort?geo=BR&t=week`, after Reddit's r/popular. Everything that
 * picks the feed lives in the URL, so a filtered view can be shared and the
 * back button walks through the choices.
 */
export function PopularPage() {
  const { sort } = useParams<{ sort: string }>();
  const { search } = useLocation();

  if (!isPopularSort(sort)) {
    return <Navigate to={`/popular/hot${search}`} replace />;
  }
  return <PopularFeed sort={sort} />;
}

function PopularFeed({ sort }: { sort: (typeof POPULAR_SORTS)[number] }) {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const geo = parseGeo(searchParams.get('geo'));
  const time = parseTimeWindow(searchParams.get('t'));

  const { items, loading, loadingMore, error, hasMore, loadMore } = usePaginatedList(
    `${sort}|${time}|${geo ?? ''}`,
    (page) => postsApi.getPopular({ sort, t: time, geo, page, limit: PAGE_SIZE }),
  );

  // The ranking can move between two page requests, so the same post may come
  // back on the next page; it is shown once.
  const posts = useMemo(() => {
    const seen = new Set<number>();
    return items.filter((post) => !seen.has(post.id) && seen.add(post.id));
  }, [items]);

  // United States first, as on Reddit, then alphabetical in the UI language.
  const [first, ...rest] = POPULAR_GEO_COUNTRIES;
  const countries = [
    { code: first, name: countryName(first, t) },
    ...rest
      .map((code) => ({ code, name: countryName(code, t) }))
      .sort((a, b) => a.name.localeCompare(b.name, locale)),
  ];

  const geoLabel = geo ? countryName(geo, t) : t('popular.everywhere');

  return (
    <PageLayout>
      <div className="feed-toolbar">
        <h1 className="feed-heading">{t('popular.title')}</h1>
      </div>

      <div className="popular-controls">
        <nav className="tab-bar" aria-label={t('popular.sortLabel')}>
          {POPULAR_SORTS.map((option) => (
            <Link
              key={option}
              to={popularPath(option, geo, time)}
              className={`tab ${option === sort ? 'active' : ''}`}
              aria-current={option === sort ? 'page' : undefined}
            >
              {t(`popular.sort.${option}`)}
            </Link>
          ))}
        </nav>

        <div className="popular-filters">
          {sort === 'top' && (
            <FilterMenu
              label={t('popular.timeLabel')}
              current={t(`popular.time.${time}`)}
              options={POPULAR_TIME_WINDOWS.map((value) => ({
                key: value,
                label: t(`popular.time.${value}`),
                selected: value === time,
                onSelect: () => navigate(popularPath(sort, geo, value)),
              }))}
            />
          )}

          <FilterMenu
            label={t('popular.geoLabel')}
            current={geo ? `${countryFlag(geo)} ${geoLabel}` : geoLabel}
            options={[
              {
                key: 'everywhere',
                label: t('popular.everywhere'),
                selected: !geo,
                onSelect: () => navigate(popularPath(sort, undefined, time)),
              },
              ...countries.map(({ code, name }) => ({
                key: code,
                label: `${countryFlag(code)} ${name}`,
                selected: code === geo,
                onSelect: () => navigate(popularPath(sort, code, time)),
              })),
            ]}
          />
        </div>
      </div>

      {error != null && (
        <p className="form-error" role="alert">
          {getApiErrorMessage(error, t('feed.loadFailed'))}
        </p>
      )}

      {loading ? (
        <PostListSkeleton label={t('popular.title')} count={4} />
      ) : posts.length === 0 ? (
        <div className="feed-empty">
          <h2>{t('feed.emptyTitle')}</h2>
          <p>{geo ? t('popular.emptyGeo', { country: geoLabel }) : t('popular.emptyBody')}</p>
        </div>
      ) : (
        <>
          <ul className="post-list">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </ul>
          {hasMore && <LoadMoreButton loading={loadingMore} onClick={() => void loadMore()} />}
        </>
      )}
    </PageLayout>
  );
}

interface FilterOption {
  key: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
}

/** Dropdown in the style of the topbar menus. */
function FilterMenu({ label, current, options }: { label: string; current: string; options: FilterOption[] }) {
  const [open, setOpen] = useState(false);
  const ref = useDismissable<HTMLDivElement>(open, () => setOpen(false));

  return (
    <div className="menu-anchor" ref={ref}>
      <button
        type="button"
        className="btn popular-filter-btn"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${label}: ${current}`}
      >
        {current}
        <span aria-hidden="true">▾</span>
      </button>

      {open && (
        <div className="menu-pop menu-pop-right popular-filter-pop" role="menu">
          <p className="menu-pop-title">{label}</p>
          {options.map((option) => (
            <button
              key={option.key}
              type="button"
              role="menuitemradio"
              aria-checked={option.selected}
              className={`menu-pop-item ${option.selected ? 'active' : ''}`}
              onClick={() => {
                option.onSelect();
                setOpen(false);
              }}
            >
              <span className="menu-pop-check" aria-hidden="true">
                {option.selected ? '✓' : ''}
              </span>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
