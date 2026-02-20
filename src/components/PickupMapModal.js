import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const MAP_SCRIPT_ID = 'yandex-maps-sdk';
let mapSdkPromise;

function normalizePoint(point, index) {
  const hasServerId = typeof point?.id === 'string' && point.id.trim().length > 0;
  const lat = Number(point?.latitude);
  const lon = Number(point?.longitude);
  const coordToken = Number.isFinite(lat) && Number.isFinite(lon) ? `${lat}-${lon}` : `no-coords-${index}`;
  return {
    ...point,
    __uiId: hasServerId ? point.id : `${coordToken}-${index}`,
    __hasServerId: hasServerId,
    __latitude: Number.isFinite(lat) ? lat : null,
    __longitude: Number.isFinite(lon) ? lon : null
  };
}

function loadYandexMaps(apiKey) {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Yandex Maps can be loaded only in browser'));
  }

  if (window.ymaps) {
    return new Promise((resolve) => {
      window.ymaps.ready(() => resolve(window.ymaps));
    });
  }

  if (mapSdkPromise) {
    return mapSdkPromise;
  }

  mapSdkPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(MAP_SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', () => {
        if (!window.ymaps) {
          reject(new Error('Yandex Maps did not initialize'));
          return;
        }
        window.ymaps.ready(() => resolve(window.ymaps));
      });
      existing.addEventListener('error', () => reject(new Error('Failed to load Yandex Maps script')));
      return;
    }

    const script = document.createElement('script');
    script.id = MAP_SCRIPT_ID;
    const keyParam = apiKey ? `&apikey=${encodeURIComponent(apiKey)}` : '';
    script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU${keyParam}`;
    script.async = true;
    script.onload = () => {
      if (!window.ymaps) {
        reject(new Error('Yandex Maps did not initialize'));
        return;
      }
      window.ymaps.ready(() => resolve(window.ymaps));
    };
    script.onerror = () => reject(new Error('Failed to load Yandex Maps script'));
    document.head.appendChild(script);
  });

  return mapSdkPromise;
}

function geocodeWithYandex(ymapsApi, coords, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      ymapsApi.geocode(coords, options).then(resolve, reject);
    } catch (error) {
      reject(error);
    }
  });
}

function extractCityFromGeoObject(geoObject) {
  if (!geoObject) return '';
  const metadata = geoObject.properties?.get?.('metaDataProperty.GeocoderMetaData.Address.Components') || [];
  const city =
    metadata.find((item) => item.kind === 'locality')?.name
    || metadata.find((item) => item.kind === 'province')?.name
    || metadata.find((item) => item.kind === 'area')?.name
    || '';
  if (city) return city;
  return geoObject.getLocalities?.()?.[0]
    || geoObject.getAdministrativeAreas?.()?.[0]
    || '';
}

async function reverseGeocodeCity(ymapsApi, latitude, longitude) {
  if (!ymapsApi || typeof ymapsApi.geocode !== 'function') return '';
  try {
    const result = await geocodeWithYandex(ymapsApi, [latitude, longitude], { kind: 'locality', results: 1 });
    const first = result?.geoObjects?.get?.(0);
    const city = extractCityFromGeoObject(first);
    if (city) return city;
  } catch (error) {
  }

  try {
    const fallbackResult = await geocodeWithYandex(ymapsApi, [latitude, longitude], { results: 1 });
    const first = fallbackResult?.geoObjects?.get?.(0);
    return extractCityFromGeoObject(first);
  } catch (error) {
  }
  return '';
}

function PickupMapModal({
  open,
  points,
  selectedPointId,
  searchLabel,
  errorMessage,
  isLoading,
  onRetry,
  onMapCityChange,
  onClose,
  onSelect
}) {
  const apiKey = process.env.REACT_APP_YANDEX_MAPS_API_KEY || '';
  const mapRootRef = useRef(null);
  const mapRef = useRef(null);
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const dragDebounceTimerRef = useRef(null);
  const lastNotifiedCityRef = useRef('');
  const [ymapsApi, setYmapsApi] = useState(null);
  const [mapError, setMapError] = useState('');
  const [searchValue, setSearchValue] = useState(searchLabel || '');
  const [activeUiId, setActiveUiId] = useState('');
  const [userCenter, setUserCenter] = useState(null);
  const [isLocatingUser, setIsLocatingUser] = useState(false);

  const normalizedPoints = useMemo(
    () => (Array.isArray(points) ? points.map((point, index) => normalizePoint(point, index)) : []),
    [points]
  );

  const filteredPoints = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return normalizedPoints;
    return normalizedPoints.filter((point) => {
      const haystack = `${point.name || ''} ${point.address || ''}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [normalizedPoints, searchValue]);

  const activePoint = useMemo(
    () => filteredPoints.find((point) => point.__uiId === activeUiId)
      || normalizedPoints.find((point) => point.__uiId === activeUiId)
      || filteredPoints[0]
      || normalizedPoints[0]
      || null,
    [activeUiId, filteredPoints, normalizedPoints]
  );

  useEffect(() => {
    if (!open) return;
    setSearchValue(searchLabel || '');
    lastNotifiedCityRef.current = '';
    const selectedByServerId = normalizedPoints.find(
      (point) => point.__hasServerId && point.id === selectedPointId
    );
    setActiveUiId((selectedByServerId || normalizedPoints[0] || {}).__uiId || '');
  }, [open, searchLabel, selectedPointId, normalizedPoints]);

  useEffect(() => {
    if (!open) return;
    loadYandexMaps(apiKey)
      .then((api) => {
        setMapError('');
        setYmapsApi(api);
      })
      .catch((error) => {
        console.error('Failed to load Yandex Maps:', error);
        setMapError('Не удалось загрузить карту. Выберите пункт из списка.');
      });
  }, [open, apiKey]);

  useEffect(() => {
    if (!open) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCenter([position.coords.latitude, position.coords.longitude]);
        setIsLocatingUser(false);
      },
      () => {
        setIsLocatingUser(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }, [open]);

  useEffect(() => {
    if (!open || !ymapsApi || !mapRootRef.current) return;
    if (mapRef.current) return;

    const pointsWithCoords = normalizedPoints.filter(
      (point) => point.__latitude !== null && point.__longitude !== null
    );
    const defaultCenter = pointsWithCoords[0]
      ? [pointsWithCoords[0].__latitude, pointsWithCoords[0].__longitude]
      : userCenter
      ? userCenter
      : [55.751244, 37.618423];

    mapRef.current = new ymapsApi.Map(
      mapRootRef.current,
      {
        center: defaultCenter,
        zoom: pointsWithCoords.length ? 11 : 9,
        controls: ['zoomControl']
      },
      {
        suppressMapOpenBlock: true
      }
    );

    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, [open, ymapsApi, normalizedPoints, userCenter]);

  useEffect(() => {
    if (!open || !ymapsApi || !mapRef.current || typeof onMapCityChange !== 'function') return undefined;

    const map = mapRef.current;
    const handleActionEnd = () => {
      const center = map.getCenter?.();
      if (!Array.isArray(center) || center.length < 2) return;
      const [latitude, longitude] = center;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

      if (dragDebounceTimerRef.current) {
        clearTimeout(dragDebounceTimerRef.current);
      }

      dragDebounceTimerRef.current = setTimeout(async () => {
        try {
          const city = (await reverseGeocodeCity(ymapsApi, latitude, longitude)).trim();
          const fallbackCoords = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          const lookupToken = city || fallbackCoords;
          const cityToken = lookupToken.toLowerCase();
          if (lastNotifiedCityRef.current === cityToken) return;
          lastNotifiedCityRef.current = cityToken;
          onMapCityChange(lookupToken);
        } catch (error) {
          console.warn('Failed to resolve city after map drag:', error);
        }
      }, 450);
    };

    map.events.add('actionend', handleActionEnd);
    return () => {
      map.events.remove('actionend', handleActionEnd);
      if (dragDebounceTimerRef.current) {
        clearTimeout(dragDebounceTimerRef.current);
        dragDebounceTimerRef.current = null;
      }
    };
  }, [open, ymapsApi, onMapCityChange]);

  useEffect(() => {
    if (!open || !ymapsApi || !mapRef.current) return;

    const map = mapRef.current;
    map.geoObjects.removeAll();

    const clusterer = new ymapsApi.Clusterer({
      preset: 'islands#invertedVioletClusterIcons',
      groupByCoordinates: false,
      clusterDisableClickZoom: false
    });

    const markers = [];
    filteredPoints.forEach((point) => {
      if (point.__latitude === null || point.__longitude === null) return;
      const isActive = activePoint && activePoint.__uiId === point.__uiId;
      const marker = new ymapsApi.Placemark(
        [point.__latitude, point.__longitude],
        {
          hintContent: point.name || 'Пункт выдачи',
          balloonContent: `${point.name || 'Пункт выдачи'}<br/>${point.address || ''}`
        },
        {
          preset: isActive ? 'islands#redDotIcon' : 'islands#darkBlueCircleDotIcon'
        }
      );
      marker.events.add('click', () => {
        setActiveUiId(point.__uiId);
      });
      markers.push(marker);
    });

    clusterer.add(markers);
    map.geoObjects.add(clusterer);

    if (activePoint && activePoint.__latitude !== null && activePoint.__longitude !== null) {
      map.setCenter([activePoint.__latitude, activePoint.__longitude], 13, { duration: 250 });
    } else if (markers.length) {
      map.setBounds(clusterer.getBounds(), { checkZoomRange: true, zoomMargin: 28 });
    } else if (userCenter) {
      map.setCenter(userCenter, 11, { duration: 250 });
    }
  }, [open, ymapsApi, filteredPoints, activePoint, userCenter]);

  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open || typeof window === 'undefined') return undefined;
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    if (closeButtonRef.current && typeof closeButtonRef.current.focus === 'function') {
      closeButtonRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open || typeof window === 'undefined') return undefined;
    const handleTabKey = (event) => {
      if (event.key !== 'Tab') return;
      const root = dialogRef.current;
      if (!root) return;
      const focusable = root.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleTabKey);
    return () => window.removeEventListener('keydown', handleTabKey);
  }, [open]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  const canConfirm = Boolean(activePoint && activePoint.__hasServerId);

  return createPortal(
    <div className="fixed inset-0 z-[120] flex bg-black/45 backdrop-blur-[2px]">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Закрыть выбор пункта выдачи"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pickup-map-modal-title"
        aria-describedby="pickup-map-modal-description"
        className="relative z-[121] m-auto h-[min(92vh,980px)] w-[min(96vw,1500px)] overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_30px_80px_rgba(24,24,24,0.32)]"
      >
        <div className="grid h-full lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="relative bg-sand/20">
            {mapError ? (
              <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted">
                {mapError}
              </div>
            ) : (
              <div ref={mapRootRef} className="h-full w-full" />
            )}
          </div>

          <aside className="flex h-full flex-col border-l border-ink/10 bg-white/95">
            <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
              <div>
                <h3 id="pickup-map-modal-title" className="text-2xl font-semibold">Пункты выдачи</h3>
                <p id="pickup-map-modal-description" className="mt-1 text-xs text-muted">
                  Выберите удобную точку на карте или из списка.
                </p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                className="button-ghost !h-11 !w-11 !rounded-full !px-0"
                onClick={onClose}
                aria-label="Закрыть окно выбора пункта выдачи"
              >
                ✕
              </button>
            </div>

            <div className="px-5 pt-4 pb-3">
              <label className="sr-only" htmlFor="pickup-map-search">Поиск пункта выдачи</label>
              <input
                id="pickup-map-search"
                type="text"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Поиск по адресу или названию"
                className="w-full"
              />
              {isLocatingUser && (
                <div className="mt-2 text-xs text-muted">Определяем ваш город…</div>
              )}
            </div>

            {errorMessage && (
              <div className="mx-5 mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {errorMessage}
                {onRetry && (
                  <button
                    type="button"
                    className="button-ghost ml-2 !px-2 !py-1 text-xs"
                    onClick={onRetry}
                    disabled={Boolean(isLoading)}
                  >
                    {isLoading ? 'Обновляем…' : 'Повторить'}
                  </button>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-2 pb-3">
              {filteredPoints.length ? (
                filteredPoints.map((point) => {
                  const isActive = activePoint && activePoint.__uiId === point.__uiId;
                  return (
                    <button
                      type="button"
                      key={point.__uiId}
                      onClick={() => setActiveUiId(point.__uiId)}
                      aria-pressed={isActive}
                      className={`mx-3 mb-2 block w-[calc(100%-1.5rem)] rounded-2xl border px-4 py-3 text-left transition ${
                        isActive
                          ? 'border-primary/35 bg-primary/10 shadow-[0_16px_24px_rgba(182,91,74,0.16)]'
                          : 'border-ink/10 bg-white hover:border-primary/25 hover:bg-secondary/35'
                      }`}
                    >
                      <div className="text-sm font-semibold text-ink">{point.name || 'Пункт выдачи'}</div>
                      <div className="mt-1 text-xs text-muted">{point.address || 'Адрес уточняется'}</div>
                    </button>
                  );
                })
              ) : (
                <div className="px-6 py-10 text-sm text-muted">
                  {isLoading
                    ? 'Загружаем пункты выдачи…'
                    : 'Ничего не найдено. Попробуйте изменить город или сбросить поиск.'}
                </div>
              )}
            </div>

            <div className="border-t border-ink/10 bg-white px-5 py-4">
              <div className="mb-3 rounded-2xl border border-ink/10 bg-secondary/40 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.16em] text-muted">Выбранный пункт</div>
                <div className="mt-1 text-sm font-semibold">{activePoint?.name || 'Не выбран'}</div>
                <div className="mt-1 text-xs text-muted">{activePoint?.address || 'Выберите пункт на карте или в списке'}</div>
                {!canConfirm && activePoint && (
                  <div className="mt-2 text-xs text-red-600">
                    Этот пункт нельзя выбрать: отсутствует идентификатор точки.
                  </div>
                )}
              </div>
              <button
                type="button"
                className="button w-full"
                disabled={!canConfirm}
                onClick={() => {
                  if (!activePoint || !activePoint.__hasServerId) return;
                  onSelect(activePoint);
                }}
              >
                Выбрать этот пункт
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default PickupMapModal;
