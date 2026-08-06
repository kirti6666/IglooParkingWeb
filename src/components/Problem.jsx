/**
 * Fold 2. The brief's copy is used verbatim, but split into its three pain
 * fragments and the resolution, so the section has a shape: three small
 * complaints, then the answer set large. One flat paragraph buried the point.
 */

const PAINS = [
  'Circling the block.',
  'Overpaying at a lot.',
  'A driveway that sits empty all day while you pay for gym parking.',
]

export default function Problem() {
  return (
    <section className="fold problem">
      <div className="shell problem__inner reveal">
        <p className="eyebrow">The problem</p>
        <h2 className="h-section problem__title">
          Parking shouldn&rsquo;t be this hard.
        </h2>

        <ul className="problem__pains">
          {PAINS.map((pain) => (
            <li className="problem__pain" key={pain}>
              {pain}
            </li>
          ))}
        </ul>

        <p className="problem__answer">
          Igloo fixes both sides of the problem — in one app.
        </p>
      </div>
    </section>
  )
}
