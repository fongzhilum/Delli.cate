import { Outlet } from 'react-router';
import { DataProvider } from '../context/DataContext';

export function Layout() {
  return (
    <DataProvider>
      <Outlet />
    </DataProvider>
  );
}
