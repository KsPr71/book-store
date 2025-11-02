'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import { Search, User, Calendar, ArrowUpAZ, Users } from 'lucide-react';

export type SearchFilterType = 'name' | 'author' | 'year' | null;
export type SortType = 'alphabetical' | 'author' | null;

interface BookSpeedDialProps {
  onSearchBy?: (type: SearchFilterType) => void;
  onSortBy?: (type: SortType) => void;
  currentSearchFilter?: SearchFilterType;
  currentSort?: SortType;
}

export default function BookSpeedDial({
  onSearchBy,
  onSortBy,
  currentSearchFilter,
  currentSort,
}: BookSpeedDialProps) {
  const [open, setOpen] = React.useState(false);

  const searchActions = [
    { 
      icon: <Search />, 
      name: 'Buscar por Nombre', 
      type: 'name' as SearchFilterType,
      onClick: () => onSearchBy?.('name'),
      active: currentSearchFilter === 'name'
    },
    { 
      icon: <User />, 
      name: 'Buscar por Autor', 
      type: 'author' as SearchFilterType,
      onClick: () => onSearchBy?.('author'),
      active: currentSearchFilter === 'author'
    },
    { 
      icon: <Calendar />, 
      name: 'Buscar por Año', 
      type: 'year' as SearchFilterType,
      onClick: () => onSearchBy?.('year'),
      active: currentSearchFilter === 'year'
    },
  ];

  const sortActions = [
    { 
      icon: <ArrowUpAZ />, 
      name: 'Ordenar Alfabéticamente', 
      type: 'alphabetical' as SortType,
      onClick: () => onSortBy?.('alphabetical'),
      active: currentSort === 'alphabetical'
    },
    { 
      icon: <Users />, 
      name: 'Ordenar por Autor', 
      type: 'author' as SortType,
      onClick: () => onSortBy?.('author'),
      active: currentSort === 'author'
    },
  ];

  const allActions = [...searchActions, ...sortActions];

  return (
    <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}>
      <SpeedDial
        ariaLabel="Opciones de búsqueda y ordenamiento"
        sx={{ position: 'relative' }}
        icon={<SpeedDialIcon />}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        direction="up"
      >
        {allActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={() => {
              action.onClick();
              setOpen(false);
            }}
            sx={{
              backgroundColor: action.active ? 'rgba(34, 197, 94, 0.2)' : undefined,
              '&:hover': {
                backgroundColor: action.active ? 'rgba(34, 197, 94, 0.3)' : undefined,
              },
            }}
          />
        ))}
      </SpeedDial>
    </Box>
  );
}
