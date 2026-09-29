export default function Section({ id, title, note, wide, children }) {
  return (
    <section id={id} className={`section${wide ? ' section--wide' : ''}`}>
      <header className="section__head">
        <h2>{title}</h2>
        {note && <p>{note}</p>}
      </header>
      <div className="section__body">{children}</div>
    </section>
  );
}
