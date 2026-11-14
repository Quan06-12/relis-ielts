import './Skeleton.css'

// Grey shimmering placeholders shown while data loads, instead of the text "Đang tải…".
// Useful on the deployed site, where the free server can take ~50 s to wake up.

export function SkeletonRows({ count = 3 }) {
  return (
    <div className="skeleton-rows" aria-busy="true" aria-label="Đang tải">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="skeleton skeleton-row" />
      ))}
    </div>
  )
}

export function SkeletonCards({ count = 3 }) {
  return (
    <div className="skeleton-cards" aria-busy="true" aria-label="Đang tải">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="skeleton skeleton-card" />
      ))}
    </div>
  )
}
