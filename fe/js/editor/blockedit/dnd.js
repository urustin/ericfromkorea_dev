// 블록 드래그 정렬 — ⠿ 핸들을 잡아 위/아래로 이동 (Notion 방식).
export function enableDnd(surface) {
  let dragging = null;

  surface.addEventListener('dragstart', (e) => {
    const h = e.target.closest && e.target.closest('.ne-handle');
    if (!h) return e.preventDefault();
    dragging = h.closest('.ne-block');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
    dragging.classList.add('ne-dragging');
  });

  surface.addEventListener('dragover', (e) => {
    if (!dragging) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const over = e.target.closest && e.target.closest('.ne-block');
    // 자기 자신 또는 자기 하위로는 이동 금지
    if (!over || over === dragging || dragging.contains(over)) return;
    const r = over.getBoundingClientRect();
    if (e.clientY < r.top + r.height / 2) over.before(dragging);
    else over.after(dragging);
  });

  surface.addEventListener('drop', (e) => e.preventDefault());
  surface.addEventListener('dragend', () => {
    if (dragging) dragging.classList.remove('ne-dragging');
    dragging = null;
  });
}
