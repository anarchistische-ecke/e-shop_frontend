import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_DISTANCE = 42;
const TAP_MOVE_TOLERANCE = 12;
const SWIPE_DISTANCE = 56;
const VERTICAL_DISMISS_DISTANCE = 72;
const INITIAL_CONTROLS_HIDE_MS = 3000;
const REVEALED_CONTROLS_HIDE_MS = 10000;
const DISMISS_ANIMATION_MS = 220;
const SLIDE_ANIMATION_MS = 680;

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
  const controlsTimerRef = useRef(null);
  const closeTimerRef = useRef(null);
  const slideTimersRef = useRef(new Set());
  const slideRequestDirectionRef = useRef('');
  const latestTransitionKeyRef = useRef('');
  const transitionCounterRef = useRef(0);
  const previousActiveRef = useRef({ item: null, index: 0 });

  const [transform, setTransform] = useState(INITIAL_TRANSFORM);
  const [isInteracting, setIsInteracting] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [swipeOffset, setSwipeOffset] = useState({ x: 0, y: 0 });
  const [isDismissing, setIsDismissing] = useState(false);
  const [slideDirection, setSlideDirection] = useState('');
  const [transitionLayers, setTransitionLayers] = useState([]);

  const mediaItems = useMemo(
    () => (Array.isArray(items) ? items.filter((item) => item?.url) : []),
    [items]
  );
  const itemCount = mediaItems.length;
  const selectedIndex = itemCount > 0 ? clamp(activeIndex, 0, itemCount - 1) : 0;
  const activeItem = mediaItems[selectedIndex] || null;
  const activeVariantName =
    activeItem?.variantId ? variantNameById[activeItem.variantId] || activeItem.variantId : '';

  const clearControlsTimer = useCallback(() => {
    if (controlsTimerRef.current && typeof window !== 'undefined') {
      window.clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = null;
    }
  }, []);

  const clearSlideTimers = useCallback(() => {
    if (typeof window === 'undefined') return;

    slideTimersRef.current.forEach((timerId) => {
      window.clearTimeout(timerId);
    });
    slideTimersRef.current.clear();
  }, []);

  const revealControls = useCallback(
    (durationMs = REVEALED_CONTROLS_HIDE_MS) => {
      setControlsVisible(true);
      clearControlsTimer();

      if (!open || typeof window === 'undefined') return;

      controlsTimerRef.current = window.setTimeout(() => {
        setControlsVisible(false);
        controlsTimerRef.current = null;
      }, durationMs);
    },
    [clearControlsTimer, open]
  );

  const isPointInsideImage = useCallback((point) => {
    const image = imageRef.current;
    if (!image) return false;

    const rect = image.getBoundingClientRect();
    return (
      point.x >= rect.left &&
      point.x <= rect.right &&
      point.y >= rect.top &&
      point.y <= rect.bottom
    );
  }, []);

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

      slideRequestDirectionRef.current = offset > 0 ? 'next' : 'prev';
      revealControls(REVEALED_CONTROLS_HIDE_MS);
      onSelect((selectedIndex + offset + itemCount) % itemCount);
    },
    [itemCount, onSelect, revealControls, selectedIndex]
  );

  const startDismiss = useCallback(
    (directionY = 1) => {
      if (isDismissing || typeof window === 'undefined') return;

      const stageHeight = stageRef.current?.clientHeight || window.innerHeight || 700;
      const normalizedDirection = directionY < 0 ? -1 : 1;
      setControlsVisible(false);
      clearControlsTimer();
      setIsDismissing(true);
      setIsInteracting(false);
      setSwipeOffset({
        x: 0,
        y: normalizedDirection * Math.max(stageHeight * 0.78, VERTICAL_DISMISS_DISTANCE * 2),
      });

      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }

      closeTimerRef.current = window.setTimeout(() => {
        closeTimerRef.current = null;
        onClose?.();
      }, DISMISS_ANIMATION_MS);
    },
    [clearControlsTimer, isDismissing, onClose]
  );

  useEffect(() => {
    if (!open) {
      resetTransform();
      setSwipeOffset({ x: 0, y: 0 });
      setIsDismissing(false);
      setIsInteracting(false);
      setSlideDirection('');
      setTransitionLayers([]);
      previousActiveRef.current = { item: null, index: 0 };
      slideRequestDirectionRef.current = '';
      latestTransitionKeyRef.current = '';
      transitionCounterRef.current = 0;
      clearControlsTimer();
      clearSlideTimers();
      return;
    }

    resetTransform();
    setSwipeOffset({ x: 0, y: 0 });
    setIsDismissing(false);
    setIsInteracting(false);
  }, [clearControlsTimer, clearSlideTimers, open, resetTransform, selectedIndex]);

  useEffect(() => {
    if (!open) return undefined;

    const previous = previousActiveRef.current;
    if (previous.item && previous.index !== selectedIndex) {
      const requestedDirection = slideRequestDirectionRef.current;
      const inferredDirection =
        requestedDirection ||
        (selectedIndex > previous.index || (previous.index === itemCount - 1 && selectedIndex === 0)
          ? 'next'
          : 'prev');
      transitionCounterRef.current += 1;
      const transitionKey = `${previous.item.id || previous.item.url || previous.index}-${transitionCounterRef.current}`;
      latestTransitionKeyRef.current = transitionKey;

      setTransitionLayers((currentLayers) => [
        ...currentLayers,
        {
          item: previous.item,
          index: previous.index,
          direction: inferredDirection,
          key: transitionKey,
        },
      ]);
      setSlideDirection(inferredDirection);

      const timerId = window.setTimeout(() => {
        setTransitionLayers((currentLayers) =>
          currentLayers.filter((layer) => layer.key !== transitionKey)
        );
        if (latestTransitionKeyRef.current === transitionKey) {
          latestTransitionKeyRef.current = '';
          setSlideDirection('');
        }
        slideTimersRef.current.delete(timerId);
      }, SLIDE_ANIMATION_MS);

      slideTimersRef.current.add(timerId);
    } else if (!previous.item) {
      setTransitionLayers([]);
      setSlideDirection('');
    }

    previousActiveRef.current = { item: activeItem, index: selectedIndex };
    slideRequestDirectionRef.current = '';
    return undefined;
  }, [activeItem, itemCount, open, selectedIndex]);

  useEffect(() => {
    if (!open) return undefined;
    revealControls(INITIAL_CONTROLS_HIDE_MS);
    return undefined;
  }, [open, revealControls]);

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

    const stage = stageRef.current;
    if (!stage) {
      return undefined;
    }

    const options = { passive: false };
    stage.addEventListener('touchstart', preventDefault, options);
    stage.addEventListener('touchmove', preventDefault, options);
    stage.addEventListener('gesturestart', preventDefault, options);
    stage.addEventListener('gesturechange', preventDefault, options);
    stage.addEventListener('gestureend', preventDefault, options);

    return () => {
      stage.removeEventListener('touchstart', preventDefault, options);
      stage.removeEventListener('touchmove', preventDefault, options);
      stage.removeEventListener('gesturestart', preventDefault, options);
      stage.removeEventListener('gesturechange', preventDefault, options);
      stage.removeEventListener('gestureend', preventDefault, options);
    };
  }, [open]);

  useEffect(() => {
    return () => {
      clearControlsTimer();
      clearSlideTimers();
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, [clearControlsTimer, clearSlideTimers]);

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

  const handlePointerDown = useCallback(
    (event) => {
      if (!activeItem || isDismissing) return;

      preventDefault(event);

      try {
        event.currentTarget.setPointerCapture?.(event.pointerId);
      } catch {
        // Synthetic pointer events in tests can miss the browser's active-pointer bookkeeping.
      }

      const point = getPointerPoint(event);
      const startedOnImage = isPointInsideImage(point);
      pointersRef.current.set(event.pointerId, {
        ...point,
        startedOnImage,
      });
      setIsInteracting(startedOnImage);

      if (pointersRef.current.size >= 2) {
        const points = Array.from(pointersRef.current.values());
        const [first, second] = points;
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
        startedOnImage,
        startTransform: transformRef.current,
        startedAt: Date.now(),
      };
    },
    [activeItem, isDismissing, isPointInsideImage]
  );

  const handlePointerMove = useCallback(
    (event) => {
      if (!pointersRef.current.has(event.pointerId)) return;

      preventDefault(event);
      const point = getPointerPoint(event);
      const previousPointer = pointersRef.current.get(event.pointerId);
      pointersRef.current.set(event.pointerId, {
        ...point,
        startedOnImage: previousPointer?.startedOnImage || false,
      });

      if (pointersRef.current.size >= 2) {
        const points = Array.from(pointersRef.current.values());
        const [first, second] = points;
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
      if (currentTransform.scale <= MIN_SCALE + 0.01) {
        const deltaX = point.x - gesture.start.x;
        const deltaY = point.y - gesture.start.y;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        if (absX > 4 || absY > 4) {
          setSwipeOffset(
            absY > absX
              ? { x: 0, y: deltaY }
              : { x: deltaX, y: 0 }
          );
        }
        return;
      }

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
        gestureRef.current = {
          type: 'pinch-end',
        };
        return;
      }

      if (pointersRef.current.size > 0) {
        return;
      }

      setIsInteracting(false);

      if (gesture?.type !== 'single') {
        gestureRef.current = null;
        setSwipeOffset({ x: 0, y: 0 });
        return;
      }

      const deltaX = point.x - gesture.start.x;
      const deltaY = point.y - gesture.start.y;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      const currentScale = transformRef.current.scale;

      if (!gesture.startedOnImage && absX <= TAP_MOVE_TOLERANCE && absY <= TAP_MOVE_TOLERANCE) {
        onClose?.();
        gestureRef.current = null;
        setSwipeOffset({ x: 0, y: 0 });
        return;
      }

      if (
        gesture.startedOnImage &&
        currentScale <= MIN_SCALE + 0.01 &&
        absY >= VERTICAL_DISMISS_DISTANCE &&
        absY > absX * 1.15
      ) {
        startDismiss(deltaY);
        gestureRef.current = null;
        lastTapRef.current = null;
        return;
      }

      if (
        gesture.startedOnImage &&
        currentScale <= MIN_SCALE + 0.01 &&
        itemCount > 1 &&
        absX >= SWIPE_DISTANCE &&
        absX > absY * 1.15
      ) {
        selectByOffset(deltaX < 0 ? 1 : -1);
        gestureRef.current = null;
        lastTapRef.current = null;
        setSwipeOffset({ x: 0, y: 0 });
        return;
      }

      if (gesture.startedOnImage && absX <= TAP_MOVE_TOLERANCE && absY <= TAP_MOVE_TOLERANCE) {
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
          revealControls(REVEALED_CONTROLS_HIDE_MS);
          lastTapRef.current = null;
          gestureRef.current = null;
          setSwipeOffset({ x: 0, y: 0 });
          return;
        }

        if (controlsVisible) {
          clearControlsTimer();
          setControlsVisible(false);
        } else {
          revealControls(REVEALED_CONTROLS_HIDE_MS);
        }

        lastTapRef.current = {
          time: now,
          point,
        };
      }

      gestureRef.current = null;
      setSwipeOffset({ x: 0, y: 0 });
    },
    [
      clearControlsTimer,
      controlsVisible,
      itemCount,
      onClose,
      resetTransform,
      revealControls,
      selectByOffset,
      startDismiss,
      zoomAtPoint,
    ]
  );

  const handleWheel = useCallback(
    (event) => {
      if (!activeItem) return;

      preventDefault(event);
      const currentTransform = transformRef.current;
      const multiplier = Math.exp(-event.deltaY * 0.002);
      const nextScale = clamp(currentTransform.scale * multiplier, MIN_SCALE, MAX_SCALE);
      revealControls(REVEALED_CONTROLS_HIDE_MS);
      zoomAtPoint(event.clientX, event.clientY, nextScale);
    },
    [activeItem, revealControls, zoomAtPoint]
  );

  if (!open || typeof document === 'undefined') {
    return null;
  }

  const renderMediaFrame = ({ item, index, isCurrent = false, direction = '', key }) => {
    const frameClassName = [
      'product-media-viewer__frame',
      isCurrent ? 'product-media-viewer__frame--current' : 'product-media-viewer__frame--previous',
      isCurrent && isInteracting ? 'product-media-viewer__frame--interacting' : '',
      isCurrent && isDismissing ? 'product-media-viewer__frame--dismissing' : '',
      isCurrent && direction ? `product-media-viewer__frame--enter-${direction}` : '',
      !isCurrent && direction ? `product-media-viewer__frame--exit-${direction}` : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        key={key || item.id || item.url || index}
        data-testid={isCurrent ? 'product-media-frame' : 'product-media-previous-frame'}
        data-slide={isCurrent ? slideDirection : direction}
        data-transition-key={!isCurrent ? key : undefined}
        data-swipe-offset-x={isCurrent ? Math.round(swipeOffset.x) : 0}
        data-swipe-offset-y={isCurrent ? Math.round(swipeOffset.y) : 0}
        className={frameClassName}
        style={
          isCurrent
            ? {
                '--swipe-x': `${swipeOffset.x}px`,
                '--swipe-y': `${swipeOffset.y}px`,
              }
            : undefined
        }
      >
        <img
          ref={isCurrent ? imageRef : undefined}
          src={item.url}
          alt={item.alt || productName || 'Фото товара'}
          data-testid={isCurrent ? 'product-media-image' : undefined}
          data-scale={isCurrent ? transform.scale.toFixed(2) : undefined}
          data-translate-x={isCurrent ? Math.round(transform.x) : undefined}
          data-translate-y={isCurrent ? Math.round(transform.y) : undefined}
          className={`product-media-viewer__image ${
            isCurrent && isInteracting ? 'product-media-viewer__image--interacting' : ''
          }`}
          draggable={false}
          style={
            isCurrent
              ? {
                  transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
                }
              : undefined
          }
        />
      </div>
    );
  };

  return createPortal(
    <div
      ref={overlayRef}
      data-testid="product-media-viewer"
      data-controls-visible={controlsVisible ? 'true' : 'false'}
      data-dismissing={isDismissing ? 'true' : 'false'}
      className={`product-media-viewer ${
        controlsVisible ? '' : 'product-media-viewer--controls-hidden'
      } ${isDismissing ? 'product-media-viewer--dismissing' : ''}`}
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
          <>
            {transitionLayers.map((layer) =>
              renderMediaFrame({
                item: layer.item,
                index: layer.index,
                direction: layer.direction,
                key: layer.key,
              })
            )}
            {renderMediaFrame({
              item: activeItem,
              index: selectedIndex,
              isCurrent: true,
              direction: slideDirection,
              key: activeItem.id || activeItem.url || selectedIndex,
            })}
          </>
        ) : (
          <div className="product-media-viewer__empty">Изображение недоступно</div>
        )}
      </div>

      <div className="product-media-viewer__topbar">
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
        <div className="product-media-viewer__caption" data-testid="product-media-caption">
          <span className="product-media-viewer__caption-title">
            {productName || 'Фото товара'}
          </span>
          {activeVariantName ? (
            <span className="product-media-viewer__caption-meta">
              Вариант: {activeVariantName}
            </span>
          ) : null}
          <span data-testid="product-media-counter" className="product-media-viewer__counter">
            {selectedIndex + 1} / {Math.max(1, itemCount)}
          </span>
        </div>
        <div className="product-media-viewer__zoom-controls" aria-label="Управление масштабом">
          <button
            type="button"
            className="product-media-viewer__button"
            onClick={() => {
              revealControls(REVEALED_CONTROLS_HIDE_MS);
              zoomFromCenter(0.8);
            }}
            aria-label="Уменьшить изображение"
          >
            −
          </button>
          <button
            type="button"
            data-testid="product-media-reset"
            className="product-media-viewer__reset"
            onClick={() => {
              revealControls(REVEALED_CONTROLS_HIDE_MS);
              resetTransform();
            }}
            aria-label="Сбросить масштаб"
          >
            1:1
          </button>
          <button
            type="button"
            className="product-media-viewer__button"
            onClick={() => {
              revealControls(REVEALED_CONTROLS_HIDE_MS);
              zoomFromCenter(1.25);
            }}
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
