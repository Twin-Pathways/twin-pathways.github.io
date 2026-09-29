import Section from './components/Section.jsx';
import EdgeDemo from './components/EdgeDemo.jsx';
import GeneNetwork3D from './components/GeneNetwork3D.jsx';
import content from './content.json';

const { site, about, team, advisors, reports } = content;

function TeamLine({ list }) {
  return (
    <ul className="team-row">
      {list.map((p, i) => (
        <li key={i}>
          {p.link ? <a href={p.link} target="_blank" rel="noreferrer">{p.name}</a> : p.name}
        </li>
      ))}
    </ul>
  );
}

function People({ list }) {
  return (
    <ul className="people">
      {list.map((p, i) => (
        <li key={i}>
          {p.link ? (
            <a className="people__name" href={p.link} target="_blank" rel="noreferrer">{p.name}</a>
          ) : (
            <span className="people__name">{p.name}</span>
          )}
          {(p.role || p.affiliation) && (
            <span className="people__role">
              {p.role}
              {p.affiliation && <small>{p.affiliation}</small>}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function App() {
  const peopleSections = [
    { id: 'team', title: 'Team', list: team, note: `${site.team}, ${site.university}.` },
    { id: 'advisors', title: 'Advisors', list: advisors },
  ].filter((s) => s.list.length > 0);

  return (
    <>
      <nav className="nav">
        <a className="nav__brand" href="#top">
          {site.team}
        </a>
        <ul className="nav__links">
          <li><a href="#about">About</a></li>
          {peopleSections.map((s) => (
            <li key={s.id}><a href={`#${s.id}`}>{s.title}</a></li>
          ))}
          {reports.length > 0 && <li><a href="#reports">Reports</a></li>}
        </ul>
      </nav>

      <header className="hero" id="top">
        <div className="hero__copy">
          <h1>{site.project}</h1>
          <p className="hero__tagline">{site.tagline}</p>
          <p className="hero__headline">{site.headline}</p>
          <p className="hero__sub">{site.intro}</p>
          <div className="hero__actions">
            <a className="button" href="#about">About the software</a>
            {reports.length > 0 && <a className="textlink" href="#reports">Reports</a>}
          </div>
          <p className="hero__meta">
            A {site.course} project at {site.university}.
          </p>
        </div>
        <EdgeDemo />
      </header>

      <main>
        <Section id="about" title="About" wide>
          <div className="about">
            <div className="about__text">
              {about.summary.map((p, i) => (
                <p key={i} className={i === 0 ? 'lead' : 'body'}>{p}</p>
              ))}
            </div>
            <GeneNetwork3D />
          </div>
        </Section>

        {peopleSections.map((s) => (
          <Section key={s.id} id={s.id} title={s.title} note={s.note} wide={s.id === 'team'}>
            {s.id === 'team' ? <TeamLine list={s.list} /> : <People list={s.list} />}
          </Section>
        ))}

        {reports.length > 0 && (
          <Section id="reports" title="Reports">
            <ul className="reports">
              {reports.map((r, i) => (
                <li key={i}>
                  {r.href ? (
                    <a href={r.href}>
                      <span className="reports__title">{r.title}</span>
                      <span className="reports__kind">Open</span>
                    </a>
                  ) : (
                    <div className="reports__pending">
                      <span className="reports__title">{r.title}</span>
                      <span className="reports__kind">Coming soon</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}
      </main>

      <footer className="footer">
        <p>{site.team}, {site.course}, {site.university}.</p>
      </footer>
    </>
  );
}
