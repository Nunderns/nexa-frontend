import { useI18n } from '@/lib/i18n/I18nContext';
import type { User } from '@/types/api';
import { formatCount, formatJoinDate } from '../utils/format';

export function ProfileCard({ profile }: { profile: User }) {
  const { t } = useI18n();

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
          <p className="profile-joined">{t('profile.joined', { date: formatJoinDate(profile.createdAt, t) })}</p>
        </div>
      </header>

      {profile.bio && <p className="profile-bio">{profile.bio}</p>}

      <dl className="profile-stats">
        <div className="profile-stat">
          <dt>{t('profile.karma')}</dt>
          <dd>{formatCount(profile.karma)}</dd>
        </div>
        {profile.email && (
          <div className="profile-stat">
            <dt>{t('profile.email')}</dt>
            <dd className="profile-stat-email">{profile.email}</dd>
          </div>
        )}
        <div className="profile-stat">
          <dt>{t('profile.status')}</dt>
          <dd className="profile-stat-status">{profile.isActive ? t('profile.active') : t('profile.inactive')}</dd>
        </div>
      </dl>
    </section>
  );
}

export function ProfileSkeleton() {
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
