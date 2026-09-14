import { useState, useEffect } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import axios from 'axios'
import './App.css'

const API_URL = 'http://localhost:8000/api/v1'

function ResponsibleAIDisclaimer() {
  return (
    <div style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '10px', borderRadius: '5px', marginTop: '20px' }}>
      <strong>Responsible AI Disclosure:</strong> AI answer evaluation is advisory and not equivalent to official faculty grading. 
      AI-generated tutoring content and topic importance estimates may contain errors and do not guarantee future examination contents. 
      Low-confidence evaluations may require human review.
    </div>
  )
}

function FacultyDashboard({ token }: { token: string }) {
  const [students, setStudents] = useState<any[]>([])
  const [evaluations, setEvaluations] = useState<any[]>([])

  useEffect(() => {
    axios.get(`${API_URL}/faculty/students`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setStudents(res.data))
      .catch(console.error)
      
    axios.get(`${API_URL}/faculty/evaluations/review`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setEvaluations(res.data))
      .catch(console.error)
  }, [token])

  const overrideEval = (id: number) => {
    const marks = prompt("Enter final marks:")
    const reason = prompt("Enter override reason:")
    if(marks && reason) {
      axios.put(`${API_URL}/faculty/evaluations/${id}/override`, { final_marks: parseFloat(marks), override_reason: reason }, { headers: { Authorization: `Bearer ${token}` } })
        .then(() => alert("Overridden successfully"))
        .catch(() => alert("Error overriding"))
    }
  }

  return (
    <div>
      <h2>Faculty Dashboard</h2>
      <h3>Your Students</h3>
      <ul>{students.map(s => <li key={s.id}>{s.full_name} ({s.email})</li>)}</ul>
      
      <h3>Evaluations Requiring Review</h3>
      <ul>
        {evaluations.map(e => (
          <li key={e.evaluation_id}>
            Eval ID: {e.evaluation_id} | Marks: {e.obtained_marks} | Confidence: {e.confidence_score}
            <button onClick={() => overrideEval(e.evaluation_id)} style={{marginLeft: 10}}>Override</button>
          </li>
        ))}
      </ul>
      <ResponsibleAIDisclaimer />
    </div>
  )
}

function StudentDashboard({ token }: { token: string }) {
  return (
    <div>
      <h2>Student Dashboard</h2>
      <p>Welcome, Student! Here you can view your study plans, upload answers to mock exams, and see AI evaluations.</p>
      <p><em>(Student features are powered by the backend API and AI Tutor endpoints.)</em></p>
      <ResponsibleAIDisclaimer />
    </div>
  )
}

function AdminDashboard({ token }: { token: string }) {
  const [health, setHealth] = useState<any>({})
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    axios.get(`${API_URL}/admin/health`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setHealth(res.data))
      .catch(console.error)
      
    axios.get(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setUsers(res.data))
      .catch(console.error)
  }, [token])

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <h3>System Health</h3>
      <pre>{JSON.stringify(health, null, 2)}</pre>
      
      <h3>Users</h3>
      <ul>{users.map(u => <li key={u.id}>{u.email} - Role: {u.role}</li>)}</ul>
    </div>
  )
}

function App() {
  const [token, setToken] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('STUDENT')

  const login = (e: any) => {
    e.preventDefault()
    const data = new URLSearchParams()
    data.append('username', email)
    data.append('password', password)
    
    axios.post(`${API_URL}/auth/login`, data)
      .then(res => {
        setToken(res.data.access_token)
        // Decrypt or assume role based on login - we'll just check health endpoint to detect admin, or assume Faculty.
        // For simplicity, we just use the UI state to know where to navigate.
      })
      .catch(() => alert("Login failed"))
  }

  return (
    <Router>
      <div style={{ padding: '20px' }}>
        <h1>ExamIQ Platform</h1>
        {!token ? (
          <form onSubmit={login}>
            <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option value="STUDENT">Student</option>
              <option value="FACULTY">Faculty</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button type="submit">Login</button>
          </form>
        ) : (
          <div>
            <button onClick={() => setToken('')}>Logout</button>
            {role === 'FACULTY' && <FacultyDashboard token={token} />}
            {role === 'ADMIN' && <AdminDashboard token={token} />}
            {role === 'STUDENT' && <StudentDashboard token={token} />}
          </div>
        )}
      </div>
    </Router>
  )
}

export default App
