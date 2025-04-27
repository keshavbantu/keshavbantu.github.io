import './App.scss'
import Links from './links/Links'

function App() {
  return (
    <div className='container'>
      <div className='header'>
        <h1>Keshav Bantwal</h1>
        <p><span>[alias]</span> bantuboi · notbantuboi · cy3erg33k · keshav bantu</p>
      </div>
      <div className='subtext'>
        <p>{`< Engineer. Builder. Artisan. />`}</p>
      </div>
      <Links />
      <div className='blog'>
        <h1>Blog</h1>
      </div>
    </div>
  )
}

export default App
