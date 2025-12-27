import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  const [list, setList] = useState([]);

  useEffect(() => {
    window.blazeAPI.getQuarantineList().then(setList);
  }, []);

  async function restore(id) {
    await window.blazeAPI.restoreFile(id);
    setList(await window.blazeAPI.getQuarantineList());
  }

  async function remove(id) {
    await window.blazeAPI.deleteFile(id);
    setList(await window.blazeAPI.getQuarantineList());
  }

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Blaze Fire Wall</h1>
      <p>Ateş animasyonu buraya gelecek (Lottie placeholder)</p>
      <h2>Karantina</h2>
      <ul>
        {list.map(item => (
          <li key={item.id} style={{ marginBottom: 8 }}>
            <strong>{item.filename}</strong> — {item.originalPath} — {new Date(item.time).toLocaleString()}
            <div>
              <button onClick={() => restore(item.id)}>Geri Yükle</button>
              <button onClick={() => remove(item.id)} style={{ marginLeft: 8 }}>Sil</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
export default App;
