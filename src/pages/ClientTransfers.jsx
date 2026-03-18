import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ClientTransfers() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/transfers/new', { replace: true });
  }, [navigate]);
  return null;
}
