/**
 * Visual icon bar for runner-kit cards. The catalog is injected by the page as
 * `<script type="application/json" id="kit-icon-catalog">`, so this module only
 * renders the tiles and keeps the hidden input in sync.
 */

export interface KitIcon {
  value: string;
  label: string;
  svg: string;
}

export function readKitIcons(doc: Document = document): KitIcon[] {
  try {
    return JSON.parse(doc.getElementById('kit-icon-catalog')?.textContent ?? '[]') ?? [];
  } catch {
    return [];
  }
}

export function renderKitIconBar(
  slot: HTMLElement,
  hiddenInput: HTMLInputElement,
  icons: KitIcon[] = readKitIcons(),
): void {
  slot.innerHTML = '';
  icons.forEach(({ value, label, svg }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', label);
    button.title = label;
    button.dataset.iconValue = value;
    button.className =
      'h-11 w-11 inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all';

    // Inline SVG (no <img>) so currentColor + dynamic classes work.
    const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgElement.setAttribute('viewBox', '0 0 24 24');
    svgElement.setAttribute('fill', 'none');
    svgElement.setAttribute('stroke', 'currentColor');
    svgElement.setAttribute('stroke-width', '1.75');
    svgElement.setAttribute('stroke-linecap', 'round');
    svgElement.setAttribute('stroke-linejoin', 'round');
    svgElement.setAttribute('width', '22');
    svgElement.setAttribute('height', '22');
    svgElement.setAttribute('aria-hidden', 'true');
    svgElement.innerHTML = svg;
    button.appendChild(svgElement);

    button.addEventListener('click', () => {
      hiddenInput.value = value;
      slot.querySelectorAll('button').forEach((candidate) => {
        candidate.classList.remove(
          'bg-blue-600',
          'text-white',
          'border-blue-600',
          'shadow-md',
          'scale-105',
        );
        candidate.classList.add('bg-white', 'text-zinc-600');
      });
      button.classList.add('bg-blue-600', 'text-white', 'border-blue-600', 'shadow-md', 'scale-105');
      button.classList.remove('bg-white', 'text-zinc-600');
    });

    slot.appendChild(button);
  });
}
