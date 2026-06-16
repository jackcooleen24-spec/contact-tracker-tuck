import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import './App.css'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const APP_PASSWORD = 'richard'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const CATEGORIES = ['Connection Request', 'Internal', 'Client', 'Friend', 'Talent Sourcing']
const IMPORTANCE_LEVELS = ['Low', 'Medium', 'High']

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(false)
  const [newItemTitle, setNewItemTitle] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0])
  const [selectedImportance, setSelectedImportance] = useState(IMPORTANCE_LEVELS[0])

  useEffect(() => {
    if (isAuthenticated) {
      loadContacts()
      subscribeToChanges()
    }
  }, [isAuthenticated])

  const loadContacts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setContacts(data || [])
    } catch (error) {
      console.error('Error loading contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToChanges = () => {
    const subscription = supabase
      .channel('contacts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, (payload) => {
        loadContacts()
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }

  const handleLogin = (e) => {
    e.preventDefault()
    if (password === APP_PASSWORD) {
      setIsAuthenticated(true)
      setPassword('')
    } else {
      alert('Invalid password')
      setPassword('')
    }
  }

  const addContact = async (e) => {
    e.preventDefault()
    if (!newItemTitle.trim()) return

    try {
      const { error } = await supabase.from('contacts').insert([
        {
          title: newItemTitle,
          category: selectedCategory,
          importance: selectedImportance,
        },
      ])

      if (error) throw error
      setNewItemTitle('')
      setSelectedCategory(CATEGORIES[0])
      setSelectedImportance(IMPORTANCE_LEVELS[0])
    } catch (error) {
      console.error('Error adding contact:', error)
      alert('Failed to add item')
    }
  }

  const deleteContact = async (id) => {
    try {
      const { error } = await supabase.from('contacts').delete().eq('id', id)
      if (error) throw error
    } catch (error) {
      console.error('Error deleting contact:', error)
      alert('Failed to delete item')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>Contrack Tracker</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <button type="submit">Login</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Contrack Tracker</h1>
        <button className="logout-btn" onClick={() => setIsAuthenticated(false)}>
          Logout
        </button>
      </header>

      <div className="content">
        <div className="add-section">
          <form onSubmit={addContact}>
            <input
              type="text"
              placeholder="Add new item..."
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
            />
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select value={selectedImportance} onChange={(e) => setSelectedImportance(e.target.value)}>
              {IMPORTANCE_LEVELS.map((imp) => (
                <option key={imp} value={imp}>
                  {imp}
                </option>
              ))}
            </select>
            <button type="submit">Add</button>
          </form>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="tracker-grid">
            {CATEGORIES.map((category) => (
              <div key={category} className="category-column">
                <h2>{category}</h2>
                {IMPORTANCE_LEVELS.map((importance) => {
                  const items = contacts.filter(
                    (c) => c.category === category && c.importance === importance
                  )
                  return (
                    <div key={`${category}-${importance}`} className="importance-section">
                      <h3 className={`importance-header importance-${importance.toLowerCase()}`}>
                        {importance}
                      </h3>
                      <div className="items-list">
                        {items.length === 0 ? (
                          <div className="empty-state">No items</div>
                        ) : (
                          items.map((item) => (
                            <div key={item.id} className="item">
                              <span>{item.title}</span>
                              <button
                                className="delete-btn"
                                onClick={() => deleteContact(item.id)}
                                title="Delete"
                              >
                                ×
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
