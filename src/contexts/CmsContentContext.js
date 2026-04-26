import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import cmsClient from '../api/cmsClient';
import {
  DEFAULT_CMS_SITE_SETTINGS,
  DEFAULT_FOOTER_NAVIGATION,
} from '../data/cms/defaults';

const EMPTY_NAVIGATION = [];

const CmsContentContext = createContext({
  siteSettings: DEFAULT_CMS_SITE_SETTINGS,
  footerNavigation: DEFAULT_FOOTER_NAVIGATION,
  isSiteSettingsLoaded: false,
  isFooterNavigationLoaded: false,
  siteSettingsError: null,
  footerNavigationError: null,
  isSiteSettingsFallbackActive: true,
  isFooterNavigationFallbackActive: true,
  pagesBySlug: {},
  missingPageSlugs: new Set(),
  collectionsByKey: {},
  missingCollectionKeys: new Set(),
  cachePage: () => {},
  cacheCollection: () => {}
});

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

function normalizePagesBySlug(pages = {}) {
  return Object.entries(pages || {}).reduce((acc, [slug, payload]) => {
    const normalizedPage = normalizePage(payload);
    if (!normalizedPage) {
      return acc;
    }

    acc[String(slug || '').trim()] = normalizedPage;
    return acc;
  }, {});
}

function normalizeCollection(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  return {
    ...payload,
    items: Array.isArray(payload.items) ? payload.items.slice().sort(sortBySortOrder) : [],
  };
}

function normalizeCollectionsByKey(collections = {}) {
  return Object.entries(collections || {}).reduce((acc, [key, payload]) => {
    const normalizedCollection = normalizeCollection(payload);
    if (!normalizedCollection) {
      return acc;
    }

    acc[String(key || '').trim()] = normalizedCollection;
    return acc;
  }, {});
}

export function CmsContentProvider({ children, initialData = null }) {
  const seededSiteSettings = initialData?.siteSettings
    ? normalizeSiteSettings(initialData.siteSettings)
    : null;
  const seededFooterNavigation = initialData?.footerNavigation
    ? normalizeNavigationGroups(initialData.footerNavigation, DEFAULT_FOOTER_NAVIGATION)
    : null;
  const seededPages = useMemo(
    () => normalizePagesBySlug(initialData?.pages),
    [initialData?.pages]
  );
  const seededCollections = useMemo(
    () => normalizeCollectionsByKey(initialData?.collectionsByKey),
    [initialData?.collectionsByKey]
  );
  const seededMissingPageSlugs = useMemo(() => {
    return new Set(
      Array.isArray(initialData?.missingPageSlugs)
        ? initialData.missingPageSlugs
            .map((slug) => String(slug || '').trim())
            .filter(Boolean)
        : []
    );
  }, [initialData?.missingPageSlugs]);
  const seededMissingCollectionKeys = useMemo(() => {
    return new Set(
      Array.isArray(initialData?.missingCollectionKeys)
        ? initialData.missingCollectionKeys
            .map((key) => String(key || '').trim())
            .filter(Boolean)
        : []
    );
  }, [initialData?.missingCollectionKeys]);

  const [siteSettings, setSiteSettings] = useState(
    seededSiteSettings || DEFAULT_CMS_SITE_SETTINGS
  );
  const [footerNavigation, setFooterNavigation] = useState(
    seededFooterNavigation || DEFAULT_FOOTER_NAVIGATION
  );
  const [isSiteSettingsLoaded, setIsSiteSettingsLoaded] = useState(Boolean(seededSiteSettings));
  const [isFooterNavigationLoaded, setIsFooterNavigationLoaded] = useState(Boolean(seededFooterNavigation));
  const [siteSettingsError, setSiteSettingsError] = useState(null);
  const [footerNavigationError, setFooterNavigationError] = useState(null);
  const [isSiteSettingsFallbackActive, setIsSiteSettingsFallbackActive] = useState(!seededSiteSettings);
  const [isFooterNavigationFallbackActive, setIsFooterNavigationFallbackActive] = useState(!seededFooterNavigation);
  const [pagesBySlug, setPagesBySlug] = useState(seededPages);
  const [missingPageSlugs, setMissingPageSlugs] = useState(seededMissingPageSlugs);
  const [collectionsByKey, setCollectionsByKey] = useState(seededCollections);
  const [missingCollectionKeys, setMissingCollectionKeys] = useState(seededMissingCollectionKeys);

  const cachePage = useCallback((slug, payload) => {
    const normalizedSlug = String(slug || '').trim();
    const normalizedPage = normalizePage(payload);

    if (!normalizedSlug) {
      return;
    }

    if (!normalizedPage) {
      setMissingPageSlugs((current) => {
        const next = new Set(current);
        next.add(normalizedSlug);
        return next;
      });
      setPagesBySlug((current) => {
        if (!Object.prototype.hasOwnProperty.call(current, normalizedSlug)) {
          return current;
        }

        const next = { ...current };
        delete next[normalizedSlug];
        return next;
      });
      return;
    }

    setMissingPageSlugs((current) => {
      if (!current.has(normalizedSlug)) {
        return current;
      }

      const next = new Set(current);
      next.delete(normalizedSlug);
      return next;
    });
    setPagesBySlug((current) => ({
      ...current,
      [normalizedSlug]: normalizedPage
    }));
  }, []);

  const cacheCollection = useCallback((key, payload) => {
    const normalizedKey = String(key || '').trim();
    const normalizedCollection = normalizeCollection(payload);

    if (!normalizedKey) {
      return;
    }

    if (!normalizedCollection) {
      setMissingCollectionKeys((current) => {
        const next = new Set(current);
        next.add(normalizedKey);
        return next;
      });
      setCollectionsByKey((current) => {
        if (!Object.prototype.hasOwnProperty.call(current, normalizedKey)) {
          return current;
        }

        const next = { ...current };
        delete next[normalizedKey];
        return next;
      });
      return;
    }

    setMissingCollectionKeys((current) => {
      if (!current.has(normalizedKey)) {
        return current;
      }

      const next = new Set(current);
      next.delete(normalizedKey);
      return next;
    });
    setCollectionsByKey((current) => ({
      ...current,
      [normalizedKey]: normalizedCollection
    }));
  }, []);

  useEffect(() => {
    const shouldLoadSiteSettings = !seededSiteSettings;
    const shouldLoadFooterNavigation = !seededFooterNavigation;

    if (!shouldLoadSiteSettings && !shouldLoadFooterNavigation) {
      return undefined;
    }

    const siteSettingsController = new AbortController();
    const navigationController = new AbortController();
    let active = true;

    if (shouldLoadSiteSettings) {
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
    }

    if (shouldLoadFooterNavigation) {
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
    }

    return () => {
      active = false;
      siteSettingsController.abort();
      navigationController.abort();
    };
  }, [seededFooterNavigation, seededSiteSettings]);

  const value = useMemo(
    () => ({
      siteSettings,
      footerNavigation,
      isSiteSettingsLoaded,
      isFooterNavigationLoaded,
      siteSettingsError,
      footerNavigationError,
      isSiteSettingsFallbackActive,
      isFooterNavigationFallbackActive,
      pagesBySlug,
      missingPageSlugs,
      collectionsByKey,
      missingCollectionKeys,
      cachePage,
      cacheCollection
    }),
    [
      cachePage,
      cacheCollection,
      collectionsByKey,
      footerNavigation,
      footerNavigationError,
      isFooterNavigationFallbackActive,
      isFooterNavigationLoaded,
      isSiteSettingsFallbackActive,
      isSiteSettingsLoaded,
      missingCollectionKeys,
      missingPageSlugs,
      pagesBySlug,
      siteSettings,
      siteSettingsError
    ]
  );

  return (
    <CmsContentContext.Provider value={value}>
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
  const context = useContext(CmsContentContext);
  const normalizedSlug = String(slug || '').trim();
  const cachedPage = normalizedSlug ? context.pagesBySlug[normalizedSlug] || null : null;
  const isKnownMissingPage = normalizedSlug
    ? context.missingPageSlugs?.has(normalizedSlug)
    : false;
  const [page, setPage] = useState(cachedPage);
  const [isPageLoading, setIsPageLoading] = useState(
    Boolean(enabled && normalizedSlug && !cachedPage && !isKnownMissingPage)
  );
  const [pageError, setPageError] = useState(null);
  const [isFallbackActive, setIsFallbackActive] = useState(isKnownMissingPage);

  useEffect(() => {
    if (!enabled || !normalizedSlug) {
      setPage(null);
      setIsPageLoading(false);
      setPageError(null);
      setIsFallbackActive(false);
      return undefined;
    }

    if (isKnownMissingPage) {
      setPage(null);
      setIsPageLoading(false);
      setPageError(null);
      setIsFallbackActive(true);
      return undefined;
    }

    if (cachedPage) {
      setPage(cachedPage);
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
        context.cachePage(normalizedSlug, normalizedPage);
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
        if (error?.status === 404) {
          context.cachePage(normalizedSlug, null);
          setIsFallbackActive(true);
          return;
        }
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
  }, [cachedPage, context.cachePage, enabled, isKnownMissingPage, normalizedSlug, preview]);

  return {
    page,
    isPageLoading,
    pageError,
    isFallbackActive,
  };
}

export function useCmsCollection(key, { preview = false, enabled = true } = {}) {
  const context = useContext(CmsContentContext);
  const normalizedKey = String(key || '').trim();
  const cachedCollection = normalizedKey ? context.collectionsByKey[normalizedKey] || null : null;
  const isKnownMissingCollection = normalizedKey
    ? context.missingCollectionKeys?.has(normalizedKey)
    : false;
  const [collection, setCollection] = useState(cachedCollection);
  const [isCollectionLoading, setIsCollectionLoading] = useState(
    Boolean(enabled && normalizedKey && !cachedCollection && !isKnownMissingCollection)
  );
  const [collectionError, setCollectionError] = useState(null);
  const [isFallbackActive, setIsFallbackActive] = useState(isKnownMissingCollection);

  useEffect(() => {
    if (!enabled || !normalizedKey) {
      setCollection(null);
      setIsCollectionLoading(false);
      setCollectionError(null);
      setIsFallbackActive(false);
      return undefined;
    }

    if (isKnownMissingCollection) {
      setCollection(null);
      setIsCollectionLoading(false);
      setCollectionError(null);
      setIsFallbackActive(true);
      return undefined;
    }

    if (cachedCollection) {
      setCollection(cachedCollection);
      setIsCollectionLoading(false);
      setCollectionError(null);
      setIsFallbackActive(false);
      return undefined;
    }

    const controller = new AbortController();
    let active = true;

    setIsCollectionLoading(true);
    setCollectionError(null);
    setIsFallbackActive(false);

    cmsClient
      .getCollection(normalizedKey, { preview, signal: controller.signal })
      .then((payload) => {
        if (!active) {
          return;
        }

        const normalizedCollection = normalizeCollection(payload);
        setCollection(normalizedCollection);
        context.cacheCollection(normalizedKey, normalizedCollection);
        setCollectionError(null);
        setIsFallbackActive(!normalizedCollection);
      })
      .catch((error) => {
        if (!active || controller.signal.aborted) {
          return;
        }
        console.warn(`Failed to load CMS collection "${normalizedKey}".`, error);
        setCollection(null);
        setCollectionError(error);
        if (error?.status === 404) {
          context.cacheCollection(normalizedKey, null);
          setIsFallbackActive(true);
          return;
        }
        setIsFallbackActive(true);
      })
      .finally(() => {
        if (!active) {
          return;
        }
        setIsCollectionLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [
    cachedCollection,
    context.cacheCollection,
    enabled,
    isKnownMissingCollection,
    normalizedKey,
    preview
  ]);

  return {
    collection,
    isCollectionLoading,
    collectionError,
    isFallbackActive,
  };
}
