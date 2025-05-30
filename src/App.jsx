import { useState } from 'react';
import Links from './links/Links'
import PostList from './viewers/PostList'
import PostViewer from './viewers/PostViewer'
import Modal from './modal/Modal'
import './App.scss'
import './modal/Modal.scss'

function App() {
  const [selectedPost, setSelectedPost] = useState(null);

  return (
    <>
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
      <PostList onSelect={setSelectedPost} />
      <Modal open={!!selectedPost} onClose={() => setSelectedPost(null)} title={selectedPost?.title}>
        {selectedPost && <PostViewer filename={selectedPost.path.replace(/\.md$/, '')} />}
      </Modal>
    </div>
      <div className='footer'>
      {`> the brave shall inherit the earth`}
    </div>
    </>
  )
}

export default App
