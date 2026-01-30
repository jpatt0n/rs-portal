function SpaceBackdrop() {
  return (
    <>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_#1b2232_0%,_#0b1019_45%,_#06080c_100%)]" />
      <div className="absolute inset-0 -z-10 opacity-35 bg-[radial-gradient(circle,_rgba(255,255,255,0.08)_1px,_transparent_1px)] [background-size:140px_140px]" />
      <div className="absolute -top-24 right-[-10%] h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(74,75,200,0.35)_0%,_rgba(74,75,200,0)_70%)] blur-3xl" />
      <div className="absolute bottom-[-8rem] left-[-8rem] h-96 w-96 rounded-full bg-[radial-gradient(circle,_rgba(75,210,198,0.25)_0%,_rgba(75,210,198,0)_70%)] blur-3xl" />
    </>
  )
}

export default SpaceBackdrop
