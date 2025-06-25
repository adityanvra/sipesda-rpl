import React, { createContext, useContext, useEffect, useState } from 'react';
import DatabaseManager from '../utils/database';

interface DatabaseContextType {
  db: DatabaseManager | null;
  isLoading: boolean;
}

const DatabaseContext = createContext<DatabaseContextType>({ db: null, isLoading: true });

export const useDatabaseContext = () => useContext(DatabaseContext);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<DatabaseManager | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initDb = async () => {
      const dbInstance = new DatabaseManager();
      setDb(dbInstance);
      setIsLoading(false);
    };

    initDb();

    return () => {
    };
  }, []);

  return (
    <DatabaseContext.Provider value={{ db, isLoading }}>
      {children}
    </DatabaseContext.Provider>
  );
}; 