import React, { createContext, useContext, useEffect, useState } from 'react';
import cmsClient from '../api/cmsClient';
import {
  DEFAULT_CMS_SITE_SETTINGS,
  DEFAULT_FOOTER_NAVIGATION,
} from '../data/cms/defaults';

const CmsContentContext = createContext({
  siteSettings: DEFAULT_CMS_SITE_SETTINGS,
  footerNavigation: DEFAULT_FOOTER_NAVIGATION,
  isSiteSettingsLoaded: false,
  isFooterNavigationLoaded: false,
  siteSettingsError: null,
  footerNavigationError: null,
  isSiteSettingsFallbackActive: true,
  isFooterNavigationFallbackActive: true,
});

const EMPTY_NAVIGATION = [];

function normalizeSiteSettings(payload) {
  if (!payload || typeof payload !== 'object') {
    return DEFAULT_CMS_SITE_SETTINGS;
  }

  return {
    ...DEFAULT_CMS_SITE_SETTINGS,
    ...payload,
  };
}

function sortBySortOrder(left, right) {
  return Number(left?.sort ?? 0) - Number(right?.sort ?? 0);
}

function normalizeNavigationItems(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item) => item && item.label && item.url)
    .slice()
    .sort(sortBySortOrder);
}

function normalizeNavigationGroups(groups, fallbackGroups = DEFAULT_FOOTER_NAVIGATION) {
  if (!Array.isArray(groups) || groups.length === 0) {
    return fallbackGroups;
  }

  const normalizedGroups = groups
    .filter((group) => group && group.title)
    .map((group) => ({
      ...group,
      items: normalizeNavigationItems(group.items),
    }))
    .filter((group) => group.items.length > 0)
    .sort(sortBySortOrder);

  return normalizedGroups.length > 0 ? normalizedGroups : fallbackGroups;
}

function normalizePageSections(sections = []) {
  if (!Array.isArray(sections)) {
    return [];
  }

  return sections
    .filter((section) => section && (section.title || section.body || section.sectionType))
    .map((section) => ({
      ...section,
      items: Array.isArray(section.items) ? section.items.slice().sort(sortBySortOrder) : [],
    }))
    .sort(sortBySortOrder);
}

function normalizePage(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  return {
    ...payload,
    sections: normalizePageSections(payload.sections),
  };
}

export function CmsContentProvider({ children }) {
  const [siteSettings, setSiteSettings] = useState(DEFAULT_CMS_SITE_SETTINGS);
  const [footerNavigation, setFooterNavigation] = useState(DEFAULT_FOOTER_NAVIGATION);
  const [isSiteSettingsLoaded, setIsSiteSettingsLoaded] = useState(false);
  const [isFooterNavigationLoaded, setIsFooterNavigationLoaded] = useState(false);
  const [siteSettingsError, setSiteSettingsError] = useState(null);
  const [footerNavigationError, setFooterNavigationError] = useState(null);
  const [isSiteSettingsFallbackActive, setIsSiteSettingsFallbackActive] = useState(true);
  const [isFooterNavigationFallbackActive, setIsFooterNavigationFallbackActive] = useState(true);

  useEffect(() => {
    const siteSettingsController = new AbortController();
    const navigationController = new AbortController();
    let active = true;

    cmsClient
      .getSiteSettings({ signal: siteSettingsController.signal })
      .then((payload) => {
        if (!active) {
          return;
        }
        setSiteSettings(normalizeSiteSettings(payload));
        setSiteSettingsError(null);
        setIsSiteSettingsFallbackActive(false);
      })
      .catch((error) => {
        if (!active || siteSettingsController.signal.aborted) {
          return;
        }
        console.warn('Failed to load CMS site settings, using defaults.', error);
        setSiteSettings(DEFAULT_CMS_SITE_SETTINGS);
        setSiteSettingsError(error);
        setIsSiteSettingsFallbackActive(true);
      })
      .finally(() => {
        if (!active) {
          return;
        }
        setIsSiteSettingsLoaded(true);
      });

    cmsClient
      .getNavigation({ placement: 'footer', signal: navigationController.signal })
      .then((payload) => {
        if (!active) {
          return;
        }
        setFooterNavigation(normalizeNavigationGroups(payload, DEFAULT_FOOTER_NAVIGATION));
        setFooterNavigationError(null);
        setIsFooterNavigationFallbackActive(false);
      })
      .catch((error) => {
        if (!active || navigationController.signal.aborted) {
          return;
        }
        console.warn('Failed to load CMS footer navigation, using defaults.', error);
        setFooterNavigation(DEFAULT_FOOTER_NAVIGATION);
        setFooterNavigationError(error);
        setIsFooterNavigationFallbackActive(true);
      })
      .finally(() => {
        if (!active) {
          return;
        }
        setIsFooterNavigationLoaded(true);
      });

    return () => {
      active = false;
      siteSettingsController.abort();
      navigationController.abort();
    };
  }, []);

  return (
    <CmsContentContext.Provider
      value={{
        siteSettings,
        footerNavigation,
        isSiteSettingsLoaded,
        isFooterNavigationLoaded,
        siteSettingsError,
        footerNavigationError,
        isSiteSettingsFallbackActive,
        isFooterNavigationFallbackActive,
      }}
    >
      {children}
    </CmsContentContext.Provider>
  );
}

export function useCmsSiteSettings() {
  const context = useContext(CmsContentContext);

  return {
    siteSettings: normalizeSiteSettings(context.siteSettings),
    isSiteSettingsLoaded: context.isSiteSettingsLoaded,
    siteSettingsError: context.siteSettingsError,
    isFallbackActive: context.isSiteSettingsFallbackActive,
  };
}

export function useCmsNavigation({ placement = 'footer', fallbackNavigation = EMPTY_NAVIGATION } = {}) {
  const context = useContext(CmsContentContext);
  const normalizedPlacement = String(placement || '').trim().toLowerCase();
  const shouldUseFooterNavigation = normalizedPlacement === 'footer';
  const [navigation, setNavigation] = useState(() =>
    shouldUseFooterNavigation
      ? normalizeNavigationGroups(context.footerNavigation, DEFAULT_FOOTER_NAVIGATION)
      : normalizeNavigationGroups(fallbackNavigation, fallbackNavigation)
  );
  const [isNavigationLoaded, setIsNavigationLoaded] = useState(shouldUseFooterNavigation);
  const [navigationError, setNavigationError] = useState(null);
  const [isFallbackActive, setIsFallbackActive] = useState(
    shouldUseFooterNavigation ? context.isFooterNavigationFallbackActive : true
  );

  useEffect(() => {
    if (!shouldUseFooterNavigation) {
      return undefined;
    }

    setNavigation(normalizeNavigationGroups(context.footerNavigation, DEFAULT_FOOTER_NAVIGATION));
    setIsNavigationLoaded(context.isFooterNavigationLoaded);
    setNavigationError(context.footerNavigationError);
    setIsFallbackActive(context.isFooterNavigationFallbackActive);
    return undefined;
  }, [
    context.footerNavigation,
    context.footerNavigationError,
    context.isFooterNavigationFallbackActive,
    context.isFooterNavigationLoaded,
    shouldUseFooterNavigation,
  ]);

  useEffect(() => {
    if (shouldUseFooterNavigation) {
      return undefined;
    }

    const controller = new AbortController();
    let active = true;

    setNavigation(normalizeNavigationGroups(fallbackNavigation, fallbackNavigation));
    setIsNavigationLoaded(false);
    setNavigationError(null);
    setIsFallbackActive(true);

    cmsClient
      .getNavigation({ placement: normalizedPlacement, signal: controller.signal })
      .then((payload) => {
        if (!active) {
          return;
        }
        setNavigation(normalizeNavigationGroups(payload, fallbackNavigation));
        setNavigationError(null);
        setIsFallbackActive(false);
      })
      .catch((error) => {
        if (!active || controller.signal.aborted) {
          return;
        }
        console.warn(`Failed to load CMS navigation for placement "${normalizedPlacement}".`, error);
        setNavigation(normalizeNavigationGroups(fallbackNavigation, fallbackNavigation));
        setNavigationError(error);
        setIsFallbackActive(true);
      })
      .finally(() => {
        if (!active) {
          return;
        }
        setIsNavigationLoaded(true);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [fallbackNavigation, normalizedPlacement, shouldUseFooterNavigation]);

  return {
    navigation,
    isNavigationLoaded,
    navigationError,
    isFallbackActive,
  };
}

export function useCmsPage(slug, { preview = false, enabled = true } = {}) {
  const normalizedSlug = String(slug || '').trim();
  const [page, setPage] = useState(null);
  const [isPageLoading, setIsPageLoading] = useState(Boolean(enabled && normalizedSlug));
  const [pageError, setPageError] = useState(null);
  const [isFallbackActive, setIsFallbackActive] = useState(false);

  useEffect(() => {
    if (!enabled || !normalizedSlug) {
      setPage(null);
      setIsPageLoading(false);
      setPageError(null);
      setIsFallbackActive(false);
      return undefined;
    }

    const controller = new AbortController();
    let active = true;

    setIsPageLoading(true);
    setPageError(null);
    setIsFallbackActive(false);

    cmsClient
      .getPage(normalizedSlug, { preview, signal: controller.signal })
      .then((payload) => {
        if (!active) {
          return;
        }

        const normalizedPage = normalizePage(payload);
        setPage(normalizedPage);
        setPageError(null);
        setIsFallbackActive(!normalizedPage);
      })
      .catch((error) => {
        if (!active || controller.signal.aborted) {
          return;
        }
        console.warn(`Failed to load CMS page "${normalizedSlug}".`, error);
        setPage(null);
        setPageError(error);
        setIsFallbackActive(true);
      })
      .finally(() => {
        if (!active) {
          return;
        }
        setIsPageLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [enabled, normalizedSlug, preview]);

  return {
    page,
    isPageLoading,
    pageError,
    isFallbackActive,
  };
}
