export default function PageSkeleton() {
  return (
    <>
      <div className="skel-kpis">
        {[0, 1, 2, 3].map(key => (
          <div key={key} className="skeleton" />
        ))}
      </div>

      <div className="skel-cols">
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    </>
  )
}
