import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// あなたのFirebase設定情報（先ほどコピーしたもの）
const firebaseConfig = {
  apiKey: "AIzaSyCB5rM4oUkLuuLPM_cMFJDQGc1Pv8DKXX8",
  authDomain: "scoreboard-92ed4.firebaseapp.com",
  databaseURL: "https://scoreboard-92ed4-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "scoreboard-92ed4",
  storageBucket: "scoreboard-92ed4.firebasestorage.app",
  messagingSenderId: "750368859512",
  appId: "1:750368859512:web:da4cd7882aec1d7fe0948d",
  measurementId: "G-VMCQBXTVFP"
};

// Firebaseを初期化
const app = initializeApp(firebaseConfig);

// Realtime Databaseのインスタンスを取得
export const database = getDatabase(app);
