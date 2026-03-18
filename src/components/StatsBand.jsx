import { useEffect, useRef, useState } from "react";
import "./StatsBand.css";

const STATS = [
  { val: 350, suf: "+", label: "Propiedades vendidas" },
  { val: 8, suf: "", label: "Años de experiencia" },
  { val: 98, suf: "%", label: "Clientes satisfechos" },
  { val: 12, suf: "", label: "Departamentos" },
];

function Counter({ val, suf, label }) {
  const [n, setN] = useState(0);
  const ref = useRef(null);
  const done = useRef(false);

  useEffect(() => {
    const ob = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !done.current) {
          done.current = true;
          let cur = 0;
          const step = Math.ceil(val / 50);
          const id = setInterval(() => {
            cur += step;
            if (cur >= val) {
              setN(val);
              clearInterval(id);
            } else setN(cur);
          }, 28);
        }
      },
      { threshold: 0.4 },
    );
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, [val]);

  return (
    <div ref={ref} className="stats-band__item">
      <span className="stats-band__accent" aria-hidden="true" />
      <div className="stats-band__number">
        {n}
        {suf}
      </div>
      <div className="stats-band__label">{label}</div>
    </div>
  );
}

export default function StatsBand() {
  return (
    <section className="stats-band" aria-label="Indicadores de la inmobiliaria">
      <div className="stats-band__inner">
        {STATS.map((s) => (
          <Counter key={s.label} {...s} />
        ))}
      </div>
    </section>
  );
}
