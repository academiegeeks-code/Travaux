import { useState, useEffect } from 'react';
import api from '../../../api/api';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await api.get('users/', {
          headers: { Authorization: `Bearer ${localStorage.getItem('access')}` },
        });
        const normalizedUsers = (response.data.results || []).map(user => ({
          ...user,
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          status: user.is_active ? 'Actif' : 'Inactif',
          // Ajoutez d'autres normalisations si nécessaire (ex. trainees)
        }));
        setUsers(normalizedUsers);
      } catch (error) {
        console.error("Erreur lors du chargement des utilisateurs :", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      setSelected(users.map((n) => n.id));
      return;
    }
    setSelected([]);
  };

  const handleClick = (id) => {
    setSelected((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return [...newSelected];
    });
  };

  const isSelected = (id) => selected.includes(id);

  const addUser = (newUser) => {
    setUsers((prev) => [...prev, newUser]);
  };

  return {
    users,
    loading,
    selected,
    handleSelectAllClick,
    handleClick,
    isSelected,
    addUser,
    setSelected,
  };
}; export default useUsers;