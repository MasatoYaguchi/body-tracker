import { Profiler, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    // パフォーマンス測定
    <Profiler
      id="BodyTrackerApp"
      onRender={(_id, _phase, actualDuration) => {
        console.log('Render time:', actualDuration);
      }}
    >
      <StrictMode>
        <App />
      </StrictMode>
    </Profiler>,
  );
}
