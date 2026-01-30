function SpaceBackdrop() {
  return (
    <>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_#1b2232_0%,_#0b1019_45%,_#06080c_100%)]" />
      <div className="absolute inset-0 -z-10 opacity-35 bg-[radial-gradient(circle,_rgba(255,255,255,0.08)_1px,_transparent_1px)] [background-size:140px_140px]" />
    </>
  )
}

export default SpaceBackdrop
