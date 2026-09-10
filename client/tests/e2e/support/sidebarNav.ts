import type { Page } from '@playwright/test';

/**
 * The sidebar auto-collapses (replaced by a hamburger-only TopHeader) once
 * the user visits /pos. Every page object that clicks a sidebar nav link
 * must call this first, or the click silently times out because the link
 * isn't in the DOM until the hamburger button reopens the sidebar.
 *
 * A plain `isVisible()` snapshot right after a route/page transition is
 * racy: the hamburger button may not have painted yet, so the check comes
 * back false even though the sidebar really is collapsed, and the caller's
 * nav-link click then hangs forever. Instead, wait for the shell to settle
 * into whichever state it's actually in — the collapsed hamburger button or
 * the expanded sidebar's own "Collapse sidebar" button — before deciding.
 */
export const openSidebarIfCollapsed = async (page: Page) => {
  const openSidebarBtn = page.getByRole('button', { name: 'Open sidebar' });
  const collapseSidebarBtn = page.getByRole('button', { name: 'Collapse sidebar' });

  await Promise.race([
    openSidebarBtn.waitFor({ state: 'visible' }).catch(() => {}),
    collapseSidebarBtn.waitFor({ state: 'visible' }).catch(() => {}),
  ]);

  if (await openSidebarBtn.isVisible()) {
    await openSidebarBtn.click();
  }
};
