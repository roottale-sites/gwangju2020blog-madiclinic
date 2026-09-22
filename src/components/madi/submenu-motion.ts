/** jQuery slideDown/slideUp('fast')처럼 높이와 상하 여백을 200ms 동안 함께 움직인다. */
export function createSubmenuMotion() {
  const running = new Map<HTMLElement, { animation: Animation; opening: boolean }>();
  const properties = ['height', 'paddingTop', 'paddingBottom', 'marginTop', 'marginBottom'] as const;

  function dimensions(element: HTMLElement) {
    const style = getComputedStyle(element);
    return Object.fromEntries(properties.map((property) => [property, style[property]]));
  }

  function cancel(element: HTMLElement) {
    const previous = running.get(element);
    if (!previous) return;
    previous.animation.onfinish = null;
    previous.animation.cancel();
    running.delete(element);
    element.style.overflow = '';
  }

  function slide(element: HTMLElement, opening: boolean, instant = false) {
    const previous = running.get(element);
    const hidden = getComputedStyle(element).display === 'none';
    if (!instant && (previous?.opening === opening || (!previous && hidden === !opening))) return;

    // 중단된 애니메이션의 실제 화면값에서 이어 간다. scrollHeight는 여백을 포함하므로 쓰지 않는다.
    const zero = Object.fromEntries(properties.map((property) => [property, '0px']));
    const from = hidden ? zero : dimensions(element);
    cancel(element);
    if (instant) {
      element.style.display = opening ? 'block' : 'none';
      return;
    }

    element.style.display = 'block';
    const to = opening ? dimensions(element) : zero;
    element.style.overflow = 'hidden';
    const animation = element.animate([from, to], {
      duration: 200,
      easing: 'cubic-bezier(0.37, 0, 0.63, 1)',
      fill: 'both',
    });
    running.set(element, { animation, opening });
    animation.onfinish = () => {
      if (running.get(element)?.animation !== animation) return;
      element.style.display = opening ? 'block' : 'none';
      cancel(element);
    };
  }

  return {
    slideDown: (element: HTMLElement) => slide(element, true),
    slideUp: (element: HTMLElement, { instant = false } = {}) => slide(element, false, instant),
    dispose: () => {
      for (const element of running.keys()) {
        cancel(element);
        element.style.display = 'none';
      }
    },
  };
}
