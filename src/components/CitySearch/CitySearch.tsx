import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useCitySearch } from "@/features/city-search/useCitySearch";
import { useCityStore } from "@/store/useCityStore";
import { Spinner } from "@/components/common/Spinner";
import type { City } from "@/types";
import styles from "./CitySearch.module.css";

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
  const { cities, loading, error } = useCitySearch(debounced);
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

  const showPanel = isOpen && debounced.trim().length >= 2;

  function handleSelect(city: City) {
    selectCity(city);
    setInput(
      `${city.name}${city.admin1 ? ", " + city.admin1 : ""}, ${city.country}`,
    );
    setIsOpen(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      setHighlight((h) => Math.min(cities.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      if (cities[highlight]) {
        e.preventDefault();
        handleSelect(cities[highlight]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className={styles.container}>
      <label htmlFor="city-search-input" className={styles.label}>
        Where are you headed?
      </label>
      <div className={styles.inputWrapper}>
        <input
          id="city-search-input"
          type="text"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            showPanel && cities[highlight]
              ? `${optionIdPrefix}-${cities[highlight].id}`
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
          className={styles.input}
        />
        {loading ? (
          <div className={styles.spinnerSlot}>
            <Spinner size="sm" label="Searching cities" />
          </div>
        ) : null}
      </div>

      {showPanel ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="City suggestions"
          className={styles.listbox}
        >
          {error ? (
            <li role="option" aria-selected={false} className={styles.optionError}>
              Unable to load suggestions: {error.message}
            </li>
          ) : cities.length === 0 && !loading ? (
            <li role="option" aria-selected={false} className={styles.optionEmpty}>
              No cities match “{debounced}”. Try a different spelling.
            </li>
          ) : (
            cities.map((city, i) => (
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
                className={`${styles.option} ${
                  i === highlight ? styles.optionActive : ""
                }`}
              >
                <div className={styles.optionTitle}>{city.name}</div>
                <div className={styles.optionMeta}>
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
