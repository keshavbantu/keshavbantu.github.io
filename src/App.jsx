import { useCallback, useState } from 'react';
import Home from './home/Home';
import Scene from './scene/Scene';
import Frame from './ui/Frame';
import Reader from './reader/Reader';
import Projects from './projects/Projects';
import Library from './library/Library';
import { usePosts, useRoute, navigate } from './lib/hooks';

function App() {
  const route = useRoute();
  const posts = usePosts();
  const [active, setActive] = useState(null);
  const close = useCallback(() => navigate('#'), []);
  const toLibrary = useCallback(() => navigate('#/log'), []);
  const post = route.name === 'essay' && posts?.find(p => p.slug === route.slug);

  return (
    <>
      {posts && <Scene entries={posts.length} active={active} paused={route.name !== 'home'} />}
      <Frame />
      <Home onPoint={setActive} />
      {route.name === 'library' && posts && <Library posts={posts} onClose={close} />}
      {post && <Reader key={post.slug} post={post} onClose={close} onBack={toLibrary} />}
      {route.name === 'projects' && <Projects onClose={close} />}
    </>
  );
}

export default App;
