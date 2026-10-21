import type { ReactNode } from 'react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { isSupported, TABS, UNSUPPORTED_TABS, type TabId } from '../utils/profile-tabs';

export function ProfileTabBar({
  active,
  onSelect,
}: {
  active: TabId;
  onSelect: (tab: TabId) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="tab-bar" role="tablist" aria-label={t('app.name')}>
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
          {t(definition.label)}
        </button>
      ))}
    </div>
  );
}

/** The `tabpanel` wrapper wired to its tab for assistive tech. */
export function ProfileTabPanel({ tab, children }: { tab: TabId; children: ReactNode }) {
  return (
    <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="tab-panel">
      {children}
    </div>
  );
}

export function UnsupportedTab({ tab }: { tab: TabId }) {
  const { t } = useI18n();
  const copy = UNSUPPORTED_TABS[tab];

  return (
    <ProfileTabPanel tab={tab}>
      <div className="feed-empty">
        <h2>{t(copy.title)}</h2>
        <p>{t(copy.body)}</p>
      </div>
    </ProfileTabPanel>
  );
}
