export default function About() {
  return (
    <main style={{padding:'2rem'}}>
      <h1>About this deployment</h1>
      <p data-testid="about-marker">This route exists to prove the server fallback: refresh here and the page must still render.</p>
    </main>
  )
}
