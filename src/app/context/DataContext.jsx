import { createContext, useContext, useState, useEffect } from 'react';
import { mockPersons } from '../data/mockData.js';

const DataContext = createContext();

const defaultWorkers = ['Sarah Chen', 'James Patterson', 'Michael Torres', 'Lisa Anderson'];

export function DataProvider({ children }) {
  const [persons, setPersons] = useState(() => {
    // Try to load from localStorage first
    const saved = localStorage.getItem('dellicate_persons');
    if (saved) {
      return JSON.parse(saved);
    }
    return mockPersons;
  });

  const [workers, setWorkers] = useState(() => {
    const saved = localStorage.getItem('dellicate_workers');
    if (saved) {
      return JSON.parse(saved);
    }
    return defaultWorkers;
  });

  // Save to localStorage whenever persons change
  useEffect(() => {
    localStorage.setItem('dellicate_persons', JSON.stringify(persons));
  }, [persons]);

  // Save workers to localStorage
  useEffect(() => {
    localStorage.setItem('dellicate_workers', JSON.stringify(workers));
  }, [workers]);

  const addPerson = (person) => {
    setPersons(prev => [...prev, person]);
  };

  const updatePerson = (id, updates) => {
    setPersons(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePerson = (id) => {
    setPersons(prev => prev.filter(p => p.id !== id));
  };

  const addWorker = (workerName) => {
    if (!workers.includes(workerName)) {
      setWorkers(prev => [...prev, workerName]);
    }
  };

  const updateWorker = (oldName, newName) => {
    setWorkers(prev => prev.map(w => w === oldName ? newName : w));
    // Update all persons assigned to this worker
    setPersons(prev => prev.map(p => 
      p.assignedWorker === oldName ? { ...p, assignedWorker: newName } : p
    ));
  };

  const deleteWorker = (workerName) => {
    setWorkers(prev => prev.filter(w => w !== workerName));
    // Note: We don't delete persons, just leave them with their current worker assignment
  };

  return (
    <DataContext.Provider value={{ 
      persons, 
      addPerson, 
      updatePerson, 
      deletePerson,
      workers,
      addWorker,
      updateWorker,
      deleteWorker
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
