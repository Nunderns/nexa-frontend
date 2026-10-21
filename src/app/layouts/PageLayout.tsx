import type { ReactNode } from 'react';
import { TopBar, type TopBarProps } from './TopBar';

interface PageLayoutProps {
  children: ReactNode;
  /** Full-width block between the top bar and the content grid, e.g. a community banner. */
  hero?: ReactNode;
  /** Right-hand rail; omitted pages get a single column. */
  aside?: ReactNode;
  /** Extra class for `<main>`, e.g. `home-main-flush`. */
  mainClassName?: string;
  topBar?: TopBarProps;
}

/** Shell shared by every signed-in page: top bar, then main column and optional rail. */
export function PageLayout({ children, hero, aside, mainClassName, topBar }: PageLayoutProps) {
  return (
    <div className="home-shell">
      <TopBar {...topBar} />
      {hero}

      <div className="home-layout">
        <main className={mainClassName ? `home-main ${mainClassName}` : 'home-main'}>{children}</main>
        {aside && <aside className="home-sidebar">{aside}</aside>}
      </div>
    </div>
  );
}
