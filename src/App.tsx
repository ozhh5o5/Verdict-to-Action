import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import JudgmentList from './pages/JudgmentList'
import JudgmentDetail from './pages/JudgmentDetail'
import ObligationList from './pages/ObligationList'
import ObligationDetail from './pages/ObligationDetail'
import ContemptRisk from './pages/ContemptRisk'
import Escalation from './pages/Escalation'
import NewJudgment from './pages/NewJudgment'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/judgments" element={<JudgmentList />} />
        <Route path="/judgments/new" element={<NewJudgment />} />
        <Route path="/judgments/:id" element={<JudgmentDetail />} />
        <Route path="/obligations" element={<ObligationList />} />
        <Route path="/obligations/:id" element={<ObligationDetail />} />
        <Route path="/contempt-risk" element={<ContemptRisk />} />
        <Route path="/escalation" element={<Escalation />} />
      </Routes>
    </Router>
  )
}

export default App
