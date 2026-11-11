/**
 * "Lugares a premiar" selector of an award card: re-renders one prize input per
 * place, keeping the values the user already typed and the array naming
 * (`…[prize_amounts][]`) the backend expects.
 */
export function wirePlacesSelector(card: HTMLElement): void {
  const select = card.querySelector<HTMLSelectElement>('[data-name="num_places"]');
  const list = card.querySelector<HTMLElement>('[data-prizes-list]');
  if (!select || !list) return;

  const firstInput = list.querySelector<HTMLInputElement>('input[data-name="prize_amount"]');
  const namingPrefix = firstInput?.name.replace(/\[\]$/, '') || 'prize_amounts';

  function render(places: number) {
    const currentValues = new Map<number, string>();
    list!.querySelectorAll<HTMLElement>('[data-prize-row]').forEach((row) => {
      const place = Number(row.dataset.place);
      const input = row.querySelector<HTMLInputElement>('input[data-name="prize_amount"]');
      if (input) currentValues.set(place, input.value);
    });

    list!.innerHTML = '';
    for (let place = 1; place <= places; place++) {
      const row = document.createElement('div');
      row.className = 'flex items-center gap-3';
      row.dataset.prizeRow = '';
      row.dataset.place = String(place);

      const badge = document.createElement('span');
      badge.className =
        'inline-flex items-center justify-center h-7 w-7 rounded-full bg-amber-100 text-amber-700 text-xs font-bold shrink-0';
      badge.textContent = `${place}°`;

      const label = document.createElement('label');
      label.className = 'text-xs text-muted-foreground shrink-0 w-20';
      label.textContent = `Lugar ${place}`;

      const input = document.createElement('input');
      input.type = 'number';
      input.placeholder = '0.00';
      input.step = '0.01';
      input.min = '0';
      input.dataset.name = 'prize_amount';
      input.dataset.place = String(place);
      input.className =
        'flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none flex-1';

      const previous = currentValues.get(place);
      if (previous !== undefined) input.value = previous;
      input.name = `${namingPrefix}[]`;

      row.appendChild(badge);
      row.appendChild(label);
      row.appendChild(input);
      list!.appendChild(row);
    }
  }

  render(Number(select.value) || 3);
  select.addEventListener('change', () => {
    render(Math.max(1, Math.min(10, Number(select.value) || 1)));
  });
}
