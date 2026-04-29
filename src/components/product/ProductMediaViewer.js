import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_DISTANCE = 42;
const TAP_MOVE_TOLERANCE = 12;
const SWIPE_DISTANCE = 56;

const INITIAL_TRANSFORM = {
  scale: 1,
  x: 0,
  y: 0,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getPointerPoint(event) {
  return {
    x: event.clientX,
    y: event.clientY,
  };
}

function getDistance(first, second) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function getMidpoint(first, second) {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  };
}

function preventDefault(event) {
  if (event.cancelable) {
    event.preventDefault();
  }
}

function ProductMediaViewer({
  items = [],
  activeIndex = 0,
  open = false,
  productName = '',
  variantNameById = {},
  onSelect,
  onClose,
}) {
  const overlayRef = useRef(null);
  const stageRef = useRef(null);
  const imageRef = useRef(null);
  const lastFocusedRef = useRef(null);
  const pointersRef = useRef(new Map());
  const gestureRef = useRef(null);
  const lastTapRef = useRef(null);
  const transformRef = useRef(INITIAL_TRANSFORM);

  const [transform, setTransform] = useState(INITIAL_TRANSFORM);
  const [isInteracting, setIsInteracting] = useState(false);

  const mediaItems = useMemo(
    () => (Array.isArray(items) ? items.filter((item) => item?.url) : []),
    [items]
  );
  const itemCount = mediaItems.length;
  const selectedIndex = itemCount > 0 ? clamp(activeIndex, 0, itemCount - 1) : 0;
  const activeItem = mediaItems[selectedIndex] || null;
  const activeVariantName =
    activeItem?.variantId ? variantNameById[activeItem.variantId] || activeItem.variantId : '';

  const clampTransform = useCallback((nextTransform) => {
    const nextScale = clamp(Number(nextTransform.scale) || MIN_SCALE, MIN_SCALE, MAX_SCALE);

    if (nextScale <= MIN_SCALE + 0.01) {
      return INITIAL_TRANSFORM;
    }

    const stage = stageRef.current;
    const image = imageRef.current;

    if (!stage || !image) {
      return {
        scale: nextScale,
        x: Number(nextTransform.x) || 0,
        y: Number(nextTransform.y) || 0,
      };
    }

    const baseWidth = image.offsetWidth || image.naturalWidth || stage.clientWidth;
    const baseHeight = image.offsetHeight || image.naturalHeight || stage.clientHeight;
    const stageWidth = stage.clientWidth || window.innerWidth;
    const stageHeight = stage.clientHeight || window.innerHeight;
    const maxX = Math.max(0, (baseWidth * nextScale - stageWidth) / 2);
    const maxY = Math.max(0, (baseHeight * nextScale - stageHeight) / 2);

    return {
      scale: nextScale,
      x: clamp(Number(nextTransform.x) || 0, -maxX, maxX),
      y: clamp(Number(nextTransform.y) || 0, -maxY, maxY),
    };
  }, []);

  const commitTransform = useCallback(
    (nextTransform) => {
      const clamped = clampTransform(nextTransform);
      transformRef.current = clamped;
      setTransform(clamped);
    },
    [clampTransform]
  );

  const resetTransform = useCallback(() => {
    pointersRef.current.clear();
    gestureRef.current = null;
    lastTapRef.current = null;
    transformRef.current = INITIAL_TRANSFORM;
    setTransform(INITIAL_TRANSFORM);
  }, []);

  const zoomAtPoint = useCallback(
    (clientX, clientY, nextScale, sourceTransform = transformRef.current) => {
      const stage = stageRef.current;

      if (!stage) {
        commitTransform({
          ...sourceTransform,
          scale: nextScale,
        });
        return;
      }

      const rect = stage.getBoundingClientRect();
      const pointX = clientX - rect.left - rect.width / 2;
      const pointY = clientY - rect.top - rect.height / 2;
      const currentScale = sourceTransform.scale || MIN_SCALE;
      const scaleRatio = nextScale / currentScale;

      commitTransform({
        scale: nextScale,
        x: pointX - (pointX - sourceTransform.x) * scaleRatio,
        y: pointY - (pointY - sourceTransform.y) * scaleRatio,
      });
    },
    [commitTransform]
  );

  const zoomFromCenter = useCallback(
    (scaleMultiplier) => {
      const stage = stageRef.current;
      const rect = stage?.getBoundingClientRect();
      const currentTransform = transformRef.current;
      const nextScale = clamp(
        currentTransform.scale * scaleMultiplier,
        MIN_SCALE,
        MAX_SCALE
      );

      if (!rect) {
        commitTransform({
          ...currentTransform,
          scale: nextScale,
        });
        return;
      }

      zoomAtPoint(rect.left + rect.width / 2, rect.top + rect.height / 2, nextScale);
    },
    [commitTransform, zoomAtPoint]
  );

  const selectByOffset = useCallback(
    (offset) => {
      if (itemCount <= 1 || typeof onSelect !== 'function') return;
      onSelect((selectedIndex + offset + itemCount) % itemCount);
    },
    [itemCount, onSelect, selectedIndex]
  );

  useEffect(() => {
    if (!open) {
      resetTransform();
      return;
    }

    resetTransform();
  }, [open, resetTransform, selectedIndex]);

  useEffect(() => {
    if (!open || typeof document === 'undefined') {
      return undefined;
    }

    lastFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const { body, documentElement } = document;
    const scrollX = window.scrollX || 0;
    const scrollY = window.scrollY || 0;
    const previousBodyStyle = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      touchAction: body.style.touchAction,
      overscrollBehavior: body.style.overscrollBehavior,
    };
    const previousDocumentStyle = {
      overflow: documentElement.style.overflow,
      touchAction: documentElement.style.touchAction,
      overscrollBehavior: documentElement.style.overscrollBehavior,
    };

    documentElement.style.overflow = 'hidden';
    documentElement.style.touchAction = 'none';
    documentElement.style.overscrollBehavior = 'none';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = `-${scrollX}px`;
    body.style.right = '0';
    body.style.width = '100%';
    body.style.touchAction = 'none';
    body.style.overscrollBehavior = 'none';

    const focusFrame = window.requestAnimationFrame(() => {
      overlayRef.current?.focus({ preventScroll: true });
    });

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        selectByOffset(1);
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        selectByOffset(-1);
        return;
      }

      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        zoomFromCenter(1.25);
        return;
      }

      if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        zoomFromCenter(0.8);
        return;
      }

      if (event.key === '0') {
        event.preventDefault();
        resetTransform();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener('keydown', handleKeyDown);
      documentElement.style.overflow = previousDocumentStyle.overflow;
      documentElement.style.touchAction = previousDocumentStyle.touchAction;
      documentElement.style.overscrollBehavior = previousDocumentStyle.overscrollBehavior;
      body.style.overflow = previousBodyStyle.overflow;
      body.style.position = previousBodyStyle.position;
      body.style.top = previousBodyStyle.top;
      body.style.left = previousBodyStyle.left;
      body.style.right = previousBodyStyle.right;
      body.style.width = previousBodyStyle.width;
      body.style.touchAction = previousBodyStyle.touchAction;
      body.style.overscrollBehavior = previousBodyStyle.overscrollBehavior;
      window.scrollTo(scrollX, scrollY);

      if (lastFocusedRef.current instanceof HTMLElement && lastFocusedRef.current.isConnected) {
        window.requestAnimationFrame(() => {
          lastFocusedRef.current?.focus({ preventScroll: true });
        });
      }
    };
  }, [open, onClose, resetTransform, selectByOffset, zoomFromCenter]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const overlay = overlayRef.current;
    if (!overlay) {
      return undefined;
    }

    const options = { passive: false };
    overlay.addEventListener('touchstart', preventDefault, options);
    overlay.addEventListener('touchmove', preventDefault, options);
    overlay.addEventListener('gesturestart', preventDefault, options);
    overlay.addEventListener('gesturechange', preventDefault, options);
    overlay.addEventListener('gestureend', preventDefault, options);

    return () => {
      overlay.removeEventListener('touchstart', preventDefault, options);
      overlay.removeEventListener('touchmove', preventDefault, options);
      overlay.removeEventListener('gesturestart', preventDefault, options);
      overlay.removeEventListener('gesturechange', preventDefault, options);
      overlay.removeEventListener('gestureend', preventDefault, options);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleResize = () => {
      window.requestAnimationFrame(() => {
        commitTransform(transformRef.current);
      });
    };

    window.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, [commitTransform, open]);

  const handlePointerDown = useCallback((event) => {
    if (!activeItem) return;

    preventDefault(event);
    setIsInteracting(true);

    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // Synthetic pointer events in tests can miss the browser's active-pointer bookkeeping.
    }

    const point = getPointerPoint(event);
    pointersRef.current.set(event.pointerId, point);

    if (pointersRef.current.size >= 2) {
      const [first, second] = Array.from(pointersRef.current.values());
      gestureRef.current = {
        type: 'pinch',
        startDistance: Math.max(1, getDistance(first, second)),
        startTransform: transformRef.current,
      };
      return;
    }

    gestureRef.current = {
      type: 'single',
      start: point,
      startTransform: transformRef.current,
      startedAt: Date.now(),
    };
  }, [activeItem]);

  const handlePointerMove = useCallback(
    (event) => {
      if (!pointersRef.current.has(event.pointerId)) return;

      preventDefault(event);
      const point = getPointerPoint(event);
      pointersRef.current.set(event.pointerId, point);

      if (pointersRef.current.size >= 2) {
        const [first, second] = Array.from(pointersRef.current.values());
        const gesture = gestureRef.current;
        const startTransform = gesture?.startTransform || transformRef.current;
        const startDistance =
          gesture?.type === 'pinch'
            ? Math.max(1, gesture.startDistance)
            : Math.max(1, getDistance(first, second));
        const nextScale = clamp(
          startTransform.scale * (getDistance(first, second) / startDistance),
          MIN_SCALE,
          MAX_SCALE
        );
        const midpoint = getMidpoint(first, second);

        zoomAtPoint(midpoint.x, midpoint.y, nextScale, startTransform);
        return;
      }

      const gesture = gestureRef.current;
      if (gesture?.type !== 'single') return;

      const currentTransform = transformRef.current;
      if (currentTransform.scale <= MIN_SCALE + 0.01) return;

      commitTransform({
        scale: currentTransform.scale,
        x: gesture.startTransform.x + point.x - gesture.start.x,
        y: gesture.startTransform.y + point.y - gesture.start.y,
      });
    },
    [commitTransform, zoomAtPoint]
  );

  const handlePointerEnd = useCallback(
    (event) => {
      if (!pointersRef.current.has(event.pointerId)) return;

      preventDefault(event);
      const point = getPointerPoint(event);
      const gesture = gestureRef.current;
      const hadMultiplePointers = pointersRef.current.size >= 2;
      pointersRef.current.delete(event.pointerId);

      if (hadMultiplePointers && pointersRef.current.size === 1) {
        const [remainingPoint] = Array.from(pointersRef.current.values());
        gestureRef.current = {
          type: 'single',
          start: remainingPoint,
          startTransform: transformRef.current,
          startedAt: Date.now(),
        };
        return;
      }

      if (pointersRef.current.size > 0) {
        return;
      }

      setIsInteracting(false);

      if (gesture?.type !== 'single') {
        gestureRef.current = null;
        return;
      }

      const deltaX = point.x - gesture.start.x;
      const deltaY = point.y - gesture.start.y;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      const currentScale = transformRef.current.scale;

      if (
        currentScale <= MIN_SCALE + 0.01 &&
        itemCount > 1 &&
        absX >= SWIPE_DISTANCE &&
        absX > absY * 1.15
      ) {
        selectByOffset(deltaX < 0 ? 1 : -1);
        gestureRef.current = null;
        lastTapRef.current = null;
        return;
      }

      if (absX <= TAP_MOVE_TOLERANCE && absY <= TAP_MOVE_TOLERANCE) {
        const now = Date.now();
        const lastTap = lastTapRef.current;

        if (
          lastTap &&
          now - lastTap.time <= DOUBLE_TAP_MS &&
          getDistance(lastTap.point, point) <= DOUBLE_TAP_DISTANCE
        ) {
          if (currentScale > MIN_SCALE + 0.2) {
            resetTransform();
          } else {
            zoomAtPoint(point.x, point.y, 2.4);
          }
          lastTapRef.current = null;
          gestureRef.current = null;
          return;
        }

        lastTapRef.current = {
          time: now,
          point,
        };
      }

      gestureRef.current = null;
    },
    [itemCount, resetTransform, selectByOffset, zoomAtPoint]
  );

  const handleWheel = useCallback(
    (event) => {
      if (!activeItem) return;

      preventDefault(event);
      const currentTransform = transformRef.current;
      const multiplier = Math.exp(-event.deltaY * 0.002);
      const nextScale = clamp(currentTransform.scale * multiplier, MIN_SCALE, MAX_SCALE);
      zoomAtPoint(event.clientX, event.clientY, nextScale);
    },
    [activeItem, zoomAtPoint]
  );

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      ref={overlayRef}
      data-testid="product-media-viewer"
      className="product-media-viewer"
      role="dialog"
      aria-modal="true"
      aria-label="Просмотр фотографий товара"
      tabIndex={-1}
      onWheel={handleWheel}
    >
      <div
        ref={stageRef}
        data-testid="product-media-stage"
        className={`product-media-viewer__stage ${
          transform.scale > MIN_SCALE + 0.01 ? 'product-media-viewer__stage--zoomed' : ''
        } ${isInteracting ? 'product-media-viewer__stage--interacting' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={(event) => {
          if (event.pointerType === 'mouse' && pointersRef.current.has(event.pointerId)) {
            handlePointerEnd(event);
          }
        }}
      >
        {activeItem ? (
          <img
            ref={imageRef}
            src={activeItem.url}
            alt={activeItem.alt || productName || 'Фото товара'}
            data-testid="product-media-image"
            data-scale={transform.scale.toFixed(2)}
            data-translate-x={Math.round(transform.x)}
            data-translate-y={Math.round(transform.y)}
            className={`product-media-viewer__image ${
              isInteracting ? 'product-media-viewer__image--interacting' : ''
            }`}
            draggable={false}
            style={{
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
            }}
          />
        ) : (
          <div className="product-media-viewer__empty">Изображение недоступно</div>
        )}
      </div>

      <div className="product-media-viewer__topbar">
        <div className="product-media-viewer__caption">
          <span className="product-media-viewer__caption-title">
            {productName || 'Фото товара'}
          </span>
          {activeVariantName ? (
            <span className="product-media-viewer__caption-meta">
              Вариант: {activeVariantName}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          data-testid="product-media-close"
          className="product-media-viewer__button"
          onClick={onClose}
          aria-label="Закрыть просмотр изображения"
        >
          ×
        </button>
      </div>

      {itemCount > 1 ? (
        <>
          <button
            type="button"
            className="product-media-viewer__nav product-media-viewer__nav--prev"
            onClick={() => selectByOffset(-1)}
            aria-label="Предыдущее изображение"
          >
            ‹
          </button>
          <button
            type="button"
            className="product-media-viewer__nav product-media-viewer__nav--next"
            onClick={() => selectByOffset(1)}
            aria-label="Следующее изображение"
          >
            ›
          </button>
        </>
      ) : null}

      <div className="product-media-viewer__bottombar">
        <p data-testid="product-media-counter" className="product-media-viewer__counter">
          {selectedIndex + 1} / {Math.max(1, itemCount)}
        </p>
        <div className="product-media-viewer__zoom-controls" aria-label="Управление масштабом">
          <button
            type="button"
            className="product-media-viewer__button"
            onClick={() => zoomFromCenter(0.8)}
            aria-label="Уменьшить изображение"
          >
            −
          </button>
          <button
            type="button"
            data-testid="product-media-reset"
            className="product-media-viewer__reset"
            onClick={resetTransform}
            aria-label="Сбросить масштаб"
          >
            1:1
          </button>
          <button
            type="button"
            className="product-media-viewer__button"
            onClick={() => zoomFromCenter(1.25)}
            aria-label="Увеличить изображение"
          >
            +
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ProductMediaViewer;
