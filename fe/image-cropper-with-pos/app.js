// 이미지 크로퍼 로직: 업로드 → 드래그 선택 → 크롭 → 좌표 기반 파일명으로 다운로드
(() => {
  // 주요 DOM 요소 캐싱
  const fileInput = document.getElementById('file');
  const drop = document.getElementById('drop');
  const stage = document.getElementById('stage');
  const box = document.getElementById('canvasBox');
  const img = document.getElementById('img');
  const sel = document.getElementById('sel');
  const info = document.getElementById('info');
  const dlBtn = document.getElementById('download');
  const resetBtn = document.getElementById('reset');

  let baseName = 'image';   // 확장자 제거한 업로드 파일명
  let drag = null;          // 드래그 상태 {x,y}
  let rect = null;          // 표시 좌표 기준 선택 영역 {x,y,w,h}

  // --- 파일 로드 ---------------------------------------------------------
  // 업로드한 파일을 화면에 표시한다
  function loadFile(f) {
    if (!f || !f.type.startsWith('image/')) return;
    baseName = f.name.replace(/\.[^.]+$/, '') || 'image';
    const url = URL.createObjectURL(f);
    img.onload = () => {
      URL.revokeObjectURL(url);
      stage.hidden = false;
      drop.hidden = true;
      resetSelection();
    };
    img.src = url;
  }

  fileInput.addEventListener('change', (e) => loadFile(e.target.files[0]));

  // 드래그&드롭 업로드
  ['dragenter', 'dragover'].forEach((ev) =>
    drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((ev) =>
    drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', (e) => loadFile(e.dataTransfer.files[0]));

  // --- 선택 영역 드래그 --------------------------------------------------
  // 포인터 좌표를 이미지 박스 기준 좌표로 변환 (경계 안으로 제한)
  function localPos(e) {
    const r = box.getBoundingClientRect();
    return {
      x: Math.min(Math.max(e.clientX - r.left, 0), r.width),
      y: Math.min(Math.max(e.clientY - r.top, 0), r.height),
    };
  }

  box.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    box.setPointerCapture(e.pointerId);
    drag = localPos(e);
    sel.hidden = false;
  });

  box.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = localPos(e);
    rect = {
      x: Math.min(drag.x, p.x), y: Math.min(drag.y, p.y),
      w: Math.abs(p.x - drag.x), h: Math.abs(p.y - drag.y),
    };
    drawSelection();
  });

  box.addEventListener('pointerup', () => {
    drag = null;
    // 너무 작은 선택은 무효 처리
    if (!rect || rect.w < 3 || rect.h < 3) return resetSelection();
    dlBtn.disabled = false;
  });

  // 선택 사각형을 화면에 그리고 정보를 갱신한다
  function drawSelection() {
    if (!rect) return;
    Object.assign(sel.style, {
      left: rect.x + 'px', top: rect.y + 'px',
      width: rect.w + 'px', height: rect.h + 'px',
    });
    const c = toNatural();
    info.textContent =
      `pos (${c.x}, ${c.y}) · 크기 ${c.w}×${c.h}px`;
  }

  // 표시 좌표 → 원본 이미지 픽셀 좌표로 변환 (좌상단 기준)
  function toNatural() {
    const sx = img.naturalWidth / img.clientWidth;
    const sy = img.naturalHeight / img.clientHeight;
    return {
      x: Math.round(rect.x * sx), y: Math.round(rect.y * sy),
      w: Math.round(rect.w * sx), h: Math.round(rect.h * sy),
    };
  }

  // 선택 초기화
  function resetSelection() {
    rect = null; drag = null;
    sel.hidden = true; dlBtn.disabled = true;
    info.textContent = '영역을 드래그하세요';
  }

  // --- 크롭 & 다운로드 ---------------------------------------------------
  dlBtn.addEventListener('click', () => {
    if (!rect) return;
    const c = toNatural();
    const canvas = document.createElement('canvas');
    canvas.width = c.w; canvas.height = c.h;
    canvas.getContext('2d')
      .drawImage(img, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h);
    canvas.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${baseName}_${c.x}_${c.y}.png`;   // 파일명_posX_posY.png
      a.click();
      URL.revokeObjectURL(a.href);
    }, 'image/png');
  });

  // 다른 이미지 선택: 초기 상태로 복귀
  resetBtn.addEventListener('click', () => {
    stage.hidden = true; drop.hidden = false;
    fileInput.value = ''; img.removeAttribute('src');
    resetSelection();
  });
})();
