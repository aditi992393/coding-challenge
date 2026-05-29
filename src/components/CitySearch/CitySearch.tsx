import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useCitySearch } from "@/features/city-search/useCitySearch";
import { useCityStore } from "@/store/useCityStore";
import { Spinner } from "@/components/common/Spinner";
import type { City } from "@/types";

/**
 * Accessible combobox for dynamic city search.
 *
 * Implements the WAI-ARIA 1.2 combobox-with-listbox pattern:
 *  - `role="combobox"` on the input
 *  - `role="listbox"` on the suggestions panel
 *  - `aria-activedescendant` to track the highlighted option
 *  - Arrow Up/Down to navigate, Enter to select, Escape to close
 */
export function CitySearch() {
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const debounced = useDebounce(input, 250);
  const { data, isFetching, isError, error } = useCitySearch(debounced);
  const selectCity = useCityStore((s) => s.selectCity);
  const selectedCity = useCityStore((s) => s.selectedCity);
  const listboxId = useId();
  const optionIdPrefix = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close suggestion list when clicking outside the combobox.
  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const results = data ?? [];
  const showPanel =
    isOpen &&
    debounced.trim().length >= 2 &&
    (isFetching || isError || results.length >= 0);

  function handleSelect(city: City) {
    selectCity(city);
    setInput(`${city.name}${city.admin1 ? ", " + city.admin1 : ""}, ${city.country}`);
    setIsOpen(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      setHighlight((h) => Math.min(results.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      if (results[highlight]) {
        e.preventDefault();
        handleSelect(results[highlight]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <label
        htmlFor="city-search-input"
        className="mb-1.5 block text-sm font-medium text-slate-700"
      >
        Where are you headed?
      </label>
      <div className="relative">
        <input
          id="city-search-input"
          type="text"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            showPanel && results[highlight]
              ? `${optionIdPrefix}-${results[highlight].id}`
              : undefined
          }
          autoComplete="off"
          spellCheck={false}
          placeholder="Try London, Tokyo, Reykjavík…"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setIsOpen(true);
            setHighlight(0);
            if (selectedCity) selectCity(null);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={onKeyDown}
          className="focus-ring w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400"
        />
        {isFetching ? (
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <Spinner size="sm" label="Searching cities" />
          </div>
        ) : null}
      </div>

      {showPanel ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="City suggestions"
          className="absolute z-10 mt-1 max-h-80 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg"
        >
          {isError ? (
            <li
              role="option"
              aria-selected={false}
              className="px-4 py-3 text-sm text-red-700"
            >
              Unable to load suggestions: {error instanceof Error ? error.message : "Unknown error"}
            </li>
          ) : results.length === 0 && !isFetching ? (
            <li
              role="option"
              aria-selected={false}
              className="px-4 py-3 text-sm text-slate-500"
            >
              No cities match “{debounced}”. Try a different spelling.
            </li>
          ) : (
            results.map((city, i) => (
              <li
                key={city.id}
                id={`${optionIdPrefix}-${city.id}`}
                role="option"
                aria-selected={i === highlight}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(city);
                }}
                className={`cursor-pointer px-4 py-2.5 text-sm ${
                  i === highlight
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="font-medium">{city.name}</div>
                <div className="text-xs text-slate-500">
                  {[city.admin1, city.country].filter(Boolean).join(", ")}
                </div>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
