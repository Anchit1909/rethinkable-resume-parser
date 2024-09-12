import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Profile from "./components/Profile";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/profile/:memberId" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;
